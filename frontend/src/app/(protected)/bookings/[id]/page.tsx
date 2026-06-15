"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, CalendarDays, Clock, MapPin, CheckCircle2,
  XCircle, AlertCircle, RefreshCw, Package, User, Shield, MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import { bookingService } from "@/services/booking";
import { slotService, Slot } from "@/services/provider";
import { messagingService } from "@/services/messaging";
import { Booking, BookingStatus, BookingStatusEntry } from "@/types/booking.types";
import { getErrorMessage } from "@/utils/errorHandler";

const STATUS_ORDER: BookingStatus[] = ["pending", "confirmed", "accepted", "in_progress", "completed"];

const STATUS_META: Record<BookingStatus, { icon: typeof CheckCircle2; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-amber-500", label: "Pending" },
  confirmed: { icon: CheckCircle2, color: "text-blue-500", label: "Confirmed" },
  accepted: { icon: CheckCircle2, color: "text-indigo-500", label: "Accepted" },
  in_progress: { icon: RefreshCw, color: "text-purple-500", label: "In Progress" },
  completed: { icon: CheckCircle2, color: "text-emerald-500", label: "Completed" },
  cancelled: { icon: XCircle, color: "text-red-500", label: "Cancelled" },
  rejected: { icon: XCircle, color: "text-red-500", label: "Rejected" },
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function getNext7Days(): string[] {
  const days: string[] = [];
  const d = new Date();
  d.setDate(d.getDate() + 1); // start from tomorrow for reschedule
  for (let i = 0; i < 7; i++) {
    days.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

export default function BookingDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  // Reschedule state
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Cancel state
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchBooking = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const r = await bookingService.getById(id);
      setBooking(r.data.data);
    } catch (e) {
      toast.error(getErrorMessage(e) || "Failed to load booking");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

  const providerId = useMemo(() => {
    if (!booking) return null;
    return typeof booking.providerId === "object" ? booking.providerId._id : booking.providerId;
  }, [booking]);

  const canReschedule = useMemo(() => {
    if (!booking) return false;
    if (["cancelled", "completed", "rejected"].includes(booking.bookingStatus)) return false;
    const bookingTime = new Date(`${booking.date}T${booking.startTime}:00`);
    return bookingTime.getTime() - Date.now() > 24 * 60 * 60 * 1000;
  }, [booking]);

  const canCancel = useMemo(() => {
    if (!booking) return false;
    if (booking.bookingStatus !== "confirmed") return false;
    // Deadline: before midnight of the service date (i.e. must be done by end of previous day)
    const deadline = new Date(`${booking.date}T00:00:00`).getTime() - 1000;
    return Date.now() < deadline;
  }, [booking]);

  const cancelDeadline = useMemo(() => {
    if (!booking) return null;
    // End of day before service date
    const d = new Date(`${booking.date}T00:00:00`);
    d.setDate(d.getDate() - 1);
    d.setHours(23, 59, 59);
    return d;
  }, [booking]);

  // Fetch slots for reschedule
  useEffect(() => {
    if (!showReschedule || !providerId || !rescheduleDate) return;
    let c = false;
    setSlotsLoading(true);
    slotService.getAvailable(providerId, rescheduleDate)
      .then((r) => { if (!c) setRescheduleSlots(r.data.data); })
      .catch(() => { if (!c) setRescheduleSlots([]); })
      .finally(() => { if (!c) setSlotsLoading(false); });
    return () => { c = true; };
  }, [showReschedule, providerId, rescheduleDate]);

  const handleReschedule = async (slotId: string) => {
    setRescheduleLoading(true);
    try {
      const r = await bookingService.reschedule(id, slotId);
      setBooking(r.data.data);
      setShowReschedule(false);
      toast.success("Booking rescheduled successfully");
    } catch (e) {
      toast.error(getErrorMessage(e) || "Failed to reschedule");
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      const r = await bookingService.cancel(id, cancelReason || undefined);
      setBooking(r.data.data);
      setShowCancel(false);
      toast.success("Booking cancelled");
    } catch (e) {
      toast.error(getErrorMessage(e) || "Failed to cancel");
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>;
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <AlertCircle size={32} className="text-slate-400 mb-2" />
        <p className="font-bold text-slate-600">Booking not found</p>
        <Link href="/bookings" className="mt-3 text-sm font-bold text-indigo-600 hover:underline">Back to bookings</Link>
      </div>
    );
  }

  const svc = typeof booking.serviceId === "object" ? booking.serviceId : null;
  const prov = typeof booking.providerId === "object" ? booking.providerId : null;
  const meta = STATUS_META[booking.bookingStatus];
  const dates = getNext7Days();

  return (
    <div className="mx-auto w-full max-w-4xl fade-up">
        <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-indigo-600">
          <ArrowLeft size={14} /> Back
        </button>

        {/* Header */}
        <div className="rounded-[18px] border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500">Booking ID</p>
              <p className="font-mono text-sm font-bold text-slate-900">{booking._id.slice(-8).toUpperCase()}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${meta.color} bg-opacity-10`} style={{ backgroundColor: "currentColor", WebkitBackgroundClip: "unset", color: "inherit" }}>
              <span className={`inline-flex items-center gap-1 ${meta.color}`}>
                <meta.icon size={12} /> {meta.label}
              </span>
            </span>
          </div>

          {/* Service info */}
          <div className="mt-4 flex gap-4">
            {svc?.images?.[0] && (
              <div className="hidden sm:block h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={svc.images[0]} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-black text-slate-950">{svc?.name || "Service"}</h1>
              <p className="mt-1 text-sm text-slate-500">{svc ? `${svc.duration} min · ₹${svc.price}` : ""}</p>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[18px] border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-1"><CalendarDays size={12} /> Date & Time</p>
            <p className="font-bold text-slate-900">{formatDate(booking.date)}</p>
            <p className="text-sm text-slate-600">{booking.startTime} – {booking.endTime}</p>
          </div>

          <div className="rounded-[18px] border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-1"><MapPin size={12} /> Address</p>
            <p className="font-bold text-slate-900">{booking.address.street}</p>
            <p className="text-sm text-slate-600">{booking.address.city}, {booking.address.state} {booking.address.zip}</p>
          </div>

          <div className="rounded-[18px] border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-1"><User size={12} /> Provider</p>
            <p className="font-bold text-slate-900">{prov?.businessName || prov?.name || "—"}</p>
            {prov?.phone && <p className="text-sm text-slate-600">{prov.phone}</p>}
          </div>

          <div className="rounded-[18px] border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-1"><Shield size={12} /> Payment</p>
            <p className="text-2xl font-black text-indigo-600">₹{booking.amount}</p>
            <p className="text-xs text-slate-500 capitalize">Status: {booking.paymentStatus}</p>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="text-sm font-black text-slate-900 mb-4">Status Timeline</h2>
          <div className="space-y-0">
            {booking.statusHistory.map((entry, i) => {
              const m = STATUS_META[entry.status] || STATUS_META.pending;
              const Icon = m.icon;
              return (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full bg-white border-2 ${m.color.replace("text-", "border-")}`}>
                      <Icon size={14} className={m.color} />
                    </div>
                    {i < booking.statusHistory.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1" />}
                  </div>
                  <div className="pb-4">
                    <p className="font-bold text-slate-900 text-sm capitalize">{entry.status.replace("_", " ")}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(entry.at)}</p>
                    {entry.note && <p className="text-xs text-slate-600 mt-0.5 italic">{entry.note}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timestamps */}
        <div className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4 flex flex-wrap gap-6 text-xs text-slate-500">
          <span>Created: {formatDateTime(booking.createdAt)}</span>
          <span>Updated: {formatDateTime(booking.updatedAt)}</span>
        </div>

        {/* Actions */}
        {(canReschedule || canCancel) && (
          <div className="mt-4 flex gap-3">
            {canReschedule && (
              <button onClick={() => { setShowReschedule(true); setRescheduleDate(dates[0]); }} className="flex-1 rounded-xl border border-indigo-200 bg-indigo-50 py-3 text-sm font-bold text-indigo-700 hover:bg-indigo-100 flex items-center justify-center gap-2">
                <RefreshCw size={14} /> Reschedule
              </button>
            )}
            {canCancel && (
              <button onClick={() => setShowCancel(true)} className="flex-1 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-700 hover:bg-red-100 flex items-center justify-center gap-2">
                <XCircle size={14} /> Cancel
              </button>
            )}
          </div>
        )}
        {/* Cancellation deadline passed — confirmed but no longer cancellable */}
        {booking.bookingStatus === "confirmed" && !canCancel && (
          <div className="mt-4 rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-2 text-sm text-amber-700">
            <AlertCircle size={15} className="shrink-0" />
            Cancellation is no longer available. Bookings can only be cancelled before the service day.
          </div>
        )}

        {/* Message Provider */}
        {providerId && (
          <div className="mt-4">
            <button
              onClick={async () => {
                try {
                  await messagingService.getOrCreateConversation({ providerId: providerId!, bookingId: id, serviceId: typeof booking.serviceId === "object" ? booking.serviceId._id : booking.serviceId });
                  router.push("/messages");
                } catch (e) {
                  toast.error(getErrorMessage(e) || "Failed to start conversation");
                }
              }}
              className="w-full rounded-xl border border-indigo-200 bg-indigo-50 py-3 text-sm font-bold text-indigo-700 hover:bg-indigo-100 flex items-center justify-center gap-2 transition"
            >
              <MessageSquare size={14} /> Message Provider
            </button>
          </div>
        )}

        {/* Reschedule Modal */}
        {showReschedule && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowReschedule(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-black text-slate-900 mb-1">Reschedule Booking</h2>
              <p className="text-sm text-slate-500 mb-4">Choose a new date and time slot</p>

              {/* Date picker */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
                {dates.map((d) => (
                  <button key={d} onClick={() => setRescheduleDate(d)} className={`shrink-0 rounded-lg px-3 py-2 text-center transition ${d === rescheduleDate ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-600 hover:border-indigo-300"}`}>
                    <p className="text-[10px] font-bold uppercase">{new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(d))}</p>
                    <p className="text-sm font-black">{new Date(d).getDate()}</p>
                  </button>
                ))}
              </div>

              {/* Slots */}
              {slotsLoading ? (
                <div className="py-6 text-center"><Loader2 size={20} className="mx-auto animate-spin text-indigo-500" /></div>
              ) : rescheduleSlots.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <p className="font-bold text-slate-600">No slots available</p>
                  <p className="text-xs text-slate-500 mt-1">Try another date</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {rescheduleSlots.map((slot) => (
                    <button key={slot._id} onClick={() => handleReschedule(slot._id)} disabled={rescheduleLoading} className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                      {slot.startTime} – {slot.endTime}
                    </button>
                  ))}
                </div>
              )}

              <button onClick={() => setShowReschedule(false)} className="mt-4 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancel && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCancel(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md z-10">
              <h2 className="text-lg font-black text-slate-900 mb-1">Cancel Booking</h2>
              <p className="text-sm text-slate-500 mb-3">Are you sure? This action cannot be undone.</p>

              {cancelDeadline && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 flex items-center gap-2 text-xs text-amber-700 font-medium">
                  <AlertCircle size={13} className="shrink-0" />
                  Cancellation deadline: {new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(cancelDeadline)}
                </div>
              )}

              <textarea
                placeholder="Reason for cancellation (optional)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-300 resize-none"
              />

              <div className="mt-4 flex gap-3">
                <button onClick={() => setShowCancel(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Keep Booking</button>
                <button onClick={handleCancel} disabled={cancelLoading} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {cancelLoading && <Loader2 size={14} className="animate-spin" />} Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
