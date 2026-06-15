import api from "@/api";
import { API_ENDPOINTS } from "@/shared/routes";
import { ApiResponse } from "@/types/auth.types";
import { UserProfile, UpdateProfileDto, AddressDto, Address, ChangePasswordDto } from "@/types/user.types";

export const userService = {
  getProfile: () =>
    api.get<ApiResponse<UserProfile>>(API_ENDPOINTS.PROFILE),

  updateProfile: (dto: UpdateProfileDto) =>
    api.put<ApiResponse<UserProfile>>(API_ENDPOINTS.PROFILE, dto),

  addAddress: (dto: AddressDto) =>
    api.post<ApiResponse<Address[]>>(`${API_ENDPOINTS.PROFILE}/address`, dto),

  updateAddress: (id: string, dto: AddressDto) =>
    api.put<ApiResponse<Address[]>>(`${API_ENDPOINTS.PROFILE}/address/${id}`, dto),

  deleteAddress: (id: string) =>
    api.delete<ApiResponse<Address[]>>(`${API_ENDPOINTS.PROFILE}/address/${id}`),

  setDefaultAddress: (id: string) =>
    api.patch<ApiResponse<Address[]>>(`${API_ENDPOINTS.PROFILE}/address/${id}/default`),

  changePassword: (dto: ChangePasswordDto) =>
    api.post<ApiResponse<{ message: string }>>(`${API_ENDPOINTS.PROFILE}/password`, dto),

  sendPhoneOtp: (phone: string) =>
    api.post<ApiResponse<{ message: string }>>(`${API_ENDPOINTS.PROFILE}/phone/send-otp`, { phone }),

  verifyPhoneOtp: (phone: string, otp: string) =>
    api.post<ApiResponse<UserProfile>>(`${API_ENDPOINTS.PROFILE}/phone/verify-otp`, { phone, otp }),

  sendEmailOtp: (email: string) =>
    api.post<ApiResponse<{ message: string }>>(`${API_ENDPOINTS.PROFILE}/email/send-otp`, { email }),

  verifyEmailOtp: (email: string, otp: string) =>
    api.post<ApiResponse<UserProfile>>(`${API_ENDPOINTS.PROFILE}/email/verify-otp`, { email, otp }),

  sendPasswordOtp: () =>
    api.post<ApiResponse<{ message: string }>>(`${API_ENDPOINTS.PROFILE}/password/send-otp`),

  verifyPasswordOtp: (otp: string, newPassword: string) =>
    api.post<ApiResponse<{ message: string }>>(`${API_ENDPOINTS.PROFILE}/password/verify-otp`, { otp, newPassword }),

  uploadProfileImage: (base64Image: string) =>
    api.put<ApiResponse<UserProfile>>(API_ENDPOINTS.PROFILE, { profileImage: base64Image }),
};
