import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "../constants/statusCodes";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || StatusCodes.INTERNAL_ERROR;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Something went wrong",
  });
};