import { Response, NextFunction } from "express";
import { AuthRequest } from "../interfaces/AuthRequest";
import { AppError } from "../errors/AppError";
import { StatusCodes } from "../constants/statusCodes";
import { ApplicationStatus } from "../enums/application-status.enum";

/**
 * Middleware factory that restricts provider routes based on applicationStatus.
 * Reads the status from the JWT payload (set during provider login).
 *
 * Usage:
 *   requireProviderStatus(ApplicationStatus.APPROVED)
 *   requireProviderStatus(ApplicationStatus.REJECTED, ApplicationStatus.APPROVED)
 */
export const requireProviderStatus = (...allowed: ApplicationStatus[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    const status = req.user?.applicationStatus;

    if (!status || !allowed.includes(status)) {
      const allowedStr = allowed.join(", ");
      return next(
        new AppError(
          `Access denied. Required application status: [${allowedStr}]. Your current status: ${status ?? "unknown"}`,
          StatusCodes.FORBIDDEN
        )
      );
    }

    next();
  };
};
