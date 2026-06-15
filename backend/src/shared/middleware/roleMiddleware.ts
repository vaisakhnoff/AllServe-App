import { Response, NextFunction } from "express";
import { AuthRequest } from "../interfaces/AuthRequest";
import { AppError } from "../errors/AppError";
import { Messages } from "../constants/messages";
import { StatusCodes } from "../constants/statusCodes";
import { Role } from "../enums/role.enum";

export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(Messages.FORBIDDEN, StatusCodes.FORBIDDEN));
    }
    next();
  };
};
