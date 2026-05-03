import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { AuthRepository } from "./auth.repository";
import { signupSchema, loginSchema } from "./auth.types";

const service = new AuthService(new AuthRepository());

export class AuthController {
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = signupSchema.parse(req.body);
      const user = await service.signup(dto);

      res.status(201).json({
        success: true,
        message: "User created",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = loginSchema.parse(req.body);
      const result = await service.login(dto);

      res.json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}