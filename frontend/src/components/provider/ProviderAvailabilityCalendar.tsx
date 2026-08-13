"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Briefcase,
  Palmtree,
  Coffee,
  User,
  MapPin,
  Phone,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { DaySchedule, ProviderLeave } from "@/types/providerSchedule.types";
import { ServiceOrder } from "@/types/order.types";

interface ProviderAvailabilityCalendarProps {
  weeklyHours: DaySchedule[];
  leaves: ProviderLeave[];
  orders: ServiceOrder[];
  onAddLeave?: (date: string, reason?: string) => Promise<void>;
  onCancelLeave?: (date: string) => Promise<void>;
  isLoading?: boolean;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function ProviderAvailabilityCalendar({
  weeklyHours,
  leaves,
  orders,
  onAddLeave,
  onCancelLeave,
  isLoading = false,
}: ProviderAvailabilityCalendarProps) {
  // Calendar month state: Date object representing 1st of active month
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // Selected date string (YYYY-MM-DD) for schedule card
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  // Leave modal state for selected date
  const [leaveReason, setLeaveReason] = useState("");
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentMonthDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    setSelectedDate(`${y}-${m}-${d}`);
  };

  // Build calendar matrix (42 days grid for full 6-week display)
  const calendarDays = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: Array<{
      dateString: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      dayOfWeek: number;
      dateObj: Date;
    }> = [];

    // Previous month tail
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const dateObj = new Date(year, month - 1, d);
      const mStr = String(dateObj.getMonth() + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      days.push({
        dateString: `${dateObj.getFullYear()}-${mStr}-${dStr}`,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: false,
        dayOfWeek: dateObj.getDay(),
        dateObj,
      });
    }

    // Current month days
    const todayObj = new Date();
    const todayStr = `${todayObj.getFullYear()}-${String(
      todayObj.getMonth() + 1
    ).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const mStr = String(month + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      const dateString = `${year}-${mStr}-${dStr}`;

      days.push({
        dateString,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateString === todayStr,
        dayOfWeek: dateObj.getDay(),
        dateObj,
      });
    }

    // Next month head filler (to reach multiple of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const dateObj = new Date(year, month + 1, d);
      const mStr = String(dateObj.getMonth() + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      days.push({
        dateString: `${dateObj.getFullYear()}-${mStr}-${dStr}`,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: false,
        dayOfWeek: dateObj.getDay(),
        dateObj,
      });
    }

    return days;
  }, [currentMonthDate]);

  // Helper lookups for a date
  const getLeaveForDate = (dateStr: string) => {
    return leaves.find((l) => l.date === dateStr && l.status === "active");
  };

  const getWorksForDate = (dateStr: string) => {
    return orders.filter((o) => {
      if (o.preferredDate === dateStr) return true;
      // Also match created date if preferredDate is not present
      if (!o.preferredDate && o.createdAt) {
        const createdDate = o.createdAt.slice(0, 10);
        return createdDate === dateStr;
      }
      return false;
    });
  };

  const isWorkingDayBySchedule = (dayOfWeek: number) => {
    const dayConfig = weeklyHours.find((w) => w.day === dayOfWeek);
    return dayConfig ? dayConfig.isWorkingDay : false;
  };

  const getScheduleForDayOfWeek = (dayOfWeek: number) => {
    return weeklyHours.find((w) => w.day === dayOfWeek);
  };

  // Monthly summary stats
  const monthSummary = useMemo(() => {
    const currentMonthPrefix = `${currentMonthDate.getFullYear()}-${String(
      currentMonthDate.getMonth() + 1
    ).padStart(2, "0")}`;

    const monthLeaves = leaves.filter(
      (l) => l.date.startsWith(currentMonthPrefix) && l.status === "active"
    );

    const monthWorks = orders.filter((o) => {
      const date = o.preferredDate || o.createdAt?.slice(0, 10);
      return date && date.startsWith(currentMonthPrefix);
    });

    const currentMonthDays = calendarDays.filter((d) => d.isCurrentMonth);
    const totalWorkingDays = currentMonthDays.filter(
      (d) =>
        isWorkingDayBySchedule(d.dayOfWeek) && !getLeaveForDate(d.dateString)
    ).length;

    return {
      leaveCount: monthLeaves.length,
      worksCount: monthWorks.length,
      workingDaysCount: totalWorkingDays,
    };
  }, [calendarDays, leaves, orders, currentMonthDate, weeklyHours]);

  // Selected date variables
  const selectedDateObj = useMemo(() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDate]);

  const selectedDayLeave = getLeaveForDate(selectedDate);
  const selectedDayWorks = getWorksForDate(selectedDate);
  const selectedDayOfWeek = selectedDateObj.getDay();
  const selectedDaySchedule = getScheduleForDayOfWeek(selectedDayOfWeek);
  const isSelectedDayWorking =
    selectedDaySchedule?.isWorkingDay && !selectedDayLeave;

  // Handle Quick Add Leave
  const handleQuickAddLeave = async () => {
    if (!onAddLeave) return;
    setIsSubmittingLeave(true);
    try {
      await onAddLeave(selectedDate, leaveReason);
      setLeaveReason("");
      setShowLeaveForm(false);
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  // Handle Quick Cancel Leave
  const handleQuickCancelLeave = async () => {
    if (!onCancelLeave) return;
    setIsSubmittingLeave(true);
    try {
      await onCancelLeave(selectedDate);
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const formatMonthTitle = currentMonthDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const formatSelectedDateFull = selectedDateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Helper status color badges for orders
  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
      case "inspection_accepted":
      case "quotation_accepted":
        return {
          label: "Accepted",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "in_progress":
        return {
          label: "In Progress",
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse",
        };
      case "work_completed":
      case "inspection_completed":
        return {
          label: "Work Done",
          bg: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "completed":
        return {
          label: "Completed",
          bg: "bg-emerald-100 text-emerald-800 border-emerald-300",
        };
      case "awaiting_provider_response":
        return {
          label: "Action Required",
          bg: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "cancelled":
      case "rejected_by_provider":
      case "dropped_by_provider":
        return {
          label: "Cancelled",
          bg: "bg-slate-100 text-slate-600 border-slate-200",
        };
      default:
        return {
          label: status.replace(/_/g, " "),
          bg: "bg-slate-100 text-slate-700 border-slate-200",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Monthly Summary Quick Bar ───────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3.5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
            <Briefcase size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Works This Month
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-950">
                {monthSummary.worksCount}
              </span>
              <span className="text-xs font-semibold text-indigo-600">
                scheduled
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/80 to-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white shadow-md shadow-rose-500/20">
            <Palmtree size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Leave Days
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-950">
                {monthSummary.leaveCount}
              </span>
              <span className="text-xs font-semibold text-rose-600">
                days marked
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
            <CalendarIcon size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Working Days
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-950">
                {monthSummary.workingDaysCount}
              </span>
              <span className="text-xs font-semibold text-emerald-600">
                available
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Calendar Grid + Selected Day Schedule Card ─────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ── Left Column: Month Calendar View (7 cols) ──────────────── */}
        <div className="lg:col-span-7 flex flex-col rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xl shadow-slate-100">
          {/* Header & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                <h2 className="text-xl font-black tracking-tight text-slate-950">
                  {formatMonthTitle}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any day to view or edit schedule
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToday}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all"
              >
                Today
              </button>

              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5">
                <button
                  onClick={handlePrevMonth}
                  className="rounded-lg p-1.5 text-slate-600 hover:bg-white hover:shadow-xs transition-all"
                  title="Previous month"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="rounded-lg p-1.5 text-slate-600 hover:bg-white hover:shadow-xs transition-all"
                  title="Next month"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Legend Bar */}
          <div className="flex flex-wrap items-center gap-4 mb-4 text-[11px] font-semibold text-slate-600 bg-slate-50/80 px-3.5 py-2 rounded-xl border border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" /> Works Scheduled
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> On Leave
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Working Day
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> Day Off
            </span>
          </div>

          {/* Weekday Labels Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {DAY_NAMES.map((name, i) => (
              <div
                key={name}
                className={`py-1.5 text-xs font-bold ${
                  i === 0 || i === 6 ? "text-slate-400" : "text-slate-700"
                }`}
              >
                {name}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((day) => {
              const dayLeave = getLeaveForDate(day.dateString);
              const dayWorks = getWorksForDate(day.dateString);
              const isWorkingDay = isWorkingDayBySchedule(day.dayOfWeek);
              const isSelected = day.dateString === selectedDate;

              return (
                <button
                  key={day.dateString}
                  onClick={() => setSelectedDate(day.dateString)}
                  className={`group relative flex min-h-[72px] flex-col justify-between rounded-2xl p-2 text-left transition-all duration-200 ${
                    !day.isCurrentMonth
                      ? "bg-slate-50/40 opacity-40 text-slate-400 hover:opacity-80"
                      : isSelected
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-600 ring-offset-2"
                      : dayLeave
                      ? "bg-rose-50/70 border border-rose-200 text-rose-950 hover:bg-rose-100/80"
                      : dayWorks.length > 0
                      ? "bg-indigo-50/60 border border-indigo-200/80 text-indigo-950 hover:bg-indigo-100/80"
                      : isWorkingDay
                      ? "bg-white border border-slate-200/70 hover:border-indigo-300 hover:bg-slate-50/80"
                      : "bg-slate-100/50 border border-slate-100 text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  {/* Top Day Header: Number + Today indicator */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-extrabold ${
                        isSelected
                          ? "text-white"
                          : day.isToday
                          ? "flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs"
                          : !day.isCurrentMonth
                          ? "text-slate-400"
                          : "text-slate-800"
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {/* Today Badge if selected or small dot */}
                    {day.isToday && !isSelected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-ping" />
                    )}
                  </div>

