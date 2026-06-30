import { IProviderScheduleService, TimeWindow } from "../../interfaces/provider-schedule/IProviderScheduleService";
import { IProviderScheduleRepository } from "../../interfaces/provider-schedule/IProviderScheduleRepository";
import { IProviderLeaveRepository } from "../../interfaces/provider-leave/IProviderLeaveRepository";
import { IProviderSchedule } from "../../models/providerSchedule.model";
import { UpsertScheduleDto } from "../../dto/provider-schedule/providerSchedule.dto";
import { BookingModel } from "../../models/booking.model";
import { NotFoundError, BadRequestError } from "../../shared/errors/HttpErrors";

/**
 * Convert "HH:mm" to total minutes since midnight.
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Convert total minutes since midnight to "HH:mm".
 */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export class ProviderScheduleService implements IProviderScheduleService {
  constructor(
    private readonly scheduleRepo: IProviderScheduleRepository,
    private readonly leaveRepo: IProviderLeaveRepository
  ) {}

  async getSchedule(providerId: string): Promise<IProviderSchedule | null> {
    return this.scheduleRepo.findByProviderId(providerId);
  }

  async upsertSchedule(providerId: string, dto: UpsertScheduleDto): Promise<IProviderSchedule> {
    return this.scheduleRepo.upsert(providerId, {
      weeklyHours: dto.weeklyHours as IProviderSchedule["weeklyHours"],
      bufferMinutes: dto.bufferMinutes,
      defaultServiceDuration: dto.defaultServiceDuration,
      advanceBookingDays: dto.advanceBookingDays,
    });
  }

  async getAvailableWindows(
    providerId: string,
    date: string,
    durationMinutes?: number
  ): Promise<TimeWindow[]> {
    // 1. Load provider schedule
    const schedule = await this.scheduleRepo.findByProviderId(providerId);
    if (!schedule) throw new NotFoundError("Provider has not set up their schedule");

    // Determine the service duration
    const serviceDuration = durationMinutes || schedule.defaultServiceDuration;

    // 2. Find day-of-week for the requested date
    const dateObj = new Date(date + "T00:00:00");
    if (isNaN(dateObj.getTime())) throw new BadRequestError("Invalid date format");
    
    const dayOfWeek = dateObj.getDay(); // 0=Sunday

    // 3. Check if it's a working day
    const daySchedule = schedule.weeklyHours.find((d) => d.day === dayOfWeek);
    if (!daySchedule || !daySchedule.isWorkingDay) return [];

    // 4. Check if provider is on leave
    const leaves = await this.leaveRepo.getActiveLeavesForDate(providerId, date);
    const fullDayLeave = leaves.find((l) => l.isFullDay);
    if (fullDayLeave) return [];

    // 5. Build available blocks from working hours
    const workStart = timeToMinutes(daySchedule.startTime);
    const workEnd = timeToMinutes(daySchedule.endTime);

    // Blocks that are NOT available (breaks + partial leaves + existing bookings)
    const blockedRanges: { start: number; end: number }[] = [];

    // Add break
    if (daySchedule.breakStart && daySchedule.breakEnd) {
      blockedRanges.push({
        start: timeToMinutes(daySchedule.breakStart),
        end: timeToMinutes(daySchedule.breakEnd),
      });
    }

    // Add partial-day leaves
    for (const leave of leaves) {
      if (!leave.isFullDay && leave.startTime && leave.endTime) {
        blockedRanges.push({
          start: timeToMinutes(leave.startTime),
          end: timeToMinutes(leave.endTime),
        });
      }
    }

    // 6. Load existing bookings for this provider on this date
    const existingBookings = await BookingModel.find({
      providerId,
      date,
      bookingStatus: { $in: ["confirmed", "accepted", "in_progress"] },
    }).lean();

    for (const booking of existingBookings) {
      const bookingStart = timeToMinutes(booking.startTime);
      const bookingEnd = timeToMinutes(booking.endTime);
      blockedRanges.push({
        start: bookingStart,
        end: bookingEnd + schedule.bufferMinutes, // Add buffer after booking
      });
    }

    // 7. Sort blocked ranges and merge overlaps
    blockedRanges.sort((a, b) => a.start - b.start);
    const merged: { start: number; end: number }[] = [];
    for (const range of blockedRanges) {
      if (merged.length > 0 && range.start <= merged[merged.length - 1].end) {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, range.end);
      } else {
        merged.push({ ...range });
      }
    }

    // 8. Compute free windows
    const freeRanges: { start: number; end: number }[] = [];
    let cursor = workStart;

    for (const blocked of merged) {
      if (blocked.start > cursor) {
        freeRanges.push({ start: cursor, end: Math.min(blocked.start, workEnd) });
      }
      cursor = Math.max(cursor, blocked.end);
    }
    if (cursor < workEnd) {
      freeRanges.push({ start: cursor, end: workEnd });
    }

    // 9. Split free ranges into windows of `serviceDuration` size
    const windows: TimeWindow[] = [];
    const slotStep = serviceDuration + schedule.bufferMinutes;

    for (const range of freeRanges) {
      let windowStart = range.start;
      while (windowStart + serviceDuration <= range.end) {
        windows.push({
          startTime: minutesToTime(windowStart),
          endTime: minutesToTime(windowStart + serviceDuration),
        });
        windowStart += slotStep;
      }
    }

    return windows;
  }
}
