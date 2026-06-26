"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Wifi, WifiOff, Calendar, Clock, Coffee, Plus, X, Loader2,
  CheckCircle2, AlertCircle, Moon, Sun, ChevronLeft, ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { ProviderPortalShell } from "@/components/provider/ProviderPortalShell";
import { providerScheduleService } from "@/services/providerSchedule";
import {
  ProviderStatus,
  ProviderSchedule,
  DaySchedule,
  ProviderLeave,
  OnlineStatus,
} from "@/types/providerSchedule.types";
import { getErrorMessage } from "@/utils/errorHandler";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DEFAULT_SCHEDULE: DaySchedule[] = Array.from({ length: 7 }, (_, i) => ({
  day: i as 0 | 1 | 2 | 3 | 4 | 5 | 6,
  isWorkingDay: i >= 1 && i <= 5,
  startTime: "09:00",
  endTime: "18:00",
  breakStart: "13:00",
  breakEnd: "14:00",
}));

export default function ProviderAvailabilityPage() {
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [schedule, setSchedule] = useState<ProviderSchedule | null>(null);
  const [weeklyHours, setWeeklyHours] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [bufferMinutes, setBufferMinutes] = useState(15);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(30);
  const [leaves, setLeaves] = useState<ProviderLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [addingLeave, setAddingLeave] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statusRes, scheduleRes, leavesRes] = await Promise.all([
        providerScheduleService.getStatus(),
        providerScheduleService.getSchedule(),
        providerScheduleService.getLeaves({ month: currentMonth }),
      ]);
      setStatus(statusRes.data.data);
      const sch = scheduleRes.data.data;
      setSchedule(sch);
      if (sch) {
        setWeeklyHours(sch.weeklyHours);
        setBufferMinutes(sch.bufferMinutes);
        setAdvanceBookingDays(sch.advanceBookingDays);
      }
      setLeaves(leavesRes.data.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to load availability data");
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggleOnline = async () => {
    if (!status) return;
    const next: OnlineStatus = status.onlineStatus === "online" ? "offline" : "online";
    setToggling(true);
    try {
      const res = await providerScheduleService.toggleOnline(next);
      setStatus(res.data.data);
      toast.success(`You're now ${next}`);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to toggle status");
    } finally {
      setToggling(false);
    }
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      const res = await providerScheduleService.upsertSchedule({
        weeklyHours,
        bufferMinutes,
        advanceBookingDays,
      });
      setSchedule(res.data.data);
      toast.success("Schedule saved");
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  };

  const handleAddLeave = async () => {
    if (!leaveDate) { toast.error("Select a date"); return; }
    setAddingLeave(true);
    try {
      await providerScheduleService.addLeave({ date: leaveDate, reason: leaveReason || undefined, isFullDay: true });
      toast.success("Leave added");
      setLeaveDate("");
      setLeaveReason("");
      const res = await providerScheduleService.getLeaves({ month: currentMonth });
      setLeaves(res.data.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to add leave");
    } finally {
      setAddingLeave(false);
    }
  };

  const handleCancelLeave = async (date: string) => {
    try {
      await providerScheduleService.cancelLeave(date);
      toast.success("Leave cancelled");
      setLeaves((prev) => prev.filter((l) => l.date !== date));
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to cancel leave");
    }
  };

  const updateDay = (dayIndex: number, field: keyof DaySchedule, value: unknown) => {
    setWeeklyHours((prev) =>
      prev.map((d) => (d.day === dayIndex ? { ...d, [field]: value } : d))
    );
  };

  const navigateMonth = (dir: 1 | -1) => {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setCurrentMonth(d.toISOString().slice(0, 7));
  };

  if (loading) {
    return (
      <ProviderPortalShell>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-indigo-500" size={28} />
        </div>
      </ProviderPortalShell>
    );
  }

  const isOnline = status?.onlineStatus === "online";
  const isBusy = status?.engagementStatus === "busy";

  return (
    <ProviderPortalShell>
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-bold text-indigo-600">Availability</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          Manage your availability
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Control when you&apos;re visible to customers and set your working schedule.
        </p>
      </div>

      {/* ── Online/Offline Toggle Card ──────────────────────────────────── */}
      <section className="premium-card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
              isOnline
                ? "bg-emerald-100 text-emerald-600"
                : "bg-slate-100 text-slate-400"
            }`}>
              {isOnline ? <Wifi size={24} /> : <WifiOff size={24} />}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">
                {isOnline ? "You're Online" : "You're Offline"}
              </h2>
              <p className="text-sm text-slate-500">
                {isOnline
                  ? "Customers can see you and send instant requests"
                  : "You won't receive new instant requests"}
              </p>
              {isBusy && (
                <p className="mt-1 flex items-center gap-1 text-xs font-bold text-amber-600">
                  <AlertCircle size={12} /> Currently busy with an active job
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleToggleOnline}
            disabled={toggling}
            className={`relative h-12 w-24 rounded-full transition-all duration-300 ${
              isOnline
                ? "bg-emerald-500 shadow-lg shadow-emerald-500/30"
                : "bg-slate-300"
            }`}
          >
            <div className={`absolute top-1.5 h-9 w-9 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${
              isOnline ? "left-[52px]" : "left-1.5"
            }`}>
              {toggling ? (
                <Loader2 size={14} className="animate-spin text-slate-400" />
              ) : isOnline ? (
                <Sun size={14} className="text-emerald-600" />
              ) : (
                <Moon size={14} className="text-slate-400" />
              )}
            </div>
          </button>
        </div>

        {/* Status badges */}
        <div className="mt-4 flex gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
            isOnline ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
          }`}>
            <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
            {isOnline ? "Online" : "Offline"}
          </span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
            isBusy ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
          }`}>
            <span className={`h-2 w-2 rounded-full ${isBusy ? "bg-amber-500" : "bg-blue-500"}`} />
            {isBusy ? "Busy" : "Available"}
          </span>
        </div>
      </section>

      {/* ── Weekly Schedule ─────────────────────────────────────────────── */}
      <section className="premium-card p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">Weekly Schedule</h2>
              <p className="text-xs text-slate-500">Set your working hours for each day</p>
            </div>
          </div>
          <button
            onClick={handleSaveSchedule}
            disabled={saving}
            className="btn btn-primary px-5 py-2.5 text-sm"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Save Schedule
          </button>
        </div>

        {/* Buffer & advance days */}
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">
              <Coffee size={12} className="inline mr-1" />
              Buffer between appointments
            </label>
            <select
              value={bufferMinutes}
              onChange={(e) => setBufferMinutes(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            >
              {[0, 5, 10, 15, 20, 30, 45, 60].map((m) => (
                <option key={m} value={m}>{m === 0 ? "No buffer" : `${m} minutes`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">
              <Clock size={12} className="inline mr-1" />
              Advance booking window
            </label>
            <select
              value={advanceBookingDays}
              onChange={(e) => setAdvanceBookingDays(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            >
              {[7, 14, 21, 30, 45, 60, 90].map((d) => (
                <option key={d} value={d}>{d} days ahead</option>
              ))}
            </select>
          </div>
        </div>

        {/* Day rows */}
        <div className="space-y-3">
          {weeklyHours.map((day) => (
            <div
              key={day.day}
              className={`rounded-xl border p-4 transition-all ${
                day.isWorkingDay
                  ? "border-slate-200 bg-white"
                  : "border-slate-100 bg-slate-50/50"
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Day toggle */}
                <label className="flex items-center gap-3 cursor-pointer min-w-[140px]">
                  <input
                    type="checkbox"
                    checked={day.isWorkingDay}
                    onChange={(e) => updateDay(day.day, "isWorkingDay", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                  />
                  <span className={`text-sm font-bold ${day.isWorkingDay ? "text-slate-900" : "text-slate-400"}`}>
                    {DAY_NAMES[day.day]}
                  </span>
                </label>

                {day.isWorkingDay && (
                  <div className="flex flex-1 flex-wrap items-center gap-3">
                    {/* Working hours */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="time"
                        value={day.startTime}
                        onChange={(e) => updateDay(day.day, "startTime", e.target.value)}
                        className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold outline-none focus:border-indigo-400"
                      />
                      <span className="text-xs text-slate-400">to</span>
                      <input
                        type="time"
                        value={day.endTime}
                        onChange={(e) => updateDay(day.day, "endTime", e.target.value)}
                        className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold outline-none focus:border-indigo-400"
                      />
                    </div>

                    {/* Break */}
                    <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1">
                      <Coffee size={11} className="text-amber-600" />
                      <input
                        type="time"
                        value={day.breakStart || ""}
                        onChange={(e) => updateDay(day.day, "breakStart", e.target.value || undefined)}
                        className="w-20 bg-transparent text-xs font-semibold outline-none"
                        placeholder="Start"
                      />
                      <span className="text-xs text-amber-600">–</span>
                      <input
                        type="time"
                        value={day.breakEnd || ""}
                        onChange={(e) => updateDay(day.day, "breakEnd", e.target.value || undefined)}
                        className="w-20 bg-transparent text-xs font-semibold outline-none"
                        placeholder="End"
                      />
                    </div>
                  </div>
                )}

                {!day.isWorkingDay && (
                  <span className="text-xs font-semibold text-slate-400 italic">Day off</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Leave Management ────────────────────────────────────────────── */}
      <section className="premium-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">Leave Days</h2>
              <p className="text-xs text-slate-500">Mark days you won&apos;t be available</p>
            </div>
          </div>

          {/* Month navigation */}
          <div className="flex items-center gap-2">
            <button onClick={() => navigateMonth(-1)} className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50">
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm font-bold text-slate-700 min-w-[100px] text-center">
              {new Date(currentMonth + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </span>
            <button onClick={() => navigateMonth(1)} className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Add leave form */}
        <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1 block text-xs font-bold text-slate-600">Date</label>
            <input
              type="date"
              value={leaveDate}
              onChange={(e) => setLeaveDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1 block text-xs font-bold text-slate-600">Reason (optional)</label>
            <input
              type="text"
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="e.g. Personal, Festival"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
          </div>
          <button
            onClick={handleAddLeave}
            disabled={addingLeave || !leaveDate}
            className="btn btn-primary px-4 py-2 text-sm"
          >
            {addingLeave ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add Leave
          </button>
        </div>

        {/* Leave list */}
        {leaves.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
            <Calendar size={28} className="mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-500 text-sm">No leave days this month</p>
            <p className="text-xs text-slate-400 mt-1">Your full schedule is available for bookings</p>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {leaves.map((leave) => (
              <div
                key={leave._id}
                className={`flex items-center justify-between rounded-xl border p-3 ${
                  leave.status === "active"
                    ? "border-red-100 bg-red-50/50"
                    : "border-slate-100 bg-slate-50 opacity-60"
                }`}
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {new Date(leave.date + "T00:00:00").toLocaleDateString("en-IN", {
                      weekday: "short", day: "numeric", month: "short",
                    })}
                  </p>
                  {leave.reason && (
                    <p className="text-xs text-slate-500 mt-0.5">{leave.reason}</p>
                  )}
                  <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    leave.status === "active" ? "bg-red-100 text-red-700" : "bg-slate-200 text-slate-500"
                  }`}>
                    {leave.status === "active" ? "On Leave" : "Cancelled"}
                  </span>
                </div>
                {leave.status === "active" && (
                  <button
                    onClick={() => handleCancelLeave(leave.date)}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-white hover:text-red-600 transition-colors"
                    title="Cancel leave"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </ProviderPortalShell>
  );
}
