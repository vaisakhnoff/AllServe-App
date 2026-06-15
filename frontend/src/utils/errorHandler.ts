import { AxiosError } from "axios";
import { UI_MESSAGES } from "@/shared/messages";

export interface ApiError {
  message: string;
  statusCode?: number;
}

export const extractError = (error: unknown): ApiError => {
  if (error instanceof AxiosError) {
    const message =
      (error.response?.data as { message?: string })?.message ||
      error.message ||
      UI_MESSAGES.SOMETHING_WENT_WRONG;
    return { message, statusCode: error.response?.status };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: UI_MESSAGES.UNEXPECTED_ERROR };
};

export const getErrorMessage = (error: unknown): string => {
  return extractError(error).message;
};
