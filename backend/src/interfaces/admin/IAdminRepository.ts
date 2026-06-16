import { IUser } from "../../models/user.model";
import { IProviderAccount } from "../../models/providerAccount.model";
import { ApplicationStatus } from "../../shared/enums/application-status.enum";
import { RejectionReasonCode } from "../../shared/enums/rejection-reason.enum";
import { IBaseRepository } from "../IBaseRepository";

export interface DashboardStats {
  totalUsers: number;
  totalProviders: number;
  pendingApplications: number;
}

export interface IAdminRepository extends IBaseRepository<IUser> {
  // User management
  countUsers(): Promise<number>;
  findUsers(filter: Record<string, unknown>): Promise<IUser[]>;

  // Provider management
  countProviderAccounts(filter: Record<string, unknown>): Promise<number>;
  findProviderAccounts(filter: Record<string, unknown>): Promise<IProviderAccount[]>;
  findProviderAccountById(id: string): Promise<IProviderAccount | null>;
  updateProviderAccountStatus(
    id: string,
    status: ApplicationStatus,
    rejectionReasonCode?: RejectionReasonCode | string,
    rejectionReason?: string,
    adminRemarks?: string
  ): Promise<IProviderAccount | null>;
}