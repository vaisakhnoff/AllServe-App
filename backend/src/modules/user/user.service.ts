import { UserRepository } from "./user.repository";
import { AppError } from "../../shared/errors/AppError";

export class UserService {
  constructor(private repo: UserRepository) {}

  async getProfile(userId: string) {
    const user = await this.repo.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async updateProfile(userId: string, data: any) {
    const user = await this.repo.updateUser(userId, data);
    if (!user) throw new AppError("User not found", 404);
    
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
