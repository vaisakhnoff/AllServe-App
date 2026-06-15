import api from "@/api";
import { API_ENDPOINTS } from "@/shared/routes";
import {
  ProviderSignupDto,
  LoginDto,
  OtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ApiResponse,
  LoginResponse,
} from "@/types/auth.types";

export const providerAuthService = {
  signup: (dto: ProviderSignupDto) =>
    api.post<ApiResponse<{ message: string }>>(API_ENDPOINTS.PROVIDER_SIGNUP, dto),

  login: (dto: LoginDto) =>
    api.post<ApiResponse<LoginResponse>>(API_ENDPOINTS.PROVIDER_LOGIN, dto),

  verifyOtp: (dto: OtpDto & { phone?: string; phoneOtp?: string }) =>
    api.post<ApiResponse<{ message: string }>>(API_ENDPOINTS.PROVIDER_VERIFY_OTP, dto),

  resendOtp: (dto: { email?: string; phone?: string }) =>
    api.post<ApiResponse<{ message: string }>>(API_ENDPOINTS.PROVIDER_RESEND_OTP, dto),

  forgotPassword: (dto: ForgotPasswordDto) =>
    api.post<ApiResponse<{ message: string }>>(API_ENDPOINTS.PROVIDER_FORGOT_PASSWORD, dto),

  resetPassword: (dto: ResetPasswordDto) =>
    api.post<ApiResponse<{ message: string }>>(API_ENDPOINTS.PROVIDER_RESET_PASSWORD, dto),

  logout: (refreshToken: string) =>
    api.post<ApiResponse<null>>(API_ENDPOINTS.PROVIDER_LOGOUT, { token: refreshToken }),
};
