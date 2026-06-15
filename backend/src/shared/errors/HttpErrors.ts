import { StatusCodes } from "../constants/statusCodes";
import { Messages } from "../constants/messages";
import { AppError } from "./AppError";

/**
 * 400 — Bad Request / Validation failure
 */
export class BadRequestError extends AppError {
  constructor(message: string = Messages.VALIDATION_ERROR) {
    super(message, StatusCodes.BAD_REQUEST);
  }
}

/**
 * 401 — Unauthenticated
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = Messages.UNAUTHORIZED) {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}

/**
 * 403 — Forbidden / insufficient role
 */
export class ForbiddenError extends AppError {
  constructor(message: string = Messages.FORBIDDEN) {
    super(message, StatusCodes.FORBIDDEN);
  }
}

/**
 * 404 — Resource not found
 */
export class NotFoundError extends AppError {
  constructor(message: string = Messages.SOMETHING_WENT_WRONG) {
    super(message, StatusCodes.NOT_FOUND);
  }
}

/**
 * 409 — Conflict (duplicate resource)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, StatusCodes.CONFLICT);
  }
}

/**
 * 500 — Unexpected server failure
 */
export class InternalServerError extends AppError {
  constructor(message: string = Messages.SOMETHING_WENT_WRONG) {
    super(message, StatusCodes.INTERNAL_ERROR);
  }
}
