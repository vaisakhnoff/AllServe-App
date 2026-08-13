"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Wifi, WifiOff, Calendar, Clock, Coffee, Plus, X, Loader2,
  CheckCircle2, AlertCircle, Moon, Sun, ChevronLeft, ChevronRight, Sparkles,
  Copy, Layers, RotateCcw, Zap, Sliders, Info, ShieldAlert, Check, Save
} from "lucide-react";
import toast from "react-hot-toast";
import { ProviderPortalShell } from "@/components/provider/ProviderPortalShell";
import { ProviderAvailabilityCalendar } from "@/components/provider/ProviderAvailabilityCalendar";
import { providerScheduleService } from "@/services/providerSchedule";
import { orderService } from "@/services/order";
import {
  ProviderStatus,
  ProviderSchedule,
  DaySchedule,
  ProviderLeave,
  OnlineStatus,
  TimeWindow,
} from "@/types/providerSchedule.types";
import { ServiceOrder } from "@/types/order.types";
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

// Quick Presets Templates
const PRESETS = [
  {
    id: "standard",
    name: "Standard Business",
    desc: "Mon - Fri: 9:00 AM - 6:00 PM (1 hr break)",
    icon: Calendar,
    apply: (): DaySchedule[] =>
      Array.from({ length: 7 }, (_, i) => ({
        day: i as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        isWorkingDay: i >= 1 && i <= 5,
        startTime: "09:00",
        endTime: "18:00",
        breakStart: "13:00",
        breakEnd: "14:00",
      })),
  },
  {
    id: "extended",
    name: "Full Time (6 Days)",
    desc: "Mon - Sat: 8:00 AM - 8:00 PM (1 hr break)",
    icon: Zap,
    apply: (): DaySchedule[] =>
      Array.from({ length: 7 }, (_, i) => ({
        day: i as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        isWorkingDay: i >= 1 && i <= 6,
        startTime: "08:00",
        endTime: "20:00",
        breakStart: "13:00",
        breakEnd: "14:00",
      })),
  },
  {
    id: "morning",
    name: "Morning Shift",
    desc: "Mon - Sat: 7:00 AM - 3:00 PM (30 min break)",
    icon: Sun,
    apply: (): DaySchedule[] =>
      Array.from({ length: 7 }, (_, i) => ({
        day: i as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        isWorkingDay: i >= 1 && i <= 6,
        startTime: "07:00",
        endTime: "15:00",
        breakStart: "11:30",
        breakEnd: "12:00",
      })),
  },
  {
    id: "evening",
    name: "Evening Shift",
    desc: "Mon - Fri: 2:00 PM - 10:00 PM (1 hr break)",
    icon: Moon,
    apply: (): DaySchedule[] =>
      Array.from({ length: 7 }, (_, i) => ({
        day: i as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        isWorkingDay: i >= 1 && i <= 5,
        startTime: "14:00",
        endTime: "22:00",
        breakStart: "18:00",
        breakEnd: "19:00",
      })),
  },
  {
    id: "weekend",
    name: "Weekend Special",
    desc: "Sat - Sun Only: 9:00 AM - 6:00 PM",
    icon: Coffee,
    apply: (): DaySchedule[] =>
      Array.from({ length: 7 }, (_, i) => ({
        day: i as 0 | 1 | 2 | 3 | 4 | 5 | 6,
        isWorkingDay: i === 0 || i === 6,
        startTime: "09:00",
        endTime: "18:00",
        breakStart: "13:00",
        breakEnd: "14:00",
      })),
  },
];

