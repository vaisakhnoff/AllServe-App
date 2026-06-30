import { ISlotRepository } from "../../interfaces/slot/ISlotRepository";
import { ISlotService, BulkCreateResult } from "../../interfaces/slot/ISlotService";
import { CreateSlotDto, UpdateSlotDto, BulkCreateDto, RecurringSlotDto, BlockRangeDto } from "../../dto/slot/slot.dto";
import { ISlot } from "../../models/slot.model";
import { NotFoundError, BadRequestError, ConflictError, InternalServerError } from "../../shared/errors/HttpErrors";

export class SlotService implements ISlotService {
  constructor(private readonly repo: ISlotRepository) {}

  async createSlot(providerId: string, data: CreateSlotDto): Promise<ISlot> {
    this.validateTimeRange(data.startTime, data.endTime);
    this.validateFutureDate(data.date, data.startTime);
    const overlap = await this.repo.findOverlapping(providerId, data.date, data.startTime, data.endTime);
    if (overlap) throw new ConflictError("Slot overlaps with an existing slot");
    return this.repo.createSlot(providerId, data);
  }

  async bulkCreate(providerId: string, data: BulkCreateDto): Promise<BulkCreateResult> {
    this.validateTimeRange(data.startTime, data.endTime);
    let created = 0;
    const skipped: string[] = [];
    for (const date of data.dates) {
      const overlap = await this.repo.findOverlapping(providerId, date, data.startTime, data.endTime);
      if (overlap) { skipped.push(date); continue; }
      try {
        this.validateFutureDate(date, data.startTime);
        await this.repo.createSlot(providerId, { date, startTime: data.startTime, endTime: data.endTime, slotStatus: data.slotStatus, serviceId: data.serviceId });
        created++;
      } catch { skipped.push(date); }
    }
    return { created, skipped: skipped.length, skippedDates: skipped };
  }

  async createRecurring(providerId: string, data: RecurringSlotDto) {
    this.validateTimeRange(data.startTime, data.endTime);
    const dates = this.generateRecurringDates(data);
    let created = 0;
    const skipped: string[] = [];
    for (const date of dates) {
      const overlap = await this.repo.findOverlapping(providerId, date, data.startTime, data.endTime);
      if (overlap) { skipped.push(date); continue; }
      try {
        this.validateFutureDate(date, data.startTime);
        await this.repo.createSlot(providerId, { date, startTime: data.startTime, endTime: data.endTime, slotStatus: data.slotStatus, serviceId: data.serviceId });
        created++;
      } catch { skipped.push(date); }
    }
    return { created, skipped: skipped.length, total: dates.length };
  }

  async blockDateRange(providerId: string, data: BlockRangeDto) {
    if (data.startDate > data.endDate) throw new BadRequestError("Start date must be before end date");
    const startTime = data.startTime || "00:00";
    const endTime = data.endTime || "23:59";
    const dates: string[] = [];
    const current = new Date(data.startDate);
    while (current <= new Date(data.endDate)) {
      dates.push(current.toISOString().slice(0, 10));
      current.setDate(current.getDate() + 1);
    }
    let blocked = 0;
    for (const date of dates) {
      blocked += await this.repo.blockSlotsOnDate(providerId, date);
    }
    for (const date of dates) {
      const existing = await this.repo.findOverlapping(providerId, date, startTime, endTime);
      if (!existing) {
        await this.repo.createSlot(providerId, { date, startTime, endTime, slotStatus: "blocked" });
        blocked++;
      }
    }
    return { blockedDates: dates.length, slotsAffected: blocked };
  }

  async getProviderSlots(providerId: string, date?: string): Promise<ISlot[]> {
    return this.repo.findByProvider(providerId, date);
  }

  async getSlotStats(providerId: string) {
    return this.repo.getStats(providerId);
  }

  async updateSlot(providerId: string, slotId: string, data: UpdateSlotDto): Promise<ISlot> {
    if (data.startTime && data.endTime) this.validateTimeRange(data.startTime, data.endTime);
    if (data.date || data.startTime || data.endTime) {
      const existing = await this.repo.findById(slotId);
      if (!existing) throw new NotFoundError("Slot not found");
      const date = data.date || existing.date;
      const startTime = data.startTime || existing.startTime;
      const endTime = data.endTime || existing.endTime;
      this.validateTimeRange(startTime, endTime);
      this.validateFutureDate(date, startTime);
      const overlap = await this.repo.findOverlapping(providerId, date, startTime, endTime, slotId);
      if (overlap) throw new ConflictError("Slot overlaps with an existing slot");
    }
    const updated = await this.repo.updateSlot(slotId, providerId, data);
    if (!updated) throw new NotFoundError("Slot not found or already booked");
    return updated;
  }

  async deleteSlot(providerId: string, slotId: string): Promise<void> {
    const deleted = await this.repo.deleteSlot(slotId, providerId);
    if (!deleted) throw new NotFoundError("Slot not found or already booked");
  }

  async getAvailableSlots(providerId: string, date?: string): Promise<ISlot[]> {
    return this.repo.findAvailable(providerId, date);
  }

  async lockSlot(slotId: string, userId: string): Promise<ISlot> {
    const locked = await this.repo.acquireLock(slotId, userId);
    if (!locked) throw new ConflictError("Slot is not available or already locked");
    return locked;
  }

  async unlockSlot(slotId: string): Promise<void> {
    await this.repo.releaseLock(slotId);
  }

  async bookSlot(slotId: string, userId: string, serviceId?: string): Promise<ISlot> {
    const slot = await this.repo.findById(slotId);
    if (!slot) throw new NotFoundError("Slot not found");
    if (slot.slotStatus !== "available") throw new ConflictError("Slot is not available");
    if (!slot.lockedBy || slot.lockedBy !== userId) {
      throw new BadRequestError("You must lock the slot before booking");
    }
    const booked = await this.repo.markBooked(slotId, serviceId);
    if (!booked) throw new InternalServerError("Failed to book slot");
    return booked;
  }

  private validateTimeRange(startTime: string, endTime: string): void {
    if (startTime >= endTime) throw new BadRequestError("End time must be after start time");
  }

  private validateFutureDate(date: string, startTime: string): void {
    const slotDateTime = new Date(`${date}T${startTime}:00`);
    if (slotDateTime <= new Date()) throw new BadRequestError("Slot must be in the future");
  }

  private generateRecurringDates(data: RecurringSlotDto): string[] {
    const dates: string[] = [];
    const start = new Date(data.startDate);
    const maxOccurrences = data.occurrences || 30;
    const endDate = data.endDate ? new Date(data.endDate) : null;
    const maxDate = endDate || new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000);
    const current = new Date(start);
    while (dates.length < maxOccurrences && current <= maxDate) {
      const day = current.getDay();
      let include = false;
      switch (data.pattern) {
        case "daily": include = true; break;
        case "weekly": include = day === start.getDay(); break;
        case "weekdays": include = day >= 1 && day <= 5; break;
        case "weekends": include = day === 0 || day === 6; break;
        case "custom": include = (data.customDays || []).includes(day); break;
      }
      if (include) dates.push(current.toISOString().slice(0, 10));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }
}
