import { Response, NextFunction } from "express";
import { AuthRequest } from "../interfaces/AuthRequest";
import { AppError } from "../errors/AppError";
import { Messages } from "../constants/messages";
import { StatusCodes } from "../constants/statusCodes";
import { ProviderAccountModel } from "../../models/providerAccount.model";
import { ApplicationStatus } from "../enums/application-status.enum";

/**
 * Middleware that verifies the authenticated provider has an approved account.
 * Reads provider ID directly from JWT (req.user.id = ProviderAccount._id).
 */
export const createApprovedProviderMiddleware = () =>
  async (req: AuthRequest & { providerAccount?: unknown }, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AppError(Messages.UNAUTHORIZED, StatusCodes.UNAUTHORIZED));
      }

      const provider = await ProviderAccountModel.findById(req.user.id)
        .populate("categoryId", "name icon")
        .lean();

      if (!provider || provider.applicationStatus !== ApplicationStatus.APPROVED) {
        return next(new AppError(Messages.APPLICATION_NOT_APPROVED, StatusCodes.FORBIDDEN));
      }

      (req as AuthRequest & { providerAccount?: unknown }).providerAccount = provider;
      next();
    } catch (error) {
      next(error);
    }
  };