function timeToMinutes(timeStr?: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function calculateNetWorkingHours(day: DaySchedule): number {
  if (!day.isWorkingDay || !day.startTime || !day.endTime) return 0;
  let totalMin = timeToMinutes(day.endTime) - timeToMinutes(day.startTime);
  if (totalMin <= 0) return 0;

  if (day.breakStart && day.breakEnd) {
    const breakMin = timeToMinutes(day.breakEnd) - timeToMinutes(day.breakStart);
    if (breakMin > 0 && breakMin < totalMin) {
      totalMin -= breakMin;
    }
  }
  return Math.max(0, totalMin / 60);
}

export default function ProviderAvailabilityPage() {
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [schedule, setSchedule] = useState<ProviderSchedule | null>(null);
  const [weeklyHours, setWeeklyHours] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [bufferMinutes, setBufferMinutes] = useState(15);
  const [defaultServiceDuration, setDefaultServiceDuration] = useState(60);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(30);
  const [leaves, setLeaves] = useState<ProviderLeave[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [addingLeave, setAddingLeave] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [windows, setWindows] = useState<TimeWindow[]>([]);
  const [windowsLoading, setWindowsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"calendar" | "weekly">("calendar");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statusRes, scheduleRes, leavesRes, ordersRes] = await Promise.allSettled([
        providerScheduleService.getStatus(),
        providerScheduleService.getSchedule(),
        providerScheduleService.getLeaves({ month: currentMonth }),
        orderService.getProviderOrders(),
      ]);

      if (statusRes.status === "fulfilled") setStatus(statusRes.value.data.data);
      if (scheduleRes.status === "fulfilled") {
        const sch = scheduleRes.value.data.data;
        setSchedule(sch);
        if (sch) {
          setWeeklyHours(sch.weeklyHours);
          setBufferMinutes(sch.bufferMinutes);
          setDefaultServiceDuration(sch.defaultServiceDuration || 60);
          setAdvanceBookingDays(sch.advanceBookingDays);
        }
      }
      if (leavesRes.status === "fulfilled") {
        setLeaves(leavesRes.value.data.data || []);
      }
      if (ordersRes.status === "fulfilled") {
        setOrders(ordersRes.value.data.data?.items || []);
      }
      setHasUnsavedChanges(false);
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

  const fetchAvailableWindows = useCallback((dateStr: string) => {
    if (!dateStr) return;
    setWindowsLoading(true);
    setSelectedTime("");
    providerScheduleService.getAvailableWindows("", dateStr)
      .then((r) => setWindows(r.data.data?.windows || []))
      .catch(() => setWindows([]))
      .finally(() => setWindowsLoading(false));
  }, []);

  useEffect(() => {
    if (selectedDate) fetchAvailableWindows(selectedDate);
  }, [selectedDate, fetchAvailableWindows]);

  // Core save handler that persists schedule to backend immediately
  const saveScheduleToBackend = async (
    hoursToSave: DaySchedule[] = weeklyHours,
    buf = bufferMinutes,
    duration = defaultServiceDuration,
    advanceDays = advanceBookingDays
  ) => {
    setSaving(true);
    try {
      const res = await providerScheduleService.upsertSchedule({
        weeklyHours: hoursToSave,
        bufferMinutes: buf,
        defaultServiceDuration: duration,
        advanceBookingDays: advanceDays,
      });

      const updated = res.data.data;
      setSchedule(updated);
      setWeeklyHours(updated.weeklyHours);
      setHasUnsavedChanges(false);

      // Refresh windows if date is selected
      if (selectedDate) {
        fetchAvailableWindows(selectedDate);
      }

      toast.success("Weekly schedule updated & live on user pages!");
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to save schedule");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSchedule = () => saveScheduleToBackend();

  const handleAddLeave = async (dateStr?: string, reasonStr?: string) => {
    const date = dateStr || leaveDate;
    const reason = reasonStr !== undefined ? reasonStr : leaveReason;
    if (!date) { toast.error("Select a date"); return; }
    setAddingLeave(true);
    try {
      await providerScheduleService.addLeave({ date, reason: reason || undefined, isFullDay: true });
      toast.success("Leave added");
      setLeaveDate("");
      setLeaveReason("");
      const res = await providerScheduleService.getLeaves({ month: currentMonth });
      setLeaves(res.data.data || []);
      if (selectedDate === date) fetchAvailableWindows(date);
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
      if (selectedDate === date) fetchAvailableWindows(date);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to cancel leave");
    }
  };

  const updateDay = (dayIndex: number, field: keyof DaySchedule, value: unknown) => {
    setWeeklyHours((prev) =>
      prev.map((d) => (d.day === dayIndex ? { ...d, [field]: value } : d))
    );
    setHasUnsavedChanges(true);
  };

  // Copy one day's schedule to all working days and auto-save to DB
  const copyDayToAll = async (sourceDayIndex: number) => {
    const source = weeklyHours.find((d) => d.day === sourceDayIndex);
    if (!source) return;
    const newHours = weeklyHours.map((d) =>
      d.day === sourceDayIndex
        ? d
        : {
            ...d,
            startTime: source.startTime,
            endTime: source.endTime,
            breakStart: source.breakStart,
            breakEnd: source.breakEnd,
          }
    );
    setWeeklyHours(newHours);
    await saveScheduleToBackend(newHours);
  };

  // Toggle all days on or off and auto-save
  const toggleAllDays = async (enable: boolean) => {
    const newHours = weeklyHours.map((d) => ({ ...d, isWorkingDay: enable }));
    setWeeklyHours(newHours);
    await saveScheduleToBackend(newHours);
  };

  // Apply quick schedule preset AND auto-save to backend immediately
  const handleApplyPreset = async (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const newHours = preset.apply();
    setWeeklyHours(newHours);
    await saveScheduleToBackend(newHours);
  };

  // Calculate net weekly working hours total
  const totalWeeklyHours = useMemo(() => {
    return weeklyHours.reduce((acc, day) => acc + calculateNetWorkingHours(day), 0);
  }, [weeklyHours]);

  const activeWorkingDaysCount = useMemo(() => {
    return weeklyHours.filter((d) => d.isWorkingDay).length;
  }, [weeklyHours]);

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
      {/* Unsaved Changes Banner alert if edited manually */}
      {hasUnsavedChanges && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-md">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <span>You have unsaved working hour changes. Save now to update user booking pages instantly.</span>
          </div>
          <button
            onClick={handleSaveSchedule}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-amber-700 transition-all"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save & Publish Changes
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Provider Dashboard
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            Availability & Schedule
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track monthly works, manage leave days, and customize weekly working hours.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1 border border-slate-200 shadow-2xs">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`rounded-xl px-4 py-2 text-xs font-extrabold transition-all ${
              activeTab === "calendar"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calendar size={14} className="inline mr-1.5" />
            Monthly Calendar & Work
          </button>
          <button
            onClick={() => setActiveTab("weekly")}
            className={`rounded-xl px-4 py-2 text-xs font-extrabold transition-all ${
              activeTab === "weekly"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock size={14} className="inline mr-1.5" />
            Weekly Hours & Settings
          </button>
        </div>
      </div>

      {/* ── Online/Offline Toggle Banner Card ─────────────────────────────── */}
      <section className="premium-card p-6 mb-8">
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
      </section>

      {/* ── Main Tab 1: Monthly Interactive Work & Leave Calendar (Always kept mounted in DOM so state stays live) ── */}
      <div className={activeTab === "calendar" ? "block mb-8" : "hidden"}>
        <ProviderAvailabilityCalendar
          weeklyHours={weeklyHours}
          leaves={leaves}
          orders={orders}
          onAddLeave={handleAddLeave}
          onCancelLeave={handleCancelLeave}
          isLoading={loading}
        />
      </div>

      {/* ── Main Tab 2: Enhanced Weekly Schedule Options & Settings ─────── */}
      <div className={activeTab === "weekly" ? "block space-y-8" : "hidden"}>
        {/* Header Summary & Save Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-100">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 font-black text-xl">
              <Clock size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-950 tracking-tight">
                  Weekly Working Hours & Rules
                </h2>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200">
                  {totalWeeklyHours.toFixed(1)} hrs/week
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure your availability windows for automated customer booking slots.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveSchedule}
              disabled={saving}
              className="btn btn-primary px-6 py-2.5 text-sm font-extrabold shadow-lg shadow-indigo-600/20 flex items-center gap-2"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Save & Publish Schedule
            </button>
          </div>
        </div>

        {/* Presets & Template Selector */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600" />
                Quick Schedule Templates (Auto-Saves Instantly)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Apply a standard pre-configured schedule with one click
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleAllDays(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 transition-all"
              >
                Enable All Days
              </button>
              <button
                onClick={() => toggleAllDays(false)}
                className="text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-all"
              >
                Disable All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {PRESETS.map((p) => {
              const IconComponent = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => handleApplyPreset(p.id)}
                  disabled={saving}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 text-left transition-all hover:bg-white hover:border-indigo-300 hover:shadow-md group"
                >
                  <div>
                    <div className="flex items-center gap-2 text-indigo-600 mb-1.5">
                      <IconComponent size={16} />
                      <span className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {p.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {p.desc}
                    </p>
                  </div>
                  <span className="mt-3 text-[10px] font-extrabold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Apply & Save &rarr;
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Appointment Settings & Buffer Rules */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-100">
          <h3 className="text-sm font-black text-slate-950 flex items-center gap-2 mb-4">
            <Sliders size={16} className="text-indigo-600" />
            Booking Rules & Slot Buffer Settings
          </h3>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
              <label className="mb-1 block text-xs font-bold text-slate-700">
                <Coffee size={13} className="inline mr-1.5 text-amber-600" />
                Buffer Between Appointments
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Rest/travel time automatically added between bookings.
              </p>
              <select
                value={bufferMinutes}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBufferMinutes(val);
                  saveScheduleToBackend(weeklyHours, val, defaultServiceDuration, advanceBookingDays);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
              >
                {[0, 5, 10, 15, 20, 30, 45, 60].map((m) => (
                  <option key={m} value={m}>
                    {m === 0 ? "No Buffer Time" : `${m} minutes buffer`}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
              <label className="mb-1 block text-xs font-bold text-slate-700">
                <Clock size={13} className="inline mr-1.5 text-indigo-600" />
                Default Slot Duration
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Estimated base duration for booking windows.
              </p>
              <select
                value={defaultServiceDuration}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setDefaultServiceDuration(val);
                  saveScheduleToBackend(weeklyHours, bufferMinutes, val, advanceBookingDays);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
              >
                {[15, 30, 45, 60, 90, 120, 180].map((m) => (
                  <option key={m} value={m}>
                    {m < 60 ? `${m} minutes` : `${m / 60} ${m === 60 ? "hour" : "hours"}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
              <label className="mb-1 block text-xs font-bold text-slate-700">
                <Calendar size={13} className="inline mr-1.5 text-emerald-600" />
                Advance Booking Window
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                How far in advance clients can schedule work.
              </p>
              <select
                value={advanceBookingDays}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setAdvanceBookingDays(val);
                  saveScheduleToBackend(weeklyHours, bufferMinutes, defaultServiceDuration, val);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
              >
                {[7, 14, 21, 30, 45, 60, 90].map((d) => (
                  <option key={d} value={d}>
                    {d} days ahead ({Math.round(d / 7)} weeks)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Detailed Day-by-Day Editor */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-950">
                Daily Working Hours Configurator
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Set exact start time, end time, and break times for each day of the week.
              </p>
            </div>

            <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
              Active: {activeWorkingDaysCount} of 7 Days
            </div>
          </div>

          {/* Day rows list */}
          <div className="space-y-3">
            {weeklyHours.map((day) => {
              const netHours = calculateNetWorkingHours(day);

              return (
                <div
                  key={day.day}
                  className={`rounded-2xl border p-4 transition-all ${
                    day.isWorkingDay
                      ? "border-slate-200 bg-white shadow-2xs"
                      : "border-slate-100 bg-slate-50/50 opacity-70"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Left: Day Checkbox & Name */}
                    <div className="flex items-center gap-3 min-w-[170px]">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={day.isWorkingDay}
                          onChange={(e) => updateDay(day.day, "isWorkingDay", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>

                      <div>
                        <span
                          className={`text-sm font-extrabold ${
                            day.isWorkingDay ? "text-slate-950" : "text-slate-400"
                          }`}
                        >
                          {DAY_NAMES[day.day]}
                        </span>
                        {day.isWorkingDay ? (
                          <p className="text-[10px] font-bold text-emerald-600">
                            {netHours.toFixed(1)} hrs net work
                          </p>
                        ) : (
                          <p className="text-[10px] font-semibold text-slate-400 italic">
                            Weekly Off
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Middle: Working Hours & Break Editor */}
                    {day.isWorkingDay ? (
                      <div className="flex flex-1 flex-wrap items-center gap-4">
                        {/* Work Shift */}
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Shift:
                          </span>
                          <input
                            type="time"
                            value={day.startTime}
                            onChange={(e) => updateDay(day.day, "startTime", e.target.value)}
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500"
                          />
                          <span className="text-xs text-slate-400 font-bold">to</span>
                          <input
                            type="time"
                            value={day.endTime}
                            onChange={(e) => updateDay(day.day, "endTime", e.target.value)}
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500"
                          />
                        </div>

                        {/* Break Time */}
                        <div className="flex items-center gap-2 bg-amber-50/80 px-3 py-2 rounded-xl border border-amber-200/80">
                          <Coffee size={13} className="text-amber-600" />
                          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                            Break:
                          </span>
                          <input
                            type="time"
                            value={day.breakStart || ""}
                            onChange={(e) =>
                              updateDay(day.day, "breakStart", e.target.value || undefined)
                            }
                            className="w-20 rounded-lg border border-amber-300 bg-white px-2 py-1 text-xs font-bold text-amber-900 outline-none focus:border-amber-500"
                            placeholder="Start"
                          />
                          <span className="text-xs text-amber-600 font-bold">–</span>
                          <input
                            type="time"
                            value={day.breakEnd || ""}
                            onChange={(e) =>
                              updateDay(day.day, "breakEnd", e.target.value || undefined)
                            }
                            className="w-20 rounded-lg border border-amber-300 bg-white px-2 py-1 text-xs font-bold text-amber-900 outline-none focus:border-amber-500"
                            placeholder="End"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 text-xs font-medium text-slate-400 italic">
                        No working hours scheduled for {DAY_NAMES[day.day]}
                      </div>
                    )}

                    {/* Right: Copy to all button */}
                    {day.isWorkingDay && (
                      <button
                        onClick={() => copyDayToAll(day.day)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all"
                        title={`Copy ${DAY_NAMES[day.day]}'s shift times to all other days`}
                      >
                        <Copy size={12} />
                        Copy to all days
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ProviderPortalShell>
  );
}
