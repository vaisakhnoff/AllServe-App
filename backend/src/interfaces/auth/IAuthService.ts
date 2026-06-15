import { Role } from "../../shared/enums/role.enum";
import { SignupDto, LoginDto } from "../../dto/auth/auth.dto";

export interface IUserSafe {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  role: Role;
  isVerified: boolean;
}

export interface IAuthService {
  signup(dto: SignupDto): Promise<{ message: string }>;
  verifyOtp(email: string, otp: string, phone?: string, phoneOtp?: string): Promise<{ message: string }>;
  resendOtp(email?: string, phone?: string): Promise<{ message: string }>;
  login(dto: LoginDto, isOAuth?: boolean, expectedRole?: Role): Promise<{
    user: IUserSafe;
    accessToken: string;
    refreshToken: string;
  }>;
  forgotPassword(email: string): Promise<{ message: string }>;
  resetPassword(email: string, otp: string, newPassword: string): Promise<{ message: string }>;
  refreshToken(token: string): Promise<{ accessToken: string }>;
  logout(token: string): Promise<void>;
}