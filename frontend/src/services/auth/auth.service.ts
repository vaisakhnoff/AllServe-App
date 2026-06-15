import api from "@/api";
import { API_ENDPOINTS } from "@/shared/routes";
import {
  SignupDto,
  LoginDto,
  OtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ApiResponse,
  LoginResponse,
} from "@/types/auth.types";

export const authService = {
  signup: (dto: SignupDto) =>
    api.post<ApiResponse<{ message: string }>>(API_ENDPOINTS.SIGNUP, dto),

  login: (dto: LoginDto) =>
    api.post<ApiResponse<LoginResponse>>(API_ENDPOINTS.LOGIN, dto),

  adminLogin: (dto: LoginDto) =>
    api.post<ApiResponse<LoginResponse>>(API_ENDPOINTS.ADMIN_LOGIN, dto),
  
  verifyOtp: (dto: OtpDto & { phone?: string; phoneOtp?: string }) =>
    api.post<ApiResponse<{ message: string }>>(API_ENDPOINTS.VERIFY_OTP, dto),

  resendOtp: (dto: { email?: string; phone?: string }) =>
    api.post<ApiResponse<{ message: string }>>(API_ENDPOINTS.RESEND_OTP, dto),

  forgotPassword: (dto: ForgotPasswordDto) =>
    api.post<ApiResponse<{ message: string }>>(API_ENDPOINTS.FORGOT_PASSWORD, dto),

  resetPassword: (dto: ResetPasswordDto) =>
    api.post<ApiResponse<{ message: string }>>(API_ENDPOINTS.RESET_PASSWORD, dto),

  logout: (refreshToken: string) =>
    api.post<ApiResponse<null>>(API_ENDPOINTS.LOGOUT, { token: refreshToken }),
};
