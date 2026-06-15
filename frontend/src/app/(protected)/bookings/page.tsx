"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays, Clock, MapPin, Search, ChevronLeft, ChevronRight,
  Package, Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { bookingService } from "@/services/booking";
import { Booking, BookingStatus } from "@/types/booking.types";
import { getErrorMessage } from "@/utils/errorHandler";

const TABS: { label: string; statuses: BookingStatus[] }[] = [
  { label: "Upcoming", statuses: ["confirmed", "accepted"] },
  { label: "Pending", statuses: ["pending"] },
  { label: "In Progress", statuses: ["in_progress"] },
  { label: "Completed", statuses: ["completed"] },
  { label: "Cancelled", statuses: ["cancelled", "rejected"] },
];

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-100",
  confirmed: "bg-blue-50 text-blue-700 border border-blue-100",
  accepted: "bg-purple-50 text-purple-700 border border-purple-100",
  in_progress: "bg-violet-50 text-violet-700 border border-violet-100",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  cancelled: "bg-red-50 text-red-700 border border-red-100",
  rejected: "bg-red-50 text-red-700 border border-red-100",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const limit = 10;
  const currentStatuses = TABS[activeTab].statuses;

  const fetchBookings = useCallback(async (status: BookingStatus[], p: number) => {
    setLoading(true);
    try {
      const r = await bookingService.getMyBookings({ status: status[0], page: p, limit });
      setBookings(r.data.data.items);
      setTotal(r.data.data.total);
    } catch (e) {
      toast.error(getErrorMessage(e) || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings(currentStatuses, page);
  }, [activeTab, page, fetchBookings, currentStatuses]);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    setPage(1);
  };

  const filtered = search
    ? bookings.filter((b) => {
        const svc = typeof b.serviceId === "object" ? b.serviceId.name : "";
        const prov = typeof b.providerId === "object" ? (b.providerId.businessName || b.providerId.name) : "";
        const q = search.toLowerCase();
        return svc.toLowerCase().includes(q) || prov.toLowerCase().includes(q) || b._id.includes(q);
      })
    : bookings;

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto w-full max-w-5xl fade-up">
        <div className="mb-5">
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">My Bookings</h1>
          <p className="mt-1 text-sm text-slate-500">Track and manage your service bookings</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200/60 pb-px mb-4">
          {TABS.map((tab, i) => (
            <button key={tab.label} onClick={() => handleTabChange(i)} className={`shrink-0 px-4 py-2.5 text-sm font-bold transition-all border-b-[2.5px] rounded-t-lg ${i === activeTab ? "border-[var(--primary)] text-[var(--primary)] bg-purple-50/50" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by service, provider, or booking ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200/80 bg-white pl-12 pr-4 py-3 text-sm font-medium outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/8 shadow-sm transition-all"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-[18px] border border-slate-100 bg-white p-4 sm:p-5">
                <div className="flex gap-4">
                  <div className="hidden sm:block skeleton h-20 w-20 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between">
                      <div className="skeleton h-4 w-40 rounded-lg" />
                      <div className="skeleton h-5 w-18 rounded-full" />
                    </div>
                    <div className="skeleton h-3.5 w-28 rounded-lg" />
                    <div className="skeleton h-3.5 w-56 rounded-lg" />
                    <div className="skeleton h-4 w-20 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[18px] border-2 border-dashed border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50">
              <Package size={32} className="text-purple-400" />
            </div>
            <p className="font-extrabold text-slate-700 text-xl">No bookings found</p>
            <p className="mt-2 text-sm text-slate-500">{search ? "Try a different search term." : "Book a service to get started."}</p>
            {!search && (
              <Link href="/dashboard" className="mt-6 inline-flex items-center gap-2 rounded-[14px] bg-gradient-to-r from-[#6D28FF] to-[#8B5CF6] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                <Sparkles size={14} /> Browse services
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4 stagger">
            {filtered.map((b) => {
              const svc = typeof b.serviceId === "object" ? b.serviceId : null;
              const prov = typeof b.providerId === "object" ? b.providerId : null;
              return (
                <Link key={b._id} href={`/bookings/${b._id}`} className="block bg-white rounded-[18px] border border-slate-100/80 p-4 sm:p-5 hover:shadow-[0_16px_48px_rgba(109,40,255,0.06)] hover:-translate-y-1 hover:border-purple-200/50 transition-all duration-300">
                  <div className="flex gap-4">
                    <div className="hidden sm:block h-20 w-20 shrink-0 rounded-xl bg-slate-50 overflow-hidden border border-slate-100">
                      {svc?.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={svc.images[0]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-200"><Package size={24} /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-extrabold text-slate-900 truncate text-[0.95rem]">{svc?.name || "Service"}</p>
                          <p className="text-xs text-slate-500 mt-0.5 font-medium">{prov?.businessName || prov?.name || "Provider"}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase ${STATUS_COLORS[b.bookingStatus]}`}>
                          {b.bookingStatus.replace("_", " ")}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                        <span className="inline-flex items-center gap-1.5"><CalendarDays size={12} className="text-[var(--primary)]" /> {formatDate(b.date)}</span>
                        <span className="inline-flex items-center gap-1.5"><Clock size={12} className="text-[var(--primary)]" /> {b.startTime} – {b.endTime}</span>
                        <span className="inline-flex items-center gap-1.5"><MapPin size={12} className="text-[var(--primary)]" /> {b.address.city}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-base font-extrabold text-[var(--primary)]">₹{b.amount}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">ID: {b._id.slice(-8).toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-xl border border-slate-200 p-2.5 disabled:opacity-30 hover:bg-slate-50 hover:border-purple-200 transition-all"><ChevronLeft size={16} /></button>
            <span className="text-sm font-bold text-slate-600">Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-xl border border-slate-200 p-2.5 disabled:opacity-30 hover:bg-slate-50 hover:border-purple-200 transition-all"><ChevronRight size={16} /></button>
          </div>
        )}
    </div>
  );
}
