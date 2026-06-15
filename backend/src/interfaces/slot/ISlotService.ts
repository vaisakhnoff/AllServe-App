import { ISlot } from "../../models/slot.model";
import { CreateSlotDto, UpdateSlotDto, BulkCreateDto, RecurringSlotDto, BlockRangeDto } from "../../dto/slot/slot.dto";

export interface BulkCreateResult {
  created: number;
  skipped: number;
  skippedDates: string[];
}

export interface ISlotService {
  createSlot(providerId: string, data: CreateSlotDto): Promise<ISlot>;
  bulkCreate(providerId: string, data: BulkCreateDto): Promise<BulkCreateResult>;
  createRecurring(
    providerId: string,
    data: RecurringSlotDto
  ): Promise<{ created: number; skipped: number; total: number }>;
  blockDateRange(
    providerId: string,
    data: BlockRangeDto
  ): Promise<{ blockedDates: number; slotsAffected: number }>;
  getProviderSlots(providerId: string, date?: string): Promise<ISlot[]>;
  getSlotStats(providerId: string): Promise<unknown>;
  updateSlot(providerId: string, slotId: string, data: UpdateSlotDto): Promise<ISlot>;
  deleteSlot(providerId: string, slotId: string): Promise<void>;
  getAvailableSlots(providerId: string, date?: string): Promise<ISlot[]>;
  lockSlot(slotId: string, userId: string): Promise<ISlot>;
  unlockSlot(slotId: string): Promise<void>;
  bookSlot(slotId: string, userId: string, serviceId?: string): Promise<ISlot>;
}
