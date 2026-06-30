"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Plus, Trash2, Clock, CalendarDays, Loader2, Pencil, X,
  ChevronLeft, ChevronRight, Calendar, List, Ban, Repeat,
  Copy, Search,
} from "lucide-react";
import { ProviderPortalShell } from "@/components/provider/ProviderPortalShell";
import { slotService, Slot, CreateSlotDto, SlotStats, BulkCreateDto, RecurringSlotDto, BlockRangeDto } from "@/services/provider";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/utils/errorHandler";

const STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700 border-emerald-200",
  booked: "bg-blue-100 text-blue-700 border-blue-200",
  blocked: "bg-slate-100 text-slate-600 border-slate-200",
  cancelled: "bg-red-100 text-red-600 border-red-200",
};

const CAL_DOT: Record<string, string> = {
  available: "bg-emerald-500",
  booked: "bg-blue-500",
  blocked: "bg-slate-400",
  cancelled: "bg-red-400",
};

type ViewMode = "list" | "calendar";
type ModalType = "create" | "bulk" | "recurring" | "blockRange" | "edit" | null;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function ProviderSlotsPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [stats, setStats] = useState<SlotStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("calendar");
  const [modal, setModal] = useState<ModalType>(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Calendar state
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  // Create form
  const [form, setForm] = useState<CreateSlotDto>({ date: "", startTime: "", endTime: "", slotStatus: "available" });

  // Bulk form
  const [bulkForm, setBulkForm] = useState<BulkCreateDto>({ dates: [], startTime: "", endTime: "", slotStatus: "available" });
  const [bulkDateInput, setBulkDateInput] = useState("");

  // Recurring form
  const [recurForm, setRecurForm] = useState<RecurringSlotDto>({ startTime: "", endTime: "", pattern: "weekdays", startDate: "", occurrences: 14 });

  // Block range form
  const [blockForm, setBlockForm] = useState<BlockRangeDto>({ startDate: "", endDate: "" });

  // Edit state
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [editForm, setEditForm] = useState({ date: "", startTime: "", endTime: "", slotStatus: "available" as string });

  const fetchSlots = useCallback(async () => {
    try {
      const res = await slotService.getMySlots(dateFilter || undefined);
      setSlots(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to load slots");
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  const fetchStats = async () => {
    try {
      const res = await slotService.getStats();
      setStats(res.data.data);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchSlots(); }, [fetchSlots]);
  useEffect(() => { fetchStats(); }, []);

  // Filtered slots
  const filtered = useMemo(() => {
    return slots.filter((s) => {
      if (statusFilter && s.slotStatus !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return s.date.includes(q) || s.startTime.includes(q) || s.endTime.includes(q) || s.slotStatus.includes(q);
      }
      return true;
    });
  }, [slots, statusFilter, searchQuery]);

  // Calendar data
  const calendarSlots = useMemo(() => {
    const map: Record<string, Slot[]> = {};
    slots.forEach((s) => {
      const key = s.date;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [slots]);

  // Handlers
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.startTime || !form.endTime) return toast.error("Fill all fields");
    setSaving(true);
    try {
      await slotService.create(form);
      toast.success("Slot created");
      setForm({ date: "", startTime: "", endTime: "", slotStatus: "available" });
      setModal(null);
      await fetchSlots(); fetchStats();
    } catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setSaving(false); }
  };

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkForm.dates.length || !bulkForm.startTime || !bulkForm.endTime) return toast.error("Fill all fields");
    setSaving(true);
    try {
      const res = await slotService.bulkCreate(bulkForm);
      toast.success(`Created ${res.data.data.created} slots (${res.data.data.skipped} skipped)`);
      setBulkForm({ dates: [], startTime: "", endTime: "", slotStatus: "available" });
      setModal(null);
      await fetchSlots(); fetchStats();
    } catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setSaving(false); }
  };

  const handleRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recurForm.startDate || !recurForm.startTime || !recurForm.endTime) return toast.error("Fill all fields");
    setSaving(true);
    try {
      const res = await slotService.recurring(recurForm);
      toast.success(`Created ${res.data.data.created} recurring slots`);
      setModal(null);
      await fetchSlots(); fetchStats();
    } catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setSaving(false); }
  };

  const handleBlockRange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockForm.startDate || !blockForm.endDate) return toast.error("Fill dates");
    setSaving(true);
    try {
      const res = await slotService.blockRange(blockForm);
      toast.success(`Blocked ${res.data.data.blockedDates} days`);
      setBlockForm({ startDate: "", endDate: "" });
      setModal(null);
      await fetchSlots(); fetchStats();
    } catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await slotService.delete(id);
      toast.success("Deleted");
      setSlots((p) => p.filter((s) => s._id !== id));
      fetchStats();
    } catch (err) { toast.error(getErrorMessage(err) || "Cannot delete"); }
  };

  const handleToggleBlock = async (slot: Slot) => {
    const newStatus = slot.slotStatus === "blocked" ? "available" : "blocked";
    try {
      await slotService.update(slot._id, { slotStatus: newStatus });
      toast.success(newStatus === "blocked" ? "Blocked" : "Unblocked");
      await fetchSlots(); fetchStats();
    } catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
  };

  const openEdit = (slot: Slot) => {
    setEditingSlot(slot);
    setEditForm({ date: slot.date, startTime: slot.startTime, endTime: slot.endTime, slotStatus: slot.slotStatus === "booked" ? "available" : slot.slotStatus });
    setModal("edit");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;
    const dto: Partial<CreateSlotDto> = {};
    if (editForm.date !== editingSlot.date) dto.date = editForm.date;
    if (editForm.startTime !== editingSlot.startTime) dto.startTime = editForm.startTime;
    if (editForm.endTime !== editingSlot.endTime) dto.endTime = editForm.endTime;
    if (editForm.slotStatus !== editingSlot.slotStatus) dto.slotStatus = editForm.slotStatus as unknown;
    if (!Object.keys(dto).length) { setModal(null); return; }
    setSaving(true);
    try {
      await slotService.update(editingSlot._id, dto);
      toast.success("Updated");
      setModal(null); setEditingSlot(null);
      await fetchSlots(); fetchStats();
    } catch (err) { toast.error(getErrorMessage(err) || "Failed"); }
    finally { setSaving(false); }
  };

  const addBulkDate = () => {
    if (bulkDateInput && !bulkForm.dates.includes(bulkDateInput)) {
      setBulkForm({ ...bulkForm, dates: [...bulkForm.dates, bulkDateInput].sort() });
      setBulkDateInput("");
    }
  };

  const calCellClick = (date: string) => {
    setForm({ ...form, date });
    setModal("create");
  };

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); };


  return (
    <ProviderPortalShell>
      {/* ── Stats Cards ─────────────────────────────────────────────────────── */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Today's Bookings", value: stats.todayBooked, color: "text-blue-600 bg-blue-50" },
            { label: "Upcoming", value: stats.upcoming, color: "text-violet-600 bg-violet-50" },
            { label: "Available", value: stats.available, color: "text-emerald-600 bg-emerald-50" },
            { label: "Blocked", value: stats.blocked, color: "text-slate-600 bg-slate-100" },
            { label: "Total Slots", value: stats.total, color: "text-indigo-600 bg-indigo-50" },
          ].map((c) => (
            <div key={c.label} className={`rounded-xl border border-slate-200 p-4 ${c.color}`}>
              <p className="text-2xl font-black">{c.value}</p>
              <p className="text-xs font-semibold opacity-70">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setView("calendar")} className={`rounded-lg p-2 ${view === "calendar" ? "bg-indigo-100 text-indigo-700" : "text-slate-400 hover:bg-slate-100"}`}><Calendar size={18} /></button>
          <button onClick={() => setView("list")} className={`rounded-lg p-2 ${view === "list" ? "bg-indigo-100 text-indigo-700" : "text-slate-400 hover:bg-slate-100"}`}><List size={18} /></button>
          <div className="ml-2 relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-sm w-36 outline-none focus:border-indigo-400" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none">
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="booked">Booked</option>
            <option value="blocked">Blocked</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {view === "list" && (
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setModal("create")} className="btn btn-primary px-3 py-2 text-xs"><Plus size={14} /> Slot</button>
          <button onClick={() => setModal("bulk")} className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"><Copy size={14} className="inline mr-1" />Bulk</button>
          <button onClick={() => setModal("recurring")} className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100"><Repeat size={14} className="inline mr-1" />Recurring</button>
          <button onClick={() => setModal("blockRange")} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"><Ban size={14} className="inline mr-1" />Block Range</button>
        </div>
      </div>

      {/* ── Calendar View ───────────────────────────────────────────────────── */}
      {view === "calendar" && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronLeft size={18} /></button>
            <h3 className="text-sm font-bold text-slate-800">{MONTHS[calMonth]} {calYear}</h3>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 border-b border-slate-100 py-2">
            {DAYS.map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {(() => {
              const firstDay = new Date(calYear, calMonth, 1).getDay();
              const daysInMonth = getDaysInMonth(calYear, calMonth);
              const today = formatDate(new Date());
              const cells = [];
              for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} className="h-20 border-b border-r border-slate-50" />);
              for (let day = 1; day <= daysInMonth; day++) {
                const date = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const daySlots = calendarSlots[date] || [];
                const isToday = date === today;
                cells.push(
                  <div key={date} onClick={() => calCellClick(date)} className={`h-20 border-b border-r border-slate-50 p-1 cursor-pointer hover:bg-indigo-50/50 transition ${isToday ? "bg-indigo-50/70" : ""}`}>
                    <span className={`text-[11px] font-bold ${isToday ? "text-indigo-600" : "text-slate-600"}`}>{day}</span>
                    <div className="mt-0.5 flex flex-wrap gap-0.5">
                      {daySlots.slice(0, 4).map((s) => (
                        <span key={s._id} className={`w-1.5 h-1.5 rounded-full ${CAL_DOT[s.slotStatus]}`} title={`${s.startTime}-${s.endTime} (${s.slotStatus})`} />
                      ))}
                      {daySlots.length > 4 && <span className="text-[8px] text-slate-400">+{daySlots.length - 4}</span>}
                    </div>
                    {daySlots.length > 0 && (
                      <p className="text-[9px] font-semibold text-slate-500 mt-0.5 truncate">{daySlots.length} slot{daySlots.length > 1 ? "s" : ""}</p>
                    )}
                  </div>
                );
              }
              return cells;
            })()}
          </div>
        </div>
      )}


      {/* ── List View ───────────────────────────────────────────────────────── */}
      {view === "list" && (
        loading ? (
          <div className="py-12 text-center"><Loader2 size={24} className="animate-spin mx-auto text-indigo-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <CalendarDays size={40} className="mx-auto text-slate-300" />
            <p className="mt-4 font-bold text-slate-600">No slots found</p>
            <p className="mt-1 text-sm text-slate-400">Create availability slots so customers can book.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((slot) => (
              <div key={slot._id} className={`rounded-xl border bg-white p-4 transition hover:shadow-sm ${slot.slotStatus === "booked" ? "border-blue-100" : "border-slate-200"}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${STATUS_COLORS[slot.slotStatus]}`}>
                    {slot.slotStatus}
                  </span>
                  <span className="text-xs text-slate-400">{slot.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Clock size={14} className="text-indigo-500" />
                  {slot.startTime} – {slot.endTime}
                </div>
                {slot.slotStatus !== "booked" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => openEdit(slot)} className="inline-flex items-center gap-1 rounded-lg border border-indigo-100 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50"><Pencil size={11} /> Edit</button>
                    <button onClick={() => handleToggleBlock(slot)} className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">{slot.slotStatus === "blocked" ? "Unblock" : "Block"}</button>
                    <button onClick={() => handleDelete(slot._id)} className="inline-flex items-center rounded-lg border border-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50"><Trash2 size={11} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}


      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setModal(null)}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-950">
                {modal === "create" && "Create Slot"}
                {modal === "bulk" && "Bulk Create"}
                {modal === "recurring" && "Recurring Slots"}
                {modal === "blockRange" && "Block Date Range"}
                {modal === "edit" && "Edit Slot"}
              </h2>
              <button onClick={() => setModal(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>

            {/* Create Single */}
            {modal === "create" && (
              <form onSubmit={handleCreate} className="space-y-3">
                <div><label className="mb-1 block text-xs font-bold text-slate-600">Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">Start</label><input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" required /></div>
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">End</label><input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" required /></div>
                </div>
                <div><label className="mb-1 block text-xs font-bold text-slate-600">Status</label><select value={form.slotStatus} onChange={(e) => setForm({ ...form, slotStatus: e.target.value as unknown })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"><option value="available">Available</option><option value="blocked">Blocked</option></select></div>
                <button type="submit" disabled={saving} className="btn btn-primary w-full py-2.5 text-sm mt-2">{saving ? <Loader2 size={14} className="animate-spin" /> : "Create Slot"}</button>
              </form>
            )}

            {/* Bulk Create */}
            {modal === "bulk" && (
              <form onSubmit={handleBulkCreate} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">Add Dates</label>
                  <div className="flex gap-2">
                    <input type="date" value={bulkDateInput} onChange={(e) => setBulkDateInput(e.target.value)} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
                    <button type="button" onClick={addBulkDate} className="rounded-lg bg-indigo-100 px-3 py-2 text-xs font-bold text-indigo-700">Add</button>
                  </div>
                  {bulkForm.dates.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {bulkForm.dates.map((d) => (
                        <span key={d} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                          {d} <button type="button" onClick={() => setBulkForm({ ...bulkForm, dates: bulkForm.dates.filter((x) => x !== d) })} className="text-indigo-400 hover:text-red-500"><X size={10} /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">Start</label><input type="time" value={bulkForm.startTime} onChange={(e) => setBulkForm({ ...bulkForm, startTime: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" required /></div>
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">End</label><input type="time" value={bulkForm.endTime} onChange={(e) => setBulkForm({ ...bulkForm, endTime: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" required /></div>
                </div>
                <button type="submit" disabled={saving || !bulkForm.dates.length} className="btn btn-primary w-full py-2.5 text-sm mt-2">{saving ? <Loader2 size={14} className="animate-spin" /> : `Create ${bulkForm.dates.length} Slots`}</button>
              </form>
            )}

            {/* Recurring */}
            {modal === "recurring" && (
              <form onSubmit={handleRecurring} className="space-y-3">
                <div><label className="mb-1 block text-xs font-bold text-slate-600">Pattern</label><select value={recurForm.pattern} onChange={(e) => setRecurForm({ ...recurForm, pattern: e.target.value as unknown })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none">
                  <option value="daily">Daily</option><option value="weekdays">Weekdays (Mon-Fri)</option><option value="weekends">Weekends</option><option value="weekly">Weekly (same day)</option><option value="custom">Custom Days</option>
                </select></div>
                {recurForm.pattern === "custom" && (
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((d, i) => (
                      <button key={d} type="button" onClick={() => {
                        const days = recurForm.customDays || [];
                        setRecurForm({ ...recurForm, customDays: days.includes(i) ? days.filter((x) => x !== i) : [...days, i] });
                      }} className={`rounded-full px-3 py-1 text-xs font-bold ${(recurForm.customDays || []).includes(i) ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>{d}</button>
                    ))}
                  </div>
                )}
                <div><label className="mb-1 block text-xs font-bold text-slate-600">Start Date</label><input type="date" value={recurForm.startDate} onChange={(e) => setRecurForm({ ...recurForm, startDate: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">End Date (optional)</label><input type="date" value={recurForm.endDate || ""} onChange={(e) => setRecurForm({ ...recurForm, endDate: e.target.value || undefined })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></div>
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">Max Occurrences</label><input type="number" min={1} max={90} value={recurForm.occurrences || ""} onChange={(e) => setRecurForm({ ...recurForm, occurrences: Number(e.target.value) || undefined })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">Start Time</label><input type="time" value={recurForm.startTime} onChange={(e) => setRecurForm({ ...recurForm, startTime: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" required /></div>
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">End Time</label><input type="time" value={recurForm.endTime} onChange={(e) => setRecurForm({ ...recurForm, endTime: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" required /></div>
                </div>
                <button type="submit" disabled={saving} className="btn btn-primary w-full py-2.5 text-sm mt-2">{saving ? <Loader2 size={14} className="animate-spin" /> : "Generate Recurring Slots"}</button>
              </form>
            )}

            {/* Block Range */}
            {modal === "blockRange" && (
              <form onSubmit={handleBlockRange} className="space-y-3">
                <p className="text-xs text-slate-500">Block all slots in a date range (vacation, holidays, leave).</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">From</label><input type="date" value={blockForm.startDate} onChange={(e) => setBlockForm({ ...blockForm, startDate: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" required /></div>
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">To</label><input type="date" value={blockForm.endDate} onChange={(e) => setBlockForm({ ...blockForm, endDate: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" required /></div>
                </div>
                <button type="submit" disabled={saving} className="btn btn-primary w-full py-2.5 text-sm mt-2 !bg-slate-800 hover:!bg-slate-900">{saving ? <Loader2 size={14} className="animate-spin" /> : "Block Date Range"}</button>
              </form>
            )}

            {/* Edit */}
            {modal === "edit" && editingSlot && (
              <form onSubmit={handleEditSubmit} className="space-y-3">
                <div><label className="mb-1 block text-xs font-bold text-slate-600">Date</label><input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">Start</label><input type="time" value={editForm.startTime} onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" required /></div>
                  <div><label className="mb-1 block text-xs font-bold text-slate-600">End</label><input type="time" value={editForm.endTime} onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" required /></div>
                </div>
                <div><label className="mb-1 block text-xs font-bold text-slate-600">Status</label><select value={editForm.slotStatus} onChange={(e) => setEditForm({ ...editForm, slotStatus: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"><option value="available">Available</option><option value="blocked">Blocked</option><option value="cancelled">Cancelled</option></select></div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setModal(null)} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={saving} className="btn btn-primary flex-1 py-2 text-sm">{saving ? <Loader2 size={14} className="animate-spin" /> : "Save"}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </ProviderPortalShell>
  );
}
