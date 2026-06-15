import { UpdateUserDto, AddressDto, ChangePasswordDto } from "../../dto/user/user.dto";

// Plain response type (no Mongoose Document methods — safe to send to client)
export interface UserResponseDto {
  _id: unknown;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  role: string;
  isVerified: boolean;
  status: string;
  walletBalance: number;
  addresses: AddressDto[];
  [key: string]: unknown;
}

export interface IUserService {
  getProfile(userId: string): Promise<UserResponseDto>;
  updateProfile(userId: string, data: UpdateUserDto): Promise<UserResponseDto>;
  addAddress(userId: string, addressData: AddressDto): Promise<AddressDto[]>;
  updateAddress(userId: string, addressId: string, addressData: AddressDto): Promise<AddressDto[]>;
  deleteAddress(userId: string, addressId: string): Promise<AddressDto[]>;
  setDefaultAddress(userId: string, addressId: string): Promise<AddressDto[]>;
  changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }>;
  sendPhoneOtp(userId: string, phone: string): Promise<{ message: string }>;
  verifyPhoneOtp(userId: string, phone: string, otp: string): Promise<UserResponseDto>;
  sendPasswordOtp(userId: string): Promise<{ message: string }>;
  verifyPasswordOtp(userId: string, otp: string, newPassword: string): Promise<{ message: string }>;
  sendEmailOtp(userId: string, newEmail: string): Promise<{ message: string }>;
  verifyEmailOtp(userId: string, newEmail: string, otp: string): Promise<UserResponseDto>;
}