import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthRepository } from "./auth.repository";
import { SignupDto, LoginDto } from "./auth.types";
import { AppError } from "../../shared/errors/AppError";
import { StatusCodes } from "../../shared/constants/statusCodes";
import { env } from "../../config/env";
import { generateOtp } from "../../shared/utils/generateOtp";
import { sendEmail } from "../../shared/utils/sendEmail";

export class AuthService {
  constructor(private repo: AuthRepository) {}

  async signup(dto: SignupDto) {
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) {
      throw new AppError("User already exists", StatusCodes.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.repo.createUser({
      ...dto,
      password: hashedPassword,
      isVerified : false
    });


     const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await this.repo.createOTP(dto.email, otp, expiresAt);
  await sendEmail(dto.email, otp);

  return { message: "OTP sent to email" };

//     return {
//   id: user._id,
//   name: user.name,
//   email: user.email,
//   role: user.role,
//   isVerified: user.isVerified,
//   status: user.status,
// };


  }


  async verifyOtp(email: string, otp: string) {
  const record = await this.repo.findOTP(email, otp);

  if (!record || record.expiresAt < new Date()) {
    throw new AppError("Invalid or expired OTP", 400);
  }

  await this.repo.deleteOTP(email);

  const user = await this.repo.findByEmail(email);
  if (!user) throw new AppError("User not found", 404);

  user.isVerified = true;
  await user.save();

  return { message: "Email verified successfully" };
}




  

  async login(dto: LoginDto) {
    const user = await this.repo.findByEmail(dto.email);
    if (!user) {
      throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
    }

    if (!user.isVerified) {
  throw new AppError("Email not verified", 401);
}

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
    }

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    return { user, accessToken, refreshToken };
  }


async forgotPassword(email: string) {
  const user = await this.repo.findByEmail(email);
  if (!user) throw new AppError("User not found", 404);

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await this.repo.createOTP(email, otp, expiresAt);
  await sendEmail(email, otp);

  return { message: "OTP sent for password reset" };
}

async resetPassword(email: string, otp: string, newPassword: string) {
  const record = await this.repo.findOTP(email, otp);

  if (!record || record.expiresAt < new Date()) {
    throw new AppError("Invalid OTP", 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const user = await this.repo.findByEmail(email);
  if (!user) throw new AppError("User not found", 404);

  user.password = hashedPassword;
  await user.save();

  await this.repo.deleteOTP(email);

  return { message: "Password reset successful" };
}



async refreshToken(token: string) {
  try {
    const decoded: any = jwt.verify(token, env.REFRESH_SECRET);

    const newAccessToken = jwt.sign(
      { id: decoded.id },
      env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return { accessToken: newAccessToken };
  } catch {
    throw new AppError("Invalid refresh token", 401);
  }
}

}