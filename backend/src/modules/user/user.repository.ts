import { UserModel } from "../auth/auth.model";

export class UserRepository {
  async findById(id: string) {
    return UserModel.findById(id);
  }

  async updateUser(id: string, data: any) {
    return UserModel.findByIdAndUpdate(id, data, { new: true });
  }
}
