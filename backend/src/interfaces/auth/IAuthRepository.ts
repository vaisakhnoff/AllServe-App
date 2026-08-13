import { IBaseRepository } from "../IBaseRepository";
import { IUser } from "../../models/user.model";
import { IOTP } from "../../models/otp.model";
import { IToken } from "../../models/token.model";

export interface IAuthRepository extends IBaseRepository<IUser> {
  // OTP (email)
  createOTP(email: string, otp: string, expiresAt: Date): Promise<void>;
  findOTP(email: string, otp: string): Promise<IOTP | null>;
  deleteOTP(email: string): Promise<void>;

  // OTP (phone)
  createPhoneOTP(phone: string, otp: string, expiresAt: Date): Promise<void>;
  findPhoneOTP(phone: string, otp: string): Promise<IOTP | null>;
  deletePhoneOTP(phone: string): Promise<void>;

  // Refresh tokens
  createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  findRefreshToken(token: string): Promise<IToken | null>;
  deleteRefreshToken(token: string): Promise<void>;

  // User mutation
  updateUser(id: string, data: Partial<IUser>): Promise<IUser | null>;
}  