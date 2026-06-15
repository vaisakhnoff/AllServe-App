import { BaseRepository } from "./base.repository";
import { IAuthRepository } from "../interfaces/auth/IAuthRepository";
import { UserModel, IUser } from "../models/user.model";
import { OTPModel, IOTP } from "../models/otp.model";
import { TokenModel, IToken } from "../models/token.model";

export class AuthRepository
  extends BaseRepository<IUser>
  implements IAuthRepository
{
  constructor() {
    super(UserModel);
  }

  async updateUser(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return this.model.findByIdAndUpdate(id, data, { returnDocument: 'after' }).exec();
  }

  // ── Email OTP ────────────────────────────────────────────────────
  async createOTP(email: string, otp: string, expiresAt: Date): Promise<void> {
    await OTPModel.create({ email, otp, expiresAt });
  }

  async findOTP(email: string, otp: string): Promise<IOTP | null> {
    return OTPModel.findOne({ email, otp }).exec();
  }

  async deleteOTP(email: string): Promise<void> {
    await OTPModel.deleteMany({ email });
  }

  // ── Phone OTP ────────────────────────────────────────────────────
  async createPhoneOTP(phone: string, otp: string, expiresAt: Date): Promise<void> {
    await OTPModel.create({ phone, otp, expiresAt });
  }

  async findPhoneOTP(phone: string, otp: string): Promise<IOTP | null> {
    return OTPModel.findOne({ phone, otp }).exec();
  }

  async deletePhoneOTP(phone: string): Promise<void> {
    await OTPModel.deleteMany({ phone });
  }

  // ── Refresh Tokens ───────────────────────────────────────────────
  async createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await TokenModel.create({ userId, token, expiresAt });
  }

  async findRefreshToken(token: string): Promise<IToken | null> {
    return TokenModel.findOne({ token }).exec();
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await TokenModel.deleteOne({ token });
  }
}
