import { IBaseRepository } from "../IBaseRepository";
import { IUser } from "../../models/user.model";
import { IOTP } from "../../models/otp.model";
import { UpdateUserDto, AddressDto } from "../../dto/user/user.dto";

export interface IUserRepository extends IBaseRepository<IUser> {
  updateUser(id: string, data: UpdateUserDto | { email?: string; phone?: string }): Promise<IUser | null>;
  updateAddresses(id: string, addresses: AddressDto[]): Promise<IUser | null>;
  updatePassword(id: string, passwordHash: string): Promise<IUser | null>;
  createOtp(data: Pick<IOTP, "otp" | "expiresAt" | "email" | "phone">): Promise<IOTP>;
  findOtp(filter: Partial<Pick<IOTP, "email" | "phone" | "otp">>): Promise<IOTP | null>;
  deleteOtp(filter: Partial<Pick<IOTP, "email" | "phone">> | { _id: unknown }): Promise<void>;
}