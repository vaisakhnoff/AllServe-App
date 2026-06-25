// ── Provider Online/Engagement Status ─────────────────────────────────────────
export type OnlineStatus = "online" | "offline";
export type EngagementStatus = "available" | "busy";

export interface ProviderStatus {
  onlineStatus: OnlineStatus;
  engagementStatus: EngagementStatus;
  lastOnlineAt?: string;
  lastStatusChangeAt?: string;
}

// ── Provider Schedule ─────────────────────────────────────────────────────────
export interface DaySchedule {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  isWorkingDay: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
}

export interface ProviderSchedule {
  _id: string;
  providerId: string;
  weeklyHours: DaySchedule[];
  bufferMinutes: number;
  defaultServiceDuration: number;
  advanceBookingDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertScheduleDto {
  weeklyHours: DaySchedule[];
  bufferMinutes?: number;
  defaultServiceDuration?: number;
  advanceBookingDays?: number;
}

// ── Provider Leave ────────────────────────────────────────────────────────────
export type LeaveStatus = "active" | "cancelled";

export interface ProviderLeave {
  _id: string;
  providerId: string;
  date: string;
  reason?: string;
  isFullDay: boolean;
  startTime?: string;
  endTime?: string;
  hasBookings: boolean;
  status: LeaveStatus;
  createdAt: string;
}

export interface AddLeaveDto {
  date: string;
  reason?: string;
  isFullDay?: boolean;
  startTime?: string;
  endTime?: string;
}

// ── Available Time Windows ────────────────────────────────────────────────────
export interface TimeWindow {
  startTime: string;
  endTime: string;
}

export interface AvailableWindowsResponse {
  date: string;
  providerId: string;
  windows: TimeWindow[];
}
