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
