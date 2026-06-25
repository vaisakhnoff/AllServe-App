import { IProviderLeave } from "../../models/providerLeave.model";
import { AddLeaveDto } from "../../dto/provider-leave/providerLeave.dto";

export interface IProviderLeaveService {
  addLeave(providerId: string, dto: AddLeaveDto): Promise<IProviderLeave>;
  cancelLeave(providerId: string, date: string): Promise<IProviderLeave>;
  getLeaves(providerId: string, month?: string, status?: string): Promise<IProviderLeave[]>;
}
