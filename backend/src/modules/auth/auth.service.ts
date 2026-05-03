import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthRepository } from "./auth.repository";
import { SignupDto, LoginDto } from "./auth.types";
import { AppError } from "../../shared/errors/AppError";
import { StatusCodes } from "../../shared/constants/statusCodes";
import { env } from "../../config/env";

export class AuthService {
  constructor(private repo: AuthRepository) {}

  async signup(dto: SignupDto) {
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) {
      throw new AppError("User already exists", StatusCodes.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.repo.createUser({
      ...dto,
      password: hashedPassword,
    });

    return {
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
  status: user.status,
};
  }

  async login(dto: LoginDto) {
    const user = await this.repo.findByEmail(dto.email);
    if (!user) {
      throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
    }

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      env.REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    return { user, accessToken, refreshToken };
  }
}