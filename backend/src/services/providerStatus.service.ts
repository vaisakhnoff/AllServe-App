import { IProviderStatusService, ProviderStatusResponse } from "../interfaces/provider-status/IProviderStatusService";
import { IProviderRepository } from "../interfaces/provider/IProviderRepository";
import { OnlineStatus } from "../models/providerAccount.model";
import { NotFoundError } from "../shared/errors/HttpErrors";

export class ProviderStatusService implements IProviderStatusService {
  constructor(private readonly providerRepo: IProviderRepository) {}

  async toggleOnline(providerId: string, status: OnlineStatus): Promise<ProviderStatusResponse> {
    const provider = await this.providerRepo.findById(providerId);
    if (!provider) throw new NotFoundError("Provider not found");

    const now = new Date();
    const updateData: Record<string, unknown> = {
      onlineStatus: status,
      lastStatusChangeAt: now,
    };
    if (status === "online") {
      updateData.lastOnlineAt = now;
    }

    const updated = await this.providerRepo.updateAccount(providerId, updateData);
    if (!updated) throw new NotFoundError("Provider not found");

    return {
      onlineStatus: updated.onlineStatus,
      engagementStatus: updated.engagementStatus,
      lastOnlineAt: updated.lastOnlineAt,
      lastStatusChangeAt: updated.lastStatusChangeAt,
    };
  }

  async getStatus(providerId: string): Promise<ProviderStatusResponse> {
    const provider = await this.providerRepo.findById(providerId);
    if (!provider) throw new NotFoundError("Provider not found");

    return {
      onlineStatus: provider.onlineStatus,
      engagementStatus: provider.engagementStatus,
      lastOnlineAt: provider.lastOnlineAt,
      lastStatusChangeAt: provider.lastStatusChangeAt,
    };
  }

  async setBusy(providerId: string): Promise<void> {
    await this.providerRepo.updateAccount(providerId, {
      engagementStatus: "busy",
      lastStatusChangeAt: new Date(),
    } as Record<string, unknown>);
  }

  async setAvailable(providerId: string): Promise<void> {
    await this.providerRepo.updateAccount(providerId, {
      engagementStatus: "available",
      lastStatusChangeAt: new Date(),
    } as Record<string, unknown>);
  }
}
