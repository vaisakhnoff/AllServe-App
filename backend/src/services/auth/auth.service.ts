import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { IAuthRepository } from "../../interfaces/auth/IAuthRepository";
import { IAuthService } from "../../interfaces/auth/IAuthService";
import { SignupDto, LoginDto } from "../../dto/auth/auth.dto";
import { Messages } from "../../shared/constants/messages";
import { AppError } from "../../shared/errors/AppError";
import { NotFoundError, BadRequestError, UnauthorizedError, ForbiddenError } from "../../shared/errors/HttpErrors";

import {
    OTP_EXPIRY_MS,
    BCRYPT_SALT_ROUNDS,
    ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_EXPIRY,
    REFRESH_TOKEN_EXPIRY_MS,
} from "../../shared/constants/config";

import { env } from "../../config/env";
import { generateOtp } from "../../shared/utils/generateOtp";
import { sendEmail } from "../../shared/utils/sendEmail";
import { logger } from "../../shared/logger/logger";
import { Role } from "../../shared/enums/role.enum";
import { AuthUserPayload } from "../../shared/interfaces/AuthRequest";

export class AuthService implements IAuthService {
    constructor(private repo: IAuthRepository) { }

    async signup(dto: SignupDto) {
        const existing = await this.repo.findByEmail(dto.email);

        if (existing) {
            throw new BadRequestError(Messages.USER_ALREADY_EXISTS);
        }

        const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

        await this.repo.create({
            ...dto,
            password: hashedPassword,
            isVerified: false,
        });

        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

        await this.repo.createOTP(dto.email, otp, expiresAt);
        await sendEmail(dto.email, otp);

        if (dto.phone) {
            const phoneOtp = generateOtp();
            await this.repo.createPhoneOTP(dto.phone, phoneOtp, expiresAt);
            logger.info(`Sending SMS to ${dto.phone}: Your OTP is ${phoneOtp}`);
        }

        logger.info("User signup", { email: dto.email });

        return { message: Messages.OTP_SENT };
    }

    async verifyOtp(email: string, otp: string, phone?: string, phoneOtp?: string) {
        const record = await this.repo.findOTP(email, otp);

        if (!record || record.expiresAt < new Date()) {
            throw new BadRequestError(Messages.EMAIL_OTP_INVALID_OR_EXPIRED);
        }

        if (phone && phoneOtp) {
            const phoneRecord = await this.repo.findPhoneOTP(phone, phoneOtp);
            if (!phoneRecord || phoneRecord.expiresAt < new Date()) {
                throw new BadRequestError(Messages.PHONE_OTP_INVALID_OR_EXPIRED);
            }
            await this.repo.deletePhoneOTP(phone);
        }

        await this.repo.deleteOTP(email);

        const user = await this.repo.findByEmail(email);
        if (!user) throw new NotFoundError(Messages.USER_NOT_FOUND);

        await this.repo.updateUser(user._id.toString(), { isVerified: true });

        return { message: Messages.VERIFIED_SUCCESSFULLY };
    }

    async resendOtp(email?: string, phone?: string) {
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

        if (email) {
            await this.repo.deleteOTP(email);
            const newOtp = generateOtp();
            await this.repo.createOTP(email, newOtp, expiresAt);
            await sendEmail(email, newOtp);
        }

        if (phone) {
            await this.repo.deletePhoneOTP(phone);
            const newPhoneOtp = generateOtp();
            await this.repo.createPhoneOTP(phone, newPhoneOtp, expiresAt);
            logger.info(`Resending SMS to ${phone}: Your OTP is ${newPhoneOtp}`);
        }

        return { message: Messages.OTP_RESENT };
    }

    async login(dto: LoginDto, isOAuth: boolean = false, expectedRole: Role = Role.USER) {
        const user = await this.repo.findByEmail(dto.email);
        if (!user) {
            throw new UnauthorizedError(Messages.INVALID_CREDENTIALS);
        }

        if (user.role !== expectedRole) {
            throw new UnauthorizedError(Messages.CROSS_PLATFORM_LOGIN_BLOCKED);
        }

        if (user.status === "blocked") {
            throw new ForbiddenError(Messages.ACCOUNT_BLOCKED);
        }

        if (!user.isVerified) {
            throw new UnauthorizedError(Messages.EMAIL_NOT_VERIFIED);
        }

        if (!isOAuth) {
            const isMatch = await bcrypt.compare(dto.password, user.password);
            if (!isMatch) {
                throw new UnauthorizedError(Messages.INVALID_CREDENTIALS);
            }
        }

        const accessToken = jwt.sign(
            { id: user._id, role: user.role },
            env.JWT_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRY }
        );
 
        const refreshToken = jwt.sign(
            { id: user._id },
            env.REFRESH_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRY }
        );

        await this.repo.createRefreshToken(
            user._id.toString(),
            refreshToken,
            new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS)
        );

        logger.info("User login", { email: dto.email });

        const userSafe = {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    profileImage: user.profileImage,
    role: user.role,
    isVerified: user.isVerified,
};

  return { user: userSafe, accessToken, refreshToken };

    }

    async forgotPassword(email: string) {
        const user = await this.repo.findByEmail(email);
        if (!user) throw new NotFoundError(Messages.USER_NOT_FOUND);

        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

        await this.repo.createOTP(email, otp, expiresAt);
        await sendEmail(email, otp);

        return { message: Messages.OTP_SENT };
    }

    async resetPassword(email: string, otp: string, newPassword: string) {
        const record = await this.repo.findOTP(email, otp);

        if (!record || record.expiresAt < new Date()) {
            throw new BadRequestError(Messages.OTP_INVALID_OR_EXPIRED);
        }

        const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

        const user = await this.repo.findByEmail(email);
        if (!user) throw new NotFoundError(Messages.USER_NOT_FOUND);

        await this.repo.updateUser(user._id.toString(), { password: hashedPassword });
        await this.repo.deleteOTP(email);

        return { message: Messages.PASSWORD_RESET_SUCCESS };
    }

    async refreshToken(token: string) {
        try {
            const tokenDoc = await this.repo.findRefreshToken(token);
            if (!tokenDoc) throw new UnauthorizedError(Messages.INVALID_TOKEN);

            const decoded = jwt.verify(token, env.REFRESH_SECRET) as AuthUserPayload;
            const user = await this.repo.findById(decoded.id);
            if (!user) throw new NotFoundError(Messages.USER_NOT_FOUND);

            const newAccessToken = jwt.sign(
                { id: decoded.id, role: user.role },
                env.JWT_SECRET,
                { expiresIn: ACCESS_TOKEN_EXPIRY }
            );

            return { accessToken: newAccessToken };
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new UnauthorizedError(Messages.INVALID_REFRESH_TOKEN);
        }
    }

    async logout(token: string) {
        await this.repo.deleteRefreshToken(token);
    }

    async findOrCreateOAuthUser(email: string, displayName: string): Promise<any> {
        let user = await this.repo.findByEmail(email);

        if (!user) {
            user = await this.repo.create({
                name: displayName,
                email: email,
                password: crypto.randomBytes(16).toString("hex"),
                isVerified: true,
            });
        }

        return user;
    }
}
