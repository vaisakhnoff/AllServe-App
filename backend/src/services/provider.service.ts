import { Types } from "mongoose";
import bcrypt from "bcryptjs";
import { IProviderRepository } from "../interfaces/provider/IProviderRepository";
import { IProviderService } from "../interfaces/provider/IProviderService";
import { IServiceRepository } from "../interfaces/service/IServiceRepository";
import { 
  ProviderApplicationDto, 
  UpdateProviderProfileDto, 
  ProviderQuery,
} from "../dto/provider/provider.dto";
import { IProviderAccount } from "../models/providerAccount.model";
import { ApplicationStatus } from "../shared/enums/application-status.enum";
import { escapeRegex } from "../shared/utils/search";
import { Messages } from "../shared/constants/messages";
import { mapProviderListItem, mapProviderDetails, mapApplication, mapProviderProfile, resolveLocation } from "../mappers/provider.mapper";
import { NotFoundError, BadRequestError } from "../shared/errors/HttpErrors";



export class ProviderService implements IProviderService {
  constructor(
    private readonly repo: IProviderRepository,
    private readonly serviceRepo: IServiceRepository
  ) {}

  async applyProvider(providerId: string, data: ProviderApplicationDto) {
    
    const account = await this.repo.findById(providerId);
    if (!account) throw new NotFoundError(Messages.PROVIDER_ACCOUNT_NOT_FOUND);
    if (account.applicationStatus !== ApplicationStatus.NOT_APPLIED) {
      throw new BadRequestError(Messages.APPLICATION_ALREADY_SUBMITTED);
    }
    const locationFields = await resolveLocation(data);
    const updated = await this.repo.updateAccount(providerId, {
      categoryId: new Types.ObjectId(data.categoryId),
      subCategory: data.subCategory,
      experience: data.experience,
      address: data.address,
      description: data.description,
      serviceArea: data.serviceArea,
      documentType: data.documentType,
      headshot: data.headshot,
      documents: data.documents ?? [],
      businessName: data.businessName,
      applicationStatus: ApplicationStatus.PENDING,
      ...locationFields,
    } as Partial<IProviderAccount>);
    return mapApplication(updated!);
  }

  async getApplicationStatus(providerId: string) {
    const account = await this.repo.findById(providerId);
    if (!account) throw new NotFoundError(Messages.PROVIDER_ACCOUNT_NOT_FOUND);
    if (account.applicationStatus === ApplicationStatus.NOT_APPLIED) {
      return { status: ApplicationStatus.NOT_APPLIED, rejectionReason: null };
    }
    return {
      id: account._id,
      status: account.applicationStatus,
      rejectionReasonCode: account.rejectionReasonCode ?? null,
      rejectionReason: account.rejectionReason ?? null,
      adminRemarks: account.adminRemarks ?? null,
      rejectedAt: account.rejectedAt ?? null,
      category: account.categoryId,
      fullName: account.name,
      email: account.email,
      phone: account.phone,
      experience: account.experience,
      description: account.description,
      address: account.address,
      serviceArea: account.serviceArea,
      documentType: account.documentType,
      subCategory: account.subCategory,
      headshot: account.headshot,
      documents: account.documents,
    };
  }

  async reapplyProvider(providerId: string, data: ProviderApplicationDto) {
    const account = await this.repo.findById(providerId);
    if (!account) throw new NotFoundError(Messages.PROVIDER_ACCOUNT_NOT_FOUND);
    if (account.applicationStatus !== ApplicationStatus.REJECTED) {
      throw new BadRequestError(Messages.NO_REJECTED_APPLICATION);
    }
    const locationFields = await resolveLocation(data);
    const updated = await this.repo.updateAccount(providerId, {
      categoryId: new Types.ObjectId(data.categoryId),
      subCategory: data.subCategory,
      experience: data.experience,
      address: data.address,
      description: data.description,
      serviceArea: data.serviceArea,
      documentType: data.documentType,
      headshot: data.headshot,
      documents: data.documents ?? [],
      businessName: data.businessName,
      applicationStatus: ApplicationStatus.PENDING,
      rejectionReasonCode: undefined,
      rejectionReason: undefined,
      adminRemarks: undefined,
      rejectedAt: undefined,
      ...locationFields,
    } as Partial<IProviderAccount>);
    return mapApplication(updated!);
  }

