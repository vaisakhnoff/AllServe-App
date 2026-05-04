import { UserModel, IUser } from "./auth.model";
import { OTPModel } from "./otp.model";

export class AuthRepository {
  async createUser(data: Partial<IUser>) {
    return UserModel.create(data);
  }

  async findByEmail(email: string) {
    return UserModel.findOne({ email });
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

}

