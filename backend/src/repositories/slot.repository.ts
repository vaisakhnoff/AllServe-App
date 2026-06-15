import { BaseRepository } from "./base.repository";
import { ISlotRepository, SlotStats } from "../interfaces/slot/ISlotRepository";
import { SlotModel, ISlot } from "../models/slot.model";
import { CreateSlotDto, UpdateSlotDto } from "../dto/slot/slot.dto";

const LOCK_TTL_MS = 5 * 60 * 1000;

export class SlotRepository
  extends BaseRepository<ISlot>
  implements ISlotRepository
{
  constructor() {
    super(SlotModel);
  }

  async createSlot(providerId: string, data: CreateSlotDto): Promise<ISlot> {
    return SlotModel.create({ providerId, ...data }) as Promise<ISlot>;
  }

  async findByProvider(providerId: string, date?: string): Promise<ISlot[]> {
    const filter: Record<string, unknown> = { providerId };
    if (date) filter.date = date;
    return this.model.find(filter).sort({ date: 1, startTime: 1 }).exec();
  }

  async updateSlot(id: string, providerId: string, data: UpdateSlotDto): Promise<ISlot | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id, providerId, slotStatus: { $nin: ["booked"] } },
        data,
        { returnDocument: 'after' }
      )
      .exec();
  }

  async releaseSlot(id: string): Promise<void> {
    await this.model.updateOne(
      { _id: id },
      { slotStatus: "available", lockedAt: null, lockedBy: null }
    );
  }

  async deleteSlot(id: string, providerId: string): Promise<ISlot | null> {
    return this.model
      .findOneAndDelete({ _id: id, providerId, slotStatus: { $ne: "booked" } })
      .exec();
  }

  async findOverlapping(
    providerId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<ISlot | null> {
    const filter: Record<string, unknown> = {
      providerId,
      date,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
      slotStatus: { $nin: ["cancelled"] },
    };
    if (excludeId) filter._id = { $ne: excludeId };
    return this.model.findOne(filter).exec();
  }

  async findAvailable(providerId: string, date?: string): Promise<ISlot[]> {
    const today = new Date().toISOString().slice(0, 10);
    const filter: Record<string, unknown> = {
      providerId,
      slotStatus: "available",
      date: { $gte: today },
      $or: [
        { lockedAt: null },
        { lockedAt: { $lt: new Date(Date.now() - LOCK_TTL_MS) } },
      ],
    };
    if (date) filter.date = date;
    return this.model.find(filter).sort({ date: 1, startTime: 1 }).exec();
  }

  async acquireLock(slotId: string, userId: string): Promise<ISlot | null> {
    return this.model
      .findOneAndUpdate(
        {
          _id: slotId,
          slotStatus: "available",
          $or: [
            { lockedAt: null },
            { lockedAt: { $lt: new Date(Date.now() - LOCK_TTL_MS) } },
          ],
        },
        { lockedAt: new Date(), lockedBy: userId },
        { returnDocument: 'after' }
      )
      .exec();
  }

  async releaseLock(slotId: string): Promise<void> {
    await this.model.updateOne({ _id: slotId }, { lockedAt: null, lockedBy: null });
  }

  async markBooked(slotId: string, serviceId?: string): Promise<ISlot | null> {
    const update: Record<string, unknown> = {
      slotStatus: "booked",
      lockedAt: null,
      lockedBy: null,
    };
    if (serviceId) update.serviceId = serviceId;
    return this.model.findOneAndUpdate({ _id: slotId }, update, { returnDocument: 'after' }).exec();
  }

  async getStats(providerId: string): Promise<SlotStats> {
    const today = new Date().toISOString().slice(0, 10);
    const [available, booked, blocked, cancelled, total, todayBooked, upcoming] =
      await Promise.all([
        this.model.countDocuments({ providerId, slotStatus: "available", date: { $gte: today } }),
        this.model.countDocuments({ providerId, slotStatus: "booked" }),
        this.model.countDocuments({ providerId, slotStatus: "blocked", date: { $gte: today } }),
        this.model.countDocuments({ providerId, slotStatus: "cancelled" }),
        this.model.countDocuments({ providerId }),
        this.model.countDocuments({ providerId, slotStatus: "booked", date: today }),
        this.model.countDocuments({ providerId, slotStatus: "booked", date: { $gt: today } }),
      ]);
    return { available, booked, blocked, cancelled, total, todayBooked, upcoming };
  }

  async blockSlotsOnDate(providerId: string, date: string): Promise<number> {
    const result = await this.model.updateMany(
      { providerId, date, slotStatus: "available" },
      { slotStatus: "blocked" }
    );
    return result.modifiedCount;
  }
}
