import { Response } from "express";
import { Messages } from "../constants/messages";
import { StatusCode, StatusCodes } from "../constants/statusCodes";

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = Messages.SUCCESS,
  status: StatusCode = StatusCodes.OK,
) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (
  res: Response,
  message = Messages.SOMETHING_WENT_WRONG,
  status: StatusCode = StatusCodes.INTERNAL_ERROR,
) => {
  res.status(status).json({
    success: false,
    message,
  });
};
