import { Role } from "@/enums/role.enum";
import { Status } from "@/enums/status.enum";

export interface Address {
  _id: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  _id: string;
  type: string;
  details: string;
  isDefault: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  role: Role;
  status: Status;
  isVerified: boolean;
  walletBalance: number;
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  createdAt?: string;
}

export interface UpdateProfileDto {
  name?: string;
  phone?: string;
  profileImage?: string;
}

export interface AddressDto {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault?: boolean;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export interface UserListItem {
  _id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  isVerified: boolean;
  createdAt: string;
}
