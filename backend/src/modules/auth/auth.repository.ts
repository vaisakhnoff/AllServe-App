import { UserModel, IUser } from "./auth.model";

export class AuthRepository {
  async createUser(data: Partial<IUser>) {
    return UserModel.create(data);
  }

  async findByEmail(email: string) {
    return UserModel.findOne({ email });
  }
}