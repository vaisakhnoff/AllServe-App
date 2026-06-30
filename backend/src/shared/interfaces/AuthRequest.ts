import { Request } from "express";
import { Role } from "../enums/role.enum";
import { ApplicationStatus } from "../enums/application-status.enum";

export interface AuthUserPayload {
  id: string;
  role: Role;
  applicationStatus?: ApplicationStatus;
  iat?: number;
  exp?: number;
}

declare global {
  
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
