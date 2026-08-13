import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { IProviderRepository } from "../../interfaces/provider/IProviderRepository";
import { Messages } from "../../shared/constants/messages";
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
import { AppError } from "../../shared/errors/AppError";
import { NotFoundError, BadRequestError, UnauthorizedError } from "../../shared/errors/HttpErrors";
import { ApplicationStatus } from "../../shared/enums/application-status.enum";
import { RefreshTokenPayload } from "../../shared/interfaces/AuthRequest";
import { OTPModel } from "../../models/otp.model";
import { TokenModel } from "../../models/token.model";
import { ProviderSignupDto, ProviderLoginDto } from "../../dto/provider/providerAuth.dto";
import { IProviderAuthService } from "../../interfaces/auth/IProviderAuthService";

export class ProviderAuthService implements IProviderAuthService {
  constructor(private readonly repo: IProviderRepository) {}

  async signup(dto: ProviderSignupDto) {
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) throw new BadRequestError(Messages.PROVIDER_ACCOUNT_EXISTS);

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    await this.repo.createAccount({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      password: hashedPassword,
      isVerified: false,
      applicationStatus: ApplicationStatus.NOT_APPLIED,
    });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    await OTPModel.create({ email: dto.email, otp, expiresAt });
    await sendEmail(dto.email, otp);
    logger.info("Provider signup", { email: dto.email });
    return { message: Messages.PROVIDER_SIGNUP_SUCCESS };
  }

  async verifyOtp(email: string, otp: string) {
    const record = await OTPModel.findOne({ email, otp });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestError(Messages.OTP_INVALID_OR_EXPIRED);
    }
    await OTPModel.deleteMany({ email });
    const account = await this.repo.findByEmail(email);
    if (!account) throw new NotFoundError(Messages.PROVIDER_ACCOUNT_NOT_FOUND);
    await this.repo.verifyEmail(email);
    return { message: Messages.VERIFIED_SUCCESSFULLY };
  }

  async resendOtp(email: string) {
    const account = await this.repo.findByEmail(email);
    if (!account) throw new NotFoundError(Messages.PROVIDER_ACCOUNT_NOT_FOUND);
    await OTPModel.deleteMany({ email });
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    await OTPModel.create({ email, otp, expiresAt });
    await sendEmail(email, otp);
    return { message: Messages.OTP_RESENT };
  }

  async login(dto: ProviderLoginDto) {
    const account = await this.repo.findByEmail(dto.email);
    if (!account) throw new UnauthorizedError(Messages.INVALID_CREDENTIALS);
    if (!account.isVerified) throw new UnauthorizedError(Messages.EMAIL_NOT_VERIFIED);
    const isMatch = await bcrypt.compare(dto.password, account.password);
    if (!isMatch) throw new UnauthorizedError(Messages.INVALID_CREDENTIALS);

    const accessToken = jwt.sign(
      { id: account._id, role: Role.PROVIDER, applicationStatus: account.applicationStatus },
      env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
    const refreshToken = jwt.sign({ id: account._id }, env.REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
    await TokenModel.create({
      userId: account._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
    });

    logger.info("Provider login", { email: dto.email });
    return {
      user: {
        _id: account._id,
        name: account.name,
        email: account.email,
        phone: account.phone,
        role: Role.PROVIDER,
        applicationStatus: account.applicationStatus,
      },
      accessToken,
      refreshToken,
    };
  }

  async forgotPassword(email: string) {
    const account = await this.repo.findByEmail(email);
    if (!account) throw new NotFoundError(Messages.PROVIDER_ACCOUNT_NOT_FOUND);
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    await OTPModel.create({ email, otp, expiresAt });
    await sendEmail(email, otp);
    return { message: Messages.OTP_SENT };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const record = await OTPModel.findOne({ email, otp });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestError(Messages.OTP_INVALID_OR_EXPIRED);
    }
    const account = await this.repo.findByEmail(email);
    if (!account) throw new NotFoundError(Messages.PROVIDER_ACCOUNT_NOT_FOUND);
    await this.repo.updateAccount(String(account._id), {
      password: await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS),
    });
    await OTPModel.deleteMany({ email });
    return { message: Messages.PASSWORD_RESET_SUCCESS };
  }

  async refreshToken(token: string) {
    try {
      const tokenDoc = await TokenModel.findOne({ token });
      if (!tokenDoc) throw new UnauthorizedError(Messages.INVALID_TOKEN);
      const decoded = jwt.verify(token, env.REFRESH_SECRET) as RefreshTokenPayload;
      const account = await this.repo.findById(decoded.id);
      if (!account) throw new NotFoundError(Messages.PROVIDER_ACCOUNT_NOT_FOUND);
      const newAccessToken = jwt.sign(
        { id: decoded.id, role: Role.PROVIDER, applicationStatus: account.applicationStatus },
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
    await TokenModel.deleteOne({ token });
  }
}
