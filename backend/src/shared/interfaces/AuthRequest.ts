import { Request } from "express";
import { Role } from "../enums/role.enum";
import { ApplicationStatus } from "../enums/application-status.enum";

/**
 * JWT payload decoded from access tokens.
 * Provider tokens include applicationStatus for middleware-level access control.
 */
export interface AuthUserPayload {
  id: string;
  role: Role;
  applicationStatus?: ApplicationStatus;
  iat?: number;
  exp?: number;
}

declare global {
  // Express exposes request user typing through namespace merging.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User {
      id: string;
      role: Role;
      applicationStatus?: ApplicationStatus;
      iat?: number;
      exp?: number;
    }
  }
}

export type AuthRequest = Request;
