"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Play, CheckCircle2, CalendarDays, Clock, MapPin, User,
  Loader2, X, Phone, Mail, ChevronRight, IndianRupee,
  AlertCircle, XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { ProviderPortalShell } from "@/components/provider/ProviderPortalShell";
import { bookingService } from "@/services/booking";
import { Booking, BookingStatus } from "@/types/booking.types";
import { getErrorMessage } from "@/utils/errorHandler";

const TABS: { label: string; status?: BookingStatus }[] = [
  { label: "All" },
  { label: "Confirmed", status: "confirmed" },
  { label: "In Progress", status: "in_progress" },
  { label: "Completed", status: "completed" },
  { label: "Cancelled", status: "cancelled" },
];

const STATUS_META: Record<string, { bg: string; text: string; dot: string }> = {
  confirmed:   { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500"    },
  in_progress: { bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-500"  },
  completed:   { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  cancelled:   { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-500"     },
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}
function formatShort(iso: string) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(new Date(iso));
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {status.replace("_", " ")}
    </span>
  );
}

// ── Detail Drawer ────────────────────────────────────────────────────────────
function BookingDrawer({
  booking,
  onClose,
  onStatusChange,
  onCancel,
  updating,
}: {
  booking: Booking;
  onClose: () => void;
  onStatusChange: (id: string, status: "in_progress" | "completed") => void;
  onCancel: (id: string, reason?: string) => void;
  updating: boolean;
}) {
  const svc  = typeof booking.serviceId === "object" ? booking.serviceId : null;
  const usr  = typeof booking.userId    === "object" ? booking.userId    : null;

  const timeline = [...(booking.statusHistory ?? [])].reverse();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Deadline: before midnight of service date
  const canCancel = booking.bookingStatus === "confirmed" &&
    Date.now() < new Date(`${booking.date}T00:00:00`).getTime() - 1000;

  const cancelDeadline = (() => {
    const d = new Date(`${booking.date}T00:00:00`);
    d.setDate(d.getDate() - 1);
    d.setHours(23, 59, 59);
    return d;
  })();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Booking Details</p>
            <p className="text-[11px] text-slate-400 mt-0.5">#{booking._id.slice(-8).toUpperCase()}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Status */}
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <span className="text-sm font-semibold text-slate-600">Status</span>
            <StatusBadge status={booking.bookingStatus} />
          </div>

          {/* Service */}
          <section>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">Service</p>
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="font-bold text-slate-900">{svc?.name || "Service"}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} className="text-violet-400" />
                  <span>{formatDate(booking.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-violet-400" />
                  <span>{booking.startTime} – {booking.endTime}</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <MapPin size={14} className="text-violet-400" />
                  <span>{[booking.address.street, booking.address.city, booking.address.state].filter(Boolean).join(", ")}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Customer */}
          <section>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">Customer</p>
            <div className="rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-violet-50 flex items-center justify-center shrink-0">
                <User size={18} className="text-violet-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900">{usr?.name || "Customer"}</p>
                {usr?.email && (
                  <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <Mail size={11} /> {usr.email}
                  </p>
                )}
                {usr?.phone && (
                  <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <Phone size={11} /> {usr.phone}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Payment */}
          <section>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">Payment</p>
            <div className="rounded-2xl border border-slate-100 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600">
                <IndianRupee size={16} className="text-violet-400" />
                <span className="text-sm font-semibold">Amount</span>
              </div>
              <p className="text-xl font-extrabold text-slate-900">₹{booking.amount}</p>
            </div>
          </section>

          {/* Cancel reason */}
          {booking.cancelReason && (
            <section>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">Cancel Reason</p>
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4 flex gap-2 text-sm text-red-600">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                {booking.cancelReason}
              </div>
            </section>
          )}

          {/* Status timeline */}
          {timeline.length > 0 && (
            <section>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Activity</p>
              <div className="space-y-3">
                {timeline.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${STATUS_META[entry.status]?.dot ?? "bg-slate-400"}`} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-700 capitalize">{entry.status.replace("_", " ")}</p>
                      {entry.note && <p className="text-xs text-slate-400">{entry.note}</p>}
                      <p className="text-[11px] text-slate-400">
                        {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.at))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Action footer */}
        {(booking.bookingStatus === "confirmed" || booking.bookingStatus === "in_progress") && (
          <div className="border-t border-slate-100 px-6 py-4 space-y-2">
            {booking.bookingStatus === "confirmed" && (
              <button
                onClick={() => onStatusChange(booking._id, "in_progress")}
                disabled={updating}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#6D28FF] to-[#8B5CF6] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/25 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {updating ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                Start Work
              </button>
            )}
            {booking.bookingStatus === "in_progress" && (
              <button
                onClick={() => onStatusChange(booking._id, "completed")}
                disabled={updating}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {updating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Mark as Completed
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={updating}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-6 py-3 text-sm font-bold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <XCircle size={15} /> Cancel Booking
              </button>
            )}
          </div>
        )}

        {/* Cancel modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCancelModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10">
              <h3 className="text-base font-black text-slate-900 mb-1">Cancel Booking</h3>
              <p className="text-sm text-slate-500 mb-3">This will release the slot and notify the customer.</p>
              <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 flex items-center gap-2 text-xs text-amber-700 font-medium">
                <AlertCircle size={12} className="shrink-0" />
                Deadline: {new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(cancelDeadline)}
              </div>
              <textarea
                placeholder="Reason for cancellation (optional)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-300 resize-none"
              />
              <div className="mt-3 flex gap-2">
                <button onClick={() => setShowCancelModal(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Keep</button>
                <button
                  onClick={() => { onCancel(booking._id, cancelReason || undefined); setShowCancelModal(false); }}
                  disabled={updating}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ProviderBookingsPage() {
  const [activeTab,  setActiveTab]  = useState(0);
  const [bookings,   setBookings]   = useState<Booking[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState<Booking | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params: { status?: BookingStatus } = {};
      if (TABS[activeTab].status) params.status = TABS[activeTab].status;
      const res = await bookingService.getProviderBookings(params);
      setBookings(res.data.data.items);
    } catch (e) {
      toast.error(getErrorMessage(e) || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleStatusChange = async (id: string, status: "in_progress" | "completed") => {
    setUpdatingId(id);
    try {
      await bookingService.updateStatus(id, status);
      toast.success(status === "in_progress" ? "Booking started!" : "Booking completed!");
      await fetchBookings();
      // Update the selected booking's status locally so the drawer reflects it
      setSelected(prev => prev && prev._id === id ? { ...prev, bookingStatus: status } : prev);
    } catch (e) {
      toast.error(getErrorMessage(e) || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancel = async (id: string, reason?: string) => {
    setUpdatingId(id);
    try {
      await bookingService.cancel(id, reason);
      toast.success("Booking cancelled");
      await fetchBookings();
      setSelected(prev => prev && prev._id === id ? { ...prev, bookingStatus: "cancelled" } : prev);
    } catch (e) {
      toast.error(getErrorMessage(e) || "Failed to cancel booking");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <ProviderPortalShell>
      <div className="mb-8">
        <p className="text-sm font-bold text-[var(--primary)]">Bookings</p>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">Customer Bookings</h1>
        <p className="text-sm text-slate-500 mt-1">Click a booking to view details and manage status</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(i)}
            className={`rounded-full px-4 py-2 text-sm font-bold capitalize transition-all ${
              activeTab === i
                ? "bg-gradient-to-r from-[#6D28FF] to-[#8B5CF6] text-white shadow-md shadow-purple-500/20"
                : "border border-slate-200 bg-white text-slate-500 hover:border-purple-200 hover:text-[var(--primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-[20px] border border-slate-100 bg-white p-5">
              <div className="flex gap-4">
                <div className="skeleton h-12 w-12 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-40 rounded-lg" />
                  <div className="skeleton h-3 w-56 rounded-lg" />
                  <div className="skeleton h-3 w-32 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-[22px] border-2 border-dashed border-slate-200 bg-white p-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
            <CalendarDays size={24} className="text-purple-400" />
          </div>
          <p className="font-bold text-slate-600 text-lg">No bookings found</p>
          <p className="text-sm text-slate-400 mt-1">Bookings from customers will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const svc = typeof b.serviceId === "object" ? b.serviceId : null;
            const usr = typeof b.userId    === "object" ? b.userId    : null;
            return (
              <article
                key={b._id}
                onClick={() => setSelected(b)}
                className="group cursor-pointer rounded-[20px] border border-slate-100 bg-white p-5 hover:border-violet-200 hover:shadow-md hover:shadow-violet-500/5 transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                    <User size={16} className="text-violet-500" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900 text-sm">{usr?.name || "Customer"}</p>
                      <StatusBadge status={b.bookingStatus} />
                    </div>
                    <p className="text-sm text-slate-500 truncate mt-0.5">{svc?.name || "Service"}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1"><CalendarDays size={11} />{formatShort(b.date)}</span>
                      <span className="inline-flex items-center gap-1"><Clock size={11} />{b.startTime} – {b.endTime}</span>
                      <span className="inline-flex items-center gap-1"><MapPin size={11} />{b.address.city}</span>
                    </div>
                  </div>

                  {/* Amount + chevron */}
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-base font-extrabold text-slate-900">₹{b.amount}</p>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-violet-400 transition-colors" />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <BookingDrawer
          booking={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          onCancel={handleCancel}
          updating={updatingId === selected._id}
        />
      )}
    </ProviderPortalShell>
  );
}
