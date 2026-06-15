import { BaseRepository } from "./base.repository";
import { IUserRepository } from "../interfaces/user/IUserRepository";
import { UserModel, IUser } from "../models/user.model";
import { OTPModel, IOTP } from "../models/otp.model";
import { UpdateUserDto, AddressDto } from "../dto/user/user.dto";

export class UserRepository
  extends BaseRepository<IUser>
  implements IUserRepository
{
  constructor() {
    super(UserModel);
  }

  async updateUser(
    id: string,
    data: UpdateUserDto | { email?: string; phone?: string }
  ): Promise<IUser | null> {
    return this.model.findByIdAndUpdate(id, data, { returnDocument: 'after' }).exec();
  }

  async updateAddresses(id: string, addresses: AddressDto[]): Promise<IUser | null> {
    return this.model.findByIdAndUpdate(id, { addresses }, { returnDocument: 'after' }).exec();
  }

  async updatePassword(id: string, passwordHash: string): Promise<IUser | null> {
    return this.model
      .findByIdAndUpdate(id, { password: passwordHash }, { returnDocument: 'after' })
      .exec();
  }

  async createOtp(
    data: Pick<IOTP, "otp" | "expiresAt" | "email" | "phone">
  ): Promise<IOTP> {
    return OTPModel.create(data) as Promise<IOTP>;
  }

  async findOtp(
    filter: Partial<Pick<IOTP, "email" | "phone" | "otp">>
  ): Promise<IOTP | null> {
    return OTPModel.findOne(filter).exec() as Promise<IOTP | null>;
  }

  async deleteOtp(
    filter: Partial<Pick<IOTP, "email" | "phone">> | { _id: unknown }
  ): Promise<void> {
    await OTPModel.deleteMany(filter as Record<string, unknown>);
  }
}
