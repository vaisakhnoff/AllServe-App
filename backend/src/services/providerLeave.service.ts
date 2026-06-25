import { IProviderLeaveService } from "../interfaces/provider-leave/IProviderLeaveService";
import { IProviderLeaveRepository } from "../interfaces/provider-leave/IProviderLeaveRepository";
import { IProviderLeave } from "../models/providerLeave.model";
import { AddLeaveDto } from "../dto/provider-leave/providerLeave.dto";
import { BookingModel } from "../models/booking.model";
import { BadRequestError, ConflictError, NotFoundError } from "../shared/errors/HttpErrors";

export class ProviderLeaveService implements IProviderLeaveService {
  constructor(private readonly repo: IProviderLeaveRepository) {}

  async addLeave(providerId: string, dto: AddLeaveDto): Promise<IProviderLeave> {
    // Validate date is in the future
    const today = new Date().toISOString().split("T")[0];
    if (dto.date <= today) {
      throw new BadRequestError("Leave date must be in the future");
    }

    // Check if already on leave for this date
    const existing = await this.repo.findByProviderAndDate(providerId, dto.date);
    if (existing) {
      throw new ConflictError("Leave already exists for this date");
    }

    // Check if there are existing bookings on this date
    const bookingCount = await BookingModel.countDocuments({
      providerId,
      date: dto.date,
      bookingStatus: { $in: ["confirmed", "accepted", "in_progress"] },
    });

    if (bookingCount > 0) {
      throw new BadRequestError(
        `Cannot take leave on ${dto.date} — you have ${bookingCount} active booking(s). Please cancel or complete them first.`
      );
    }

    return this.repo.create({
      providerId: providerId as unknown as IProviderLeave["providerId"],
      date: dto.date,
      reason: dto.reason,
      isFullDay: dto.isFullDay,
      startTime: dto.startTime,
      endTime: dto.endTime,
      hasBookings: false,
      status: "active",
    });
  }

  async cancelLeave(providerId: string, date: string): Promise<IProviderLeave> {
    const leave = await this.repo.cancelLeave(providerId, date);
    if (!leave) {
      throw new NotFoundError("No active leave found for this date");
    }
    return leave;
  }

  async getLeaves(providerId: string, month?: string, status?: string): Promise<IProviderLeave[]> {
    // Default to current month if not specified
    const yearMonth = month || new Date().toISOString().slice(0, 7);
    return this.repo.findByProviderMonth(providerId, yearMonth, status);
  }
}
