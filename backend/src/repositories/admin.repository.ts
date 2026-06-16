import { BaseRepository } from "./base.repository";
import { IAdminRepository } from "../interfaces/admin/IAdminRepository";
import { UserModel, IUser } from "../models/user.model";
import { ProviderAccountModel, IProviderAccount } from "../models/providerAccount.model";
import { ApplicationStatus } from "../shared/enums/application-status.enum";
import { RejectionReasonCode } from "../shared/enums/rejection-reason.enum";
import { Role } from "../shared/enums/role.enum";

export class AdminRepository
  extends BaseRepository<IUser>
  implements IAdminRepository
{
  constructor() {
    super(UserModel);
  }

  // ── User management ──────────────────────────────────────────────

  async countUsers(): Promise<number> {
    return UserModel.countDocuments({ role: Role.USER });
  }

  async findUsers(filter: Record<string, unknown>): Promise<IUser[]> {
    return UserModel.find(filter, { password: 0 }).exec();
  }

  // ── Provider management ──────────────────────────────────────────

  async countProviderAccounts(filter: Record<string, unknown>): Promise<number> {
    return ProviderAccountModel.countDocuments(filter);
  }

  async findProviderAccounts(filter: Record<string, unknown>): Promise<IProviderAccount[]> {
    return ProviderAccountModel.find(filter, { password: 0 })
      .populate("categoryId", "name")
      .exec();
  }

  async findProviderAccountById(id: string): Promise<IProviderAccount | null> {
    return ProviderAccountModel.findById(id).exec();
  }

  async updateProviderAccountStatus(
    id: string,
    status: ApplicationStatus,
    rejectionReasonCode?: RejectionReasonCode | string,
    rejectionReason?: string,
    adminRemarks?: string
  ): Promise<IProviderAccount | null> {
    const update: Record<string, unknown> = { applicationStatus: status };

    if (rejectionReasonCode) update.rejectionReasonCode = rejectionReasonCode;
    if (rejectionReason) update.rejectionReason = rejectionReason;
    if (adminRemarks !== undefined) update.adminRemarks = adminRemarks;
    if (status === ApplicationStatus.REJECTED) update.rejectedAt = new Date();

    if (status === ApplicationStatus.APPROVED) {
      const account = await ProviderAccountModel.findById(id);
      if (account && !account.businessName) {
        update.businessName = account.name;
      }
    }

    return ProviderAccountModel.findByIdAndUpdate(id, update, { returnDocument: 'after' }).exec();
  }
}