  async getPublicProviders(query: ProviderQuery = {}, limit?: number) {
    if (query.latitude && query.longitude) {
      const radius = query.radius || 10;
      const providers = await this.repo.findNearbyProviders(query.longitude, query.latitude, radius * 1000, query.categoryId, query.search, limit);
      if (providers.length > 0) return providers.map(mapProviderListItem);
      if (query.search) {
        const filter: Record<string, unknown> = {};
        if (query.categoryId && Types.ObjectId.isValid(query.categoryId)) filter.categoryId = query.categoryId;
        const searchRegex = { $regex: escapeRegex(query.search), $options: "i" };
        filter.$or = [
          { name: searchRegex }, { businessName: searchRegex }, { "services.name": searchRegex },
          { city: searchRegex }, { district: searchRegex }, { state: searchRegex },
          { pincode: searchRegex }, { fullAddress: searchRegex }, { serviceArea: searchRegex }, { serviceAreas: searchRegex },
        ];
        const fallback = await this.repo.findApprovedProviders(filter, limit);
        return fallback.map(mapProviderListItem);
      }
      return [];
    }
    const filter: Record<string, unknown> = {};
    if (query.categoryId) {
      if (!Types.ObjectId.isValid(query.categoryId)) return [];
      filter.categoryId = query.categoryId;
    }
    if (query.search) {
      const searchRegex = { $regex: escapeRegex(query.search), $options: "i" };
      filter.$or = [
        { name: searchRegex }, { businessName: searchRegex }, { "services.name": searchRegex },
        { city: searchRegex }, { district: searchRegex }, { state: searchRegex },
        { pincode: searchRegex }, { fullAddress: searchRegex }, { serviceArea: searchRegex }, { serviceAreas: searchRegex },
      ];
    }
    const providers = await this.repo.findApprovedProviders(filter, limit);
    return providers.map(mapProviderListItem);
  }

  async getPublicProviderById(id: string) {
    const provider = await this.repo.findApprovedProviderById(id);
    if (!provider) throw new NotFoundError(Messages.PROVIDER_NOT_FOUND);

      const [subcategoriesWorkedIn, services] = await Promise.all([
    this.serviceRepo.findProviderSubcategories(String(provider._id)),
    this.serviceRepo.findPublicByProvider(String(provider._id)),
  ]);
    
    const mapped = mapProviderDetails(provider);
    return {
    ...mapped,
    subcategoriesWorkedIn,
    services: services.map((s) => ({
      id: String(s._id),
      name: s.name,
      price: s.price,
      description: s.description,
      subCategory: s.subCategory ?? null,
    })),
  };


  }

  async getProfile(providerId: string) {
    const account = await this.repo.findById(providerId);
    if (!account) throw new NotFoundError(Messages.PROVIDER_PROFILE_NOT_FOUND);
    return mapProviderProfile(account);

  }

  async updateProfile(providerId: string, data: UpdateProviderProfileDto) {
    const locationFields = await resolveLocation(data);
    const updated = await this.repo.updateAccount(providerId, {
      ...(data.categoryId && { categoryId: new Types.ObjectId(data.categoryId) }),
      ...(data.experience && { experience: data.experience }),
      ...(data.description && { description: data.description }),
      ...(data.serviceArea && { serviceAreas: [data.serviceArea] }),
      ...(data.headshot && { headshot: data.headshot }),
      ...locationFields,
    } as Partial<IProviderAccount>);
    if (!updated) throw new NotFoundError(Messages.PROVIDER_PROFILE_NOT_FOUND);
    return mapProviderProfile(updated);
  }

  async getDashboard(providerId: string) {
    const account = await this.repo.findById(providerId);
    if (!account) throw new NotFoundError(Messages.PROVIDER_PROFILE_NOT_FOUND);
    const [totalServices, activeServices] = await Promise.all([
      this.serviceRepo.countByProvider(providerId),
      this.serviceRepo.countByProvider(providerId, "active"),
    ]);
    return { totalServices, activeServices, profileCompletion: this.getProfileCompletion(account) };
  }

  async requestApplicationStatusOtp(_email: string): Promise<{ message: string }> {
    throw new BadRequestError("OTP-based status checking has been removed.");
  }

  async verifyApplicationStatusOtp(_email: string, _otp: string): Promise<null> {
    throw new BadRequestError("OTP-based status checking has been removed.");
  }

  async changePassword(providerId: string, oldPassword: string, newPassword: string) {
    const account = await this.repo.findById(providerId);
    if (!account) throw new NotFoundError(Messages.PROVIDER_PROFILE_NOT_FOUND);
    const isMatch = await bcrypt.compare(oldPassword, account.password);
    if (!isMatch) throw new BadRequestError("Current password is incorrect");
    const hash = await bcrypt.hash(newPassword, 10);
    await this.repo.updateAccount(providerId, { password: hash } as Partial<IProviderAccount>);
    return { message: "Password updated successfully" };
  }


  private getProfileCompletion(account: IProviderAccount): number {
    const checks = [
      account.name,
      account.experience !== undefined && account.experience !== null,
      account.description,
      account.categoryId,
      account.serviceAreas?.length,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }
}
