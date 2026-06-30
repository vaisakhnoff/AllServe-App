import { Role } from "@/enums/role.enum";
import { Status } from "@/enums/status.enum";

export interface SignupDto {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface ProviderSignupDto extends SignupDto {
  phone: string;
  category: string;
  experience: string;
  serviceArea: string;
  description: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface OtpDto {
  email: string;
  otp: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  email: string;
  otp: string;
  newPassword: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  isVerified: boolean;
  applicationStatus?: "not_applied" | "pending" | "approved" | "rejected" | "suspended";
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export type LoginField = keyof LoginDto;
export type LoginFieldErrors = Partial<Record<LoginField, string>>;
export type LoginTouchedFields = Partial<Record<LoginField, boolean>>;
export type OAuthErrorCode = "auth_failed" | "wrong_platform";
export interface ResetPasswordFormErrors {
  otp?: string;
  newPassword?: string;
  confirmPassword?: string;
}
