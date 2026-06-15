import { IUser } from "../../models/user.model";
import { IProviderAccount } from "../../models/providerAccount.model";

export interface DashboardStats {
  totalUsers: number;
  totalProviders: number;
  pendingApplications: number;
}

export interface IAdminService {
  getDashboardStats(): Promise<DashboardStats>;
  viewApplications(statusFilter?: string): Promise<IProviderAccount[]>;
  viewUsers(search?: string, statusFilter?: string): Promise<IUser[]>;
  blockUser(userId: string): Promise<IUser | null>;
  unblockUser(userId: string): Promise<IUser | null>;
  approveProvider(appId: string): Promise<IProviderAccount | null>;
  rejectProvider(
    appId: string,
    reasonCode?: string,
    adminRemarks?: string
  ): Promise<IProviderAccount | null>;
  viewProviders(search?: string, statusFilter?: string): Promise<IProviderAccount[]>;
  blockProvider(providerId: string): Promise<IProviderAccount | null>;
  unblockProvider(providerId: string): Promise<IProviderAccount | null>;
}