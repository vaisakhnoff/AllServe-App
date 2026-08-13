import jwt from "jsonwebtoken";
import { NextFunction, Response } from "express";
import { env } from "../../config/env";
import { AccessTokenPayload, AuthRequest } from "../interfaces/AuthRequest";
import { AppError } from "../errors/AppError";
import { Messages } from "../constants/messages";
import { StatusCodes } from "../constants/statusCodes";
import { UserModel } from "../../models/user.model";
import { ProviderAccountModel } from "../../models/providerAccount.model";
import { Role } from "../enums/role.enum";

export const authMiddleware = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return next(new AppError(Messages.UNAUTHORIZED, StatusCodes.UNAUTHORIZED));

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;

    if (decoded.role === Role.PROVIDER) {
      const account = await ProviderAccountModel.findById(decoded.id).select("applicationStatus").lean();
      if (!account) return next(new AppError(Messages.UNAUTHORIZED, StatusCodes.UNAUTHORIZED));
      // Always use the DB's current applicationStatus (not the JWT's stale value)
      decoded.applicationStatus = account.applicationStatus;
    } else {
      const user = await UserModel.findById(decoded.id).select("status").lean();
      if (!user || user.status === "blocked") {
        return next(new AppError(Messages.ACCOUNT_BLOCKED, StatusCodes.FORBIDDEN));
      }
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    return next(new AppError(Messages.INVALID_TOKEN, StatusCodes.UNAUTHORIZED));
  }
};