                  {/* Day Content Badges */}
                  <div className="mt-1 flex flex-col gap-1 w-full">
                    {/* Leave Badge */}
                    {dayLeave && (
                      <div
                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        <Palmtree size={10} />
                        <span className="truncate">Leave</span>
                      </div>
                    )}

                    {/* Works Count Badge */}
                    {dayWorks.length > 0 && !dayLeave && (
                      <div
                        className={`inline-flex items-center justify-between rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          isSelected
                            ? "bg-white/25 text-white"
                            : "bg-indigo-600 text-white shadow-xs"
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Briefcase size={10} />
                          {dayWorks.length} {dayWorks.length === 1 ? "Job" : "Jobs"}
                        </span>
                      </div>
                    )}

                    {/* Regular Working Day Dot (if no leave/works) */}
                    {!dayLeave && dayWorks.length === 0 && isWorkingDay && (
                      <div className="flex items-center gap-1 mt-auto">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isSelected ? "bg-emerald-300" : "bg-emerald-500"
                          }`}
                        />
                        <span
                          className={`text-[9px] font-medium ${
                            isSelected ? "text-white/80" : "text-slate-400"
                          }`}
                        >
                          Workday
                        </span>
                      </div>
                    )}

                    {/* Non-working day off indicator */}
                    {!dayLeave && dayWorks.length === 0 && !isWorkingDay && (
                      <span
                        className={`text-[9px] font-semibold italic mt-auto ${
                          isSelected ? "text-white/60" : "text-slate-400"
                        }`}
                      >
                        Off
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right Column: Today's / Selected Day Schedule Card (5 cols) ───── */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="flex flex-col rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xl shadow-slate-100">
            {/* Card Header: Selected Date & Quick Leave Controls */}
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarIcon size={16} className="text-indigo-600" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">
                    Day Schedule
                  </span>
                </div>
                <h3 className="mt-1 text-lg font-black text-slate-950 tracking-tight">
                  {formatSelectedDateFull}
                </h3>
              </div>

              {/* Day Status Pill */}
              <div>
                {selectedDayLeave ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200">
                    <Palmtree size={12} /> On Leave
                  </span>
                ) : selectedDayWorks.length > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200">
                    <Briefcase size={12} /> {selectedDayWorks.length} Jobs
                  </span>
                ) : isSelectedDayWorking ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={12} /> Available
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200">
                    Weekly Off
                  </span>
                )}
              </div>
            </div>

            {/* Shift & Working Hours Info Box */}
            <div className="mt-4 rounded-2xl bg-slate-50/80 border border-slate-100 p-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-indigo-600" />
                  Working Shift ({FULL_DAY_NAMES[selectedDayOfWeek]})
                </span>
                {isSelectedDayWorking && (
                  <span className="text-emerald-600 font-extrabold">Active</span>
                )}
              </div>

              {selectedDaySchedule?.isWorkingDay ? (
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-slate-900 shadow-2xs">
                    <span>{selectedDaySchedule.startTime}</span>
                    <span className="text-slate-400">–</span>
                    <span>{selectedDaySchedule.endTime}</span>
                  </div>

                  {selectedDaySchedule.breakStart && selectedDaySchedule.breakEnd && (
                    <div className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200/70 font-semibold">
                      <Coffee size={12} />
                      <span>
                        Break: {selectedDaySchedule.breakStart} - {selectedDaySchedule.breakEnd}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-medium italic">
                  No working hours configured for {FULL_DAY_NAMES[selectedDayOfWeek]}s.
                </p>
              )}
            </div>

            {/* Leave Quick Action Button / Form */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              {selectedDayLeave ? (
                <div className="flex items-center justify-between rounded-xl bg-rose-50/60 p-3 border border-rose-100">
                  <div className="text-xs">
                    <p className="font-bold text-rose-900">Marked as Leave</p>
                    {selectedDayLeave.reason && (
                      <p className="text-rose-700 text-[11px] mt-0.5">
                        &quot;{selectedDayLeave.reason}&quot;
                      </p>
                    )}
                  </div>
                  {onCancelLeave && (
                    <button
                      onClick={handleQuickCancelLeave}
                      disabled={isSubmittingLeave}
                      className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 shadow-2xs transition-all border border-rose-200 flex items-center gap-1"
                    >
                      <X size={12} />
                      Remove Leave
                    </button>
                  )}
                </div>
              ) : showLeaveForm ? (
                <div className="space-y-3 rounded-2xl bg-rose-50/50 p-4 border border-rose-100">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                    <span>Mark {selectedDate} as Leave</span>
                    <button
                      onClick={() => setShowLeaveForm(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Reason for leave (optional)..."
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setShowLeaveForm(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleQuickAddLeave}
                      disabled={isSubmittingLeave}
                      className="btn bg-rose-600 text-white hover:bg-rose-700 px-3.5 py-1.5 text-xs font-bold rounded-lg shadow-xs"
                    >
                      {isSubmittingLeave ? "Saving..." : "Confirm Leave"}
                    </button>
                  </div>
                </div>
              ) : (
                onAddLeave && (
                  <button
                    onClick={() => setShowLeaveForm(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-2.5 text-xs font-bold text-slate-700 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 transition-all"
                  >
                    <Palmtree size={14} />
                    Mark {selectedDate} as Leave Day
                  </button>
                )
              )}
            </div>

            {/* Scheduled Works Timeline Section */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-black text-slate-950 flex items-center gap-2">
                  <Briefcase size={15} className="text-indigo-600" />
                  Scheduled Works & Appointments
                </h4>
                <span className="text-xs font-bold text-slate-500">
                  {selectedDayWorks.length} Total
                </span>
              </div>

              {selectedDayWorks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 mb-3">
                    <Briefcase size={22} />
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    No Scheduled Works
                  </p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                    {selectedDayLeave
                      ? "You are on leave on this date. No new requests will be assigned."
                      : "You have no bookings assigned for this date yet. Open slots are available."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {selectedDayWorks.map((work) => {
                    const statusBadge = getOrderStatusBadge(work.status);
                    const customerName =
                      typeof work.customerId === "object"
                        ? work.customerId.name
                        : "Customer";
                    const customerPhone =
                      typeof work.customerId === "object"
                        ? work.customerId.phone
                        : work.contactPhone;

                    return (
                      <div
                        key={work._id}
                        className="group relative rounded-2xl border border-slate-200/90 bg-white p-4 transition-all duration-200 hover:border-indigo-300 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-black text-xs">
                              <Clock size={14} />
                            </span>
                            <div>
                              <p className="text-xs font-black text-slate-900">
                                {work.preferredTime || "Flexible Time"}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                #{work.orderId || work._id.slice(-6)}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${statusBadge.bg}`}
                          >
                            {statusBadge.label}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <h5 className="text-xs font-bold text-slate-950 truncate">
                          {work.title || work.description || "Service Work"}
                        </h5>

                        {/* Customer & Location info */}
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 grid gap-1.5 text-xs text-slate-600">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                              <User size={12} className="text-slate-400" />
                              {customerName}
                            </span>
                            {customerPhone && (
                              <a
                                href={`tel:${customerPhone}`}
                                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline"
                              >
                                <Phone size={10} /> {customerPhone}
                              </a>
                            )}
                          </div>

                          {work.address && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                              <MapPin size={12} className="shrink-0 text-slate-400" />
                              <span className="truncate">
                                {work.address.street
                                  ? `${work.address.street}, `
                                  : ""}
                                {work.address.city}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Order Link Action */}
                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className="text-xs font-extrabold text-slate-900">
                            {work.budget
                              ? `₹${work.budget}`
                              : work.platformFee
                              ? `₹${work.platformFee}`
                              : "Standard Fare"}
                          </span>
                          <Link
                            href={`/provider-portal/orders`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            View Order <ExternalLink size={12} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
