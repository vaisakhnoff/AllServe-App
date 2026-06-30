import { IUserRepository } from "../../interfaces/user/IUserRepository";
import { IUserService } from "../../interfaces/user/IUserService";
import { UpdateUserDto, AddressDto, ChangePasswordDto } from "../../dto/user/user.dto";
import bcrypt from "bcryptjs";
import { logger } from "../../shared/logger/logger";
import { generateOtp } from "../../shared/utils/generateOtp";
import { Messages } from "../../shared/constants/messages";
import { OTP_EXPIRY_MS, BCRYPT_SALT_ROUNDS } from "../../shared/constants/config";
import { IUser } from "../../models/user.model";
import { NotFoundError, BadRequestError } from "../../shared/errors/HttpErrors";

// Strip password from any user document
const withoutPassword = (user: IUser) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  const { password: _password, ...safeUser } = obj as IUser & Record<string, unknown>;
  return safeUser;
};

export class UserService implements IUserService {
  constructor(private readonly repo: IUserRepository) {}

  async getProfile(userId: string) {
    const user = await this.getUser(userId);
    return withoutPassword(user);
  }

  async updateProfile(userId: string, data: UpdateUserDto) {
    const user = await this.repo.updateUser(userId, data);
    if (!user) throw new NotFoundError(Messages.USER_NOT_FOUND);
    return withoutPassword(user);
  }

  async addAddress(userId: string, addressData: AddressDto) {
    const user = await this.getUser(userId);
    if (addressData.isDefault) {
      user.addresses.forEach((addr) => { addr.isDefault = false; });
    } else if (user.addresses.length === 0) {
      addressData.isDefault = true;
    }
    user.addresses.push(addressData as IUser["addresses"][number]);
    const updated = await this.repo.updateAddresses(userId, user.addresses);
    if (!updated) throw new NotFoundError(Messages.USER_NOT_FOUND);
    return updated.addresses;
  }

  async updateAddress(userId: string, addressId: string, addressData: AddressDto) {
    const user = await this.getUser(userId);
    const idx = user.addresses.findIndex((a) => (a as Record<string, unknown>)._id?.toString() === addressId);
    if (idx === -1) throw new NotFoundError(Messages.ADDRESS_NOT_FOUND);
    if (addressData.isDefault && !user.addresses[idx].isDefault) {
      user.addresses.forEach((addr) => { addr.isDefault = false; });
    }
    user.addresses[idx] = { ...user.addresses[idx], ...addressData };
    const updated = await this.repo.updateAddresses(userId, user.addresses);
    if (!updated) throw new NotFoundError(Messages.USER_NOT_FOUND);
    return updated.addresses;
  }

  async deleteAddress(userId: string, addressId: string) {
    const user = await this.getUser(userId);
    const address = user.addresses.find((a) => (a as Record<string, unknown>)._id?.toString() === addressId);
    if (!address) throw new NotFoundError(Messages.ADDRESS_NOT_FOUND);
    if (address.isDefault && user.addresses.length > 1) {
      throw new BadRequestError(Messages.CANNOT_DELETE_DEFAULT_ADDRESS);
    }
    user.addresses = user.addresses.filter((a) => (a as Record<string, unknown>)._id?.toString() !== addressId);
    const updated = await this.repo.updateAddresses(userId, user.addresses);
    if (!updated) throw new NotFoundError(Messages.USER_NOT_FOUND);
    return updated.addresses;
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const user = await this.getUser(userId);
    const address = user.addresses.find((a) => (a as Record<string, unknown>)._id?.toString() === addressId);
    if (!address) throw new NotFoundError(Messages.ADDRESS_NOT_FOUND);
    user.addresses.forEach((addr) => { addr.isDefault = false; });
    address.isDefault = true;
    const updated = await this.repo.updateAddresses(userId, user.addresses);
    if (!updated) throw new NotFoundError(Messages.USER_NOT_FOUND);
    return updated.addresses;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.getUser(userId);
    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) throw new BadRequestError(Messages.INCORRECT_OLD_PASSWORD);
    const hash = await bcrypt.hash(dto.newPassword, BCRYPT_SALT_ROUNDS);
    await this.repo.updatePassword(userId, hash);
    return { message: Messages.PASSWORD_UPDATED };
  }

  async sendPhoneOtp(_userId: string, phone: string) {
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    await this.repo.deleteOtp({ phone });
    await this.repo.createOtp({ phone, otp, expiresAt });
    logger.info(`[TESTING] Mock SMS sent to ${phone}: Your OTP is ${otp}`);
    return { message: Messages.OTP_SENT_PHONE };
  }

  async verifyPhoneOtp(userId: string, phone: string, otp: string) {
    const record = await this.repo.findOtp({ phone, otp });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestError(Messages.OTP_INVALID_OR_EXPIRED);
    }
    await this.repo.deleteOtp({ _id: record._id });
    const user = await this.repo.updateUser(userId, { phone });
    if (!user) throw new NotFoundError(Messages.USER_NOT_FOUND);
    return withoutPassword(user);
  }

  async sendPasswordOtp(userId: string) {
    const user = await this.getUser(userId);
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    await this.repo.deleteOtp({ email: user.email });
    await this.repo.createOtp({ email: user.email, otp, expiresAt });
    logger.info(`[TESTING] Mock Email sent to ${user.email}: Your OTP for password change is ${otp}`);
    return { message: Messages.OTP_SENT_EMAIL };
  }

  async verifyPasswordOtp(userId: string, otp: string, newPassword: string) {
    const user = await this.getUser(userId);
    const record = await this.repo.findOtp({ email: user.email, otp });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestError(Messages.OTP_INVALID_OR_EXPIRED);
    }
    await this.repo.deleteOtp({ _id: record._id });
    const hash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await this.repo.updatePassword(userId, hash);
    return { message: Messages.PASSWORD_UPDATED };
  }

  async sendEmailOtp(userId: string, newEmail: string) {
    const existingUser = await this.repo.findByEmail(newEmail);
    if (existingUser?._id?.toString() !== userId) {
      throw new BadRequestError(Messages.EMAIL_ALREADY_IN_USE);
    }
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    await this.repo.deleteOtp({ email: newEmail });
    await this.repo.createOtp({ email: newEmail, otp, expiresAt });
    logger.info(`[TESTING] Mock Email sent to ${newEmail}: Your OTP is ${otp}`);
    return { message: Messages.OTP_SENT_EMAIL };
  }

  async verifyEmailOtp(userId: string, newEmail: string, otp: string) {
    const existingUser = await this.repo.findByEmail(newEmail);
    if (existingUser?._id?.toString() !== userId) {
      throw new BadRequestError(Messages.EMAIL_ALREADY_IN_USE);
    }
    const record = await this.repo.findOtp({ email: newEmail, otp });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestError(Messages.OTP_INVALID_OR_EXPIRED);
    }
    await this.repo.deleteOtp({ _id: record._id });
    const user = await this.repo.updateUser(userId, { email: newEmail });
    if (!user) throw new NotFoundError(Messages.USER_NOT_FOUND);
    return withoutPassword(user);
  }

  private async getUser(userId: string): Promise<IUser> {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundError(Messages.USER_NOT_FOUND);
    return user;
  }
}
