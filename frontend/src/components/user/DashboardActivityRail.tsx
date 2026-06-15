"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CalendarDays, FileText, ChevronDown, Loader2, ArrowRight } from "lucide-react";
import { bookingService } from "@/services/booking";
import { Booking, BookingStatus } from "@/types/booking.types";

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  accepted: "bg-indigo-100 text-indigo-700",
  in_progress: "bg-purple-100 text-purple-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  rejected: "bg-red-100 text-red-700",
};

const fmt = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(iso));

const serviceName = (b: Booking) =>
  typeof b.serviceId === "object" && b.serviceId ? b.serviceId.name : "Service";

function Panel({
  title, icon, open, onToggle, loading, items, emptyText, viewAllHref,
}: {
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  loading: boolean;
  items: Booking[];
  emptyText: string;
  viewAllHref: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-2.5 font-bold text-slate-800 text-sm">
          <span className="text-indigo-600">{icon}</span> {title}
          {items.length > 0 && (
            <span className="rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold px-2 py-0.5">{items.length}</span>
          )}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="px-3 pb-3 space-y-2">
            {loading ? (
              <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-indigo-400" /></div>
            ) : items.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">{emptyText}</p>
            ) : (
              <>
                {items.slice(0, 4).map((b) => (
                  <Link
                    key={b._id}
                    href={`/bookings/${b._id}`}
                    className="block rounded-xl border border-slate-100 p-3 hover:border-indigo-200 hover:bg-indigo-50/40 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">{serviceName(b)}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${STATUS_COLORS[b.bookingStatus]}`}>
                        {b.bookingStatus.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">{fmt(b.date)} · {b.startTime}</p>
                  </Link>
                ))}
                <Link href={viewAllHref} className="flex items-center justify-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 pt-1">
                  View all <ArrowRight size={12} />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardActivityRail() {
  const [openBookings, setOpenBookings] = useState(true);
  const [openRequests, setOpenRequests] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [requests, setRequests] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [confirmedRes, pendingRes] = await Promise.all([
        bookingService.getMyBookings({ status: "confirmed", page: 1, limit: 5 }),
        bookingService.getMyBookings({ status: "pending", page: 1, limit: 5 }),
      ]);
      setBookings(confirmedRes.data.data.items);
      setRequests(pendingRes.data.data.items);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-3">
      <Panel
        title="My Bookings"
        icon={<CalendarDays size={16} />}
        open={openBookings}
        onToggle={() => setOpenBookings((v) => !v)}
        loading={loading}
        items={bookings}
        emptyText="No upcoming bookings."
        viewAllHref="/bookings"
      />
      <Panel
        title="Requests"
        icon={<FileText size={16} />}
        open={openRequests}
        onToggle={() => setOpenRequests((v) => !v)}
        loading={loading}
        items={requests}
        emptyText="No pending requests."
        viewAllHref="/bookings"
      />
    </div>
  );
}
