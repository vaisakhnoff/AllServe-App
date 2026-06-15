import { ProviderAccountModel, IProviderAccount } from "../models/providerAccount.model";
import { OTPModel } from "../models/otp.model";
import { TokenModel } from "../models/token.model";

export interface IProviderAuthRepository {
  createAccount(data: Partial<IProviderAccount>): Promise<IProviderAccount>;
  findByEmail(email: string): Promise<IProviderAccount | null>;
  findById(id: string): Promise<IProviderAccount | null>;
  updateAccount(id: string, data: Partial<IProviderAccount>): Promise<IProviderAccount | null>;

  // OTP operations
  createOTP(email: string, otp: string, expiresAt: Date): Promise<unknown>;
  findOTP(email: string, otp: string): Promise<unknown>;
  deleteOTP(email: string): Promise<unknown>;

  // Refresh tokens
  createRefreshToken(accountId: string, token: string, expiresAt: Date): Promise<unknown>;
  findRefreshToken(token: string): Promise<unknown>;
  deleteRefreshToken(token: string): Promise<unknown>;
}

export class ProviderAuthRepository implements IProviderAuthRepository {
  async createAccount(data: Partial<IProviderAccount>) {
    return ProviderAccountModel.create(data);
  }

  async findByEmail(email: string) {
    return ProviderAccountModel.findOne({ email });
  }

  async findById(id: string) {
    return ProviderAccountModel.findById(id);
  }

  async updateAccount(id: string, data: Partial<IProviderAccount>) {
    return ProviderAccountModel.findByIdAndUpdate(id, data, { returnDocument: 'after' });
  }

  async createOTP(email: string, otp: string, expiresAt: Date) {
    return OTPModel.create({ email, otp, expiresAt });
  }

  async findOTP(email: string, otp: string) {
    return OTPModel.findOne({ email, otp });
  }

  async deleteOTP(email: string) {
    return OTPModel.deleteMany({ email });
  }

  async createRefreshToken(accountId: string, token: string, expiresAt: Date) {
    return TokenModel.create({ userId: accountId, token, expiresAt });
  }

  async findRefreshToken(token: string) {
    return TokenModel.findOne({ token });
  }

  async deleteRefreshToken(token: string) {
    return TokenModel.deleteOne({ token });
  }
}
