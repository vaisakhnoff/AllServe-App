import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "../constants/statusCodes";
import { logger } from "../logger/logger";
import { ZodError } from "zod";
import { Messages } from "../constants/messages";
import { AppError } from "./AppError";

function isDuplicateKeyError(err: unknown): err is { code: 11000; keyValue?: Record<string, unknown> } {
  return typeof err === "object" && err !== null && "code" in err && err.code === 11000;
}

export const errorMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.warn(`[${req.method}] ${req.path} → ${err.statusCode} ${err.message}`);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err instanceof ZodError) {
    const message = err.issues.map((issue) => issue.message).join(", ");
    logger.warn(`[${req.method}] ${req.path} → 400 Validation: ${message}`);
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message,
    });
  }

  if (isDuplicateKeyError(err)) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    const value = err.keyValue ? err.keyValue[field] : "";
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} "${value}" already exists.`;
    logger.warn(`[${req.method}] ${req.path} → 409 Duplicate: ${message}`);
    return res.status(StatusCodes.CONFLICT).json({
      success: false,
      message,
    });
  }

  const error = err instanceof Error ? err : undefined;
  logger.error(`[${req.method}] ${req.path} → 500`, {
    message: error?.message ?? Messages.SOMETHING_WENT_WRONG,
    stack: error?.stack,
  });

  res.status(StatusCodes.INTERNAL_ERROR).json({
    success: false,
    message: Messages.SOMETHING_WENT_WRONG,
  });
};
