import { Request, Response, NextFunction } from "express";
import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";

const service = new UserService(new UserRepository());

export class UserController {
  async getProfile(req: any, res: Response, next: NextFunction) {
    try {
      const user = await service.getProfile(req.user.id);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: any, res: Response, next: NextFunction) {
    try {
      const user = await service.updateProfile(req.user.id, req.body);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }
}
