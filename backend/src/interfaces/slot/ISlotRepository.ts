import { ISlot } from "../../models/slot.model";
import { CreateSlotDto, UpdateSlotDto } from "../../dto/slot/slot.dto";

export interface SlotStats {
  available: number;
  booked: number;
  blocked: number;
  cancelled: number;
  total: number;
  todayBooked: number;
  upcoming: number;
}

export interface ISlotRepository {
  createSlot(providerId: string, data: CreateSlotDto): Promise<ISlot>;
  findByProvider(providerId: string, date?: string): Promise<ISlot[]>;
  findById(id: string): Promise<ISlot | null>;
  updateSlot(id: string, providerId: string, data: UpdateSlotDto): Promise<ISlot | null>;
  deleteSlot(id: string, providerId: string): Promise<ISlot | null>;
  findOverlapping(
    providerId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<ISlot | null>;
  findAvailable(providerId: string, date?: string): Promise<ISlot[]>;
  acquireLock(slotId: string, userId: string): Promise<ISlot | null>;
  releaseLock(slotId: string): Promise<void>;
  releaseSlot(id: string): Promise<void>;
  markBooked(slotId: string, serviceId?: string): Promise<ISlot | null>;
  getStats(providerId: string): Promise<SlotStats>;
  blockSlotsOnDate(providerId: string, date: string): Promise<number>;
}