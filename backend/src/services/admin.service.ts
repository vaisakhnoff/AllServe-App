import { IAdminRepository } from "../interfaces/admin/IAdminRepository";
import { IAdminService } from "../interfaces/admin/IAdminService";
import { Messages } from "../shared/constants/messages";
import { Status } from "../shared/enums/status.enum";
import { Role } from "../shared/enums/role.enum";
import { ApplicationStatus } from "../shared/enums/application-status.enum";
import { RejectionReasonCode, REJECTION_REASON_LABELS } from "../shared/enums/rejection-reason.enum";
import { NotFoundError, BadRequestError, ForbiddenError } from "../shared/errors/HttpErrors";

export class AdminService implements IAdminService {
  constructor(private  repo: IAdminRepository) {}

  async getDashboardStats() {
    const [totalUsers, totalProviders, pendingApplications] = await Promise.all([
      this.repo.countUsers(),
      this.repo.countProviderAccounts({ applicationStatus: ApplicationStatus.APPROVED }),
      this.repo.countProviderAccounts({ applicationStatus: ApplicationStatus.PENDING }),
    ]);
    return { totalUsers, totalProviders, pendingApplications };
  }

  async viewApplications(statusFilter?: string) {
    const query: Record<string, string> = {};
    if (statusFilter) query.applicationStatus = statusFilter;
    return this.repo.findProviderAccounts(query);
  }

  async viewUsers(search?: string, statusFilter?: string) {
    const query: Record<string, unknown> = { role: Role.USER };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (statusFilter) query.status = statusFilter;
    return this.repo.findUsers(query);
  }

  async blockUser(userId: string) {
    const user = await this.repo.findUserById(userId);
    if (!user) throw new NotFoundError(Messages.USER_NOT_FOUND);
    if (user.role === Role.ADMIN) throw new ForbiddenError(Messages.CANNOT_BLOCK_ADMIN);
    return this.repo.updateUserById(userId, { status: Status.BLOCKED });
  }

  async unblockUser(userId: string) {
    const user = await this.repo.findUserById(userId);
    if (!user) throw new NotFoundError(Messages.USER_NOT_FOUND);
    if (user.role === Role.ADMIN) throw new ForbiddenError(Messages.CANNOT_MODIFY_ADMIN);
    return this.repo.updateUserById(userId, { status: Status.ACTIVE });
  }

  async approveProvider(appId: string) {
    const account = await this.repo.findProviderAccountById(appId);
    if (!account) throw new NotFoundError(Messages.APPLICATION_NOT_FOUND);
    await this.repo.updateProviderAccountStatus(appId, ApplicationStatus.APPROVED);
    return account;
  }

  async rejectProvider(appId: string, reasonCode?: string, adminRemarks?: string) {
    const account = await this.repo.findProviderAccountById(appId);
    if (!account) throw new NotFoundError(Messages.APPLICATION_NOT_FOUND);
    if (!reasonCode || !Object.values(RejectionReasonCode).includes(reasonCode as RejectionReasonCode)) {
      throw new BadRequestError(Messages.REJECTION_REASON_REQUIRED);
    }
    if (reasonCode === RejectionReasonCode.OTHER && (!adminRemarks || !adminRemarks.trim())) {
      throw new BadRequestError("Please provide admin remarks when selecting 'Other' as rejection reason");
    }
    const rejectionReason = REJECTION_REASON_LABELS[reasonCode as RejectionReasonCode];
    await this.repo.updateProviderAccountStatus(appId, ApplicationStatus.REJECTED, reasonCode, rejectionReason, adminRemarks?.trim());
    return account;
  }

  async viewProviders(search?: string, statusFilter?: string) {
    const query: Record<string, unknown> = {};
    if (search) query.name = { $regex: search, $options: "i" };
    if (statusFilter === Status.BLOCKED) {
      query.applicationStatus = ApplicationStatus.SUSPENDED;
    } else {
      query.applicationStatus = { $in: [ApplicationStatus.APPROVED, ApplicationStatus.SUSPENDED] };
    }
    return this.repo.findProviderAccounts(query);
  }

  async blockProvider(providerId: string) {
    const account = await this.repo.findProviderAccountById(providerId);
    if (!account) throw new NotFoundError(Messages.PROVIDER_NOT_FOUND);
    await this.repo.updateProviderAccountStatus(providerId, ApplicationStatus.SUSPENDED);
    return account;
  }

  async unblockProvider(providerId: string) {
    const account = await this.repo.findProviderAccountById(providerId);
    if (!account) throw new NotFoundError(Messages.PROVIDER_NOT_FOUND);
    await this.repo.updateProviderAccountStatus(providerId, ApplicationStatus.APPROVED);
    return account;
  }
}
