import { IProviderSchedule } from "../../models/providerSchedule.model";
import { UpsertScheduleDto } from "../../dto/provider-schedule/providerSchedule.dto";

export interface TimeWindow {
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

export interface IProviderScheduleService {
  getSchedule(providerId: string): Promise<IProviderSchedule | null>;
  upsertSchedule(providerId: string, dto: UpsertScheduleDto): Promise<IProviderSchedule>;
  getAvailableWindows(providerId: string, date: string, durationMinutes: number): Promise<TimeWindow[]>;
}
