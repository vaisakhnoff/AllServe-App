import { Role } from "../../shared/enums/role.enum";
import { ApplicationStatus } from "../../shared/enums/application-status.enum";
import { ProviderLoginDto, ProviderSignupDto } from "../../dto/provider/providerAuth.dto";

export interface IProviderAuthUserSafe {
  _id: unknown;
  name: string;
  email: string;
  phone: string;
  role: Role;
  applicationStatus: ApplicationStatus;
}

export interface IProviderAuthService {
  signup(dto: ProviderSignupDto): Promise<{ message: string }>;
  verifyOtp(email: string, otp: string): Promise<{ message: string }>;
  resendOtp(email: string): Promise<{ message: string }>;
  login(dto: ProviderLoginDto): Promise<{
    user: IProviderAuthUserSafe;
    accessToken: string;
    refreshToken: string;
  }>;
  forgotPassword(email: string): Promise<{ message: string }>;
  resetPassword(email: string, otp: string, newPassword: string): Promise<{ message: string }>;
  refreshToken(token: string): Promise<{ accessToken: string }>;
  logout(token: string): Promise<void>;
}
