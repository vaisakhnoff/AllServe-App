import { 
  ProviderApplicationDto, 
  UpdateProviderProfileDto, 
  ProviderQuery,
  ProviderListItemDto,
  ProviderApplicationResponseDto,
  ProviderProfileResponseDto,
  ProviderDetailsDto
} from "../../dto/provider/provider.dto";

export interface IProviderService {
  applyProvider(userId: string, data: ProviderApplicationDto): Promise<ProviderApplicationResponseDto>;
  getApplicationStatus(userId: string): Promise<unknown>;
  requestApplicationStatusOtp(email: string): Promise<{ message: string }>;
  verifyApplicationStatusOtp(email: string, otp: string): Promise<null>;
  reapplyProvider(userId: string, data: ProviderApplicationDto): Promise<ProviderApplicationResponseDto>;
  getPublicProviders(query?: ProviderQuery, limit?: number): Promise<ProviderListItemDto[]>;
  getPublicProviderById(id: string): Promise<ProviderDetailsDto>;
  getProfile(userId: string): Promise<ProviderProfileResponseDto>;
  updateProfile(userId: string, data: UpdateProviderProfileDto): Promise<ProviderProfileResponseDto>;
  getDashboard(userId: string): Promise<unknown>;
}