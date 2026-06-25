import { OnlineStatus, EngagementStatus } from "../../models/providerAccount.model";

export interface ProviderStatusResponse {
  onlineStatus: OnlineStatus;
  engagementStatus: EngagementStatus;
  lastOnlineAt?: Date;
  lastStatusChangeAt?: Date;
}

export interface IProviderStatusService {
  toggleOnline(providerId: string, status: OnlineStatus): Promise<ProviderStatusResponse>;
  getStatus(providerId: string): Promise<ProviderStatusResponse>;
  setBusy(providerId: string): Promise<void>;
  setAvailable(providerId: string): Promise<void>;
}
