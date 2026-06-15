"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { adminService } from "@/services/admin";
import { Booking, BookingStatus } from "@/types/booking.types";
import { DataTable, ColumnDef } from "@/components/common/DataTable";
import toast from "react-hot-toast";

const LIMIT = 20;

const statusBadgeClass = (status: BookingStatus) => {
  switch (status) {
    case "completed": return "active";
    case "cancelled": case "rejected": return "blocked";
    default: return "pending";
  }
};

const getUserName   = (b: Booking) => typeof b.userId   === "object" ? b.userId.name : b.userId;
const getProviderName = (b: Booking) => typeof b.providerId === "object" ? (b.providerId.businessName || b.providerId.name) : b.providerId;
const getServiceName  = (b: Booking) => typeof b.serviceId  === "object" ? b.serviceId.name : b.serviceId;

const columns: ColumnDef<Booking>[] = [
  {
    header: "Booking ID",
    cell: (b) => (
      <span style={{ fontWeight: 600, color: "#4f46e5", fontSize: "0.75rem" }}>
        {b._id.slice(-6).toUpperCase()}
      </span>
    ),
  },
  {
    header: "User",
    cell: (b) => <span style={{ color: "#0f172a", fontWeight: 500 }}>{getUserName(b)}</span>,
  },
  {
    header: "Provider",
    cell: (b) => <span style={{ color: "#334155" }}>{getProviderName(b)}</span>,
  },
  {
    header: "Service",
    cell: (b) => <span style={{ color: "#334155" }}>{getServiceName(b)}</span>,
  },
  {
    header: "Date & Amount",
    cell: (b) => (
      <>
        <div style={{ color: "#0f172a", fontWeight: 600 }}>₹{b.amount}</div>
        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
          {new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      </>
    ),
  },
  {
    header: "Status",
    cell: (b) => (
      <span className={`admin-badge ${statusBadgeClass(b.bookingStatus)}`}>
        {b.bookingStatus.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}
      </span>
    ),
  },
];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const totalPages = Math.ceil(total / LIMIT);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getBookings({
        ...(status ? { status } : {}),
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
        page,
        limit: LIMIT,
      });
      const data = res.data.data;
      setBookings(data.items);
      setTotal(data.total);
    } catch {
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  }, [status, debouncedSearch, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#0f172a" }}>Bookings Management</h1>
        <p style={{ color: "#64748b", marginTop: "0.25rem" }}>View and manage all platform bookings</p>
      </div>

      <div className="admin-card">
        {/* Toolbar */}
        <div style={{ padding: "1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <form onSubmit={handleSearch} style={{ position: "relative", width: "300px" }}>
            <Search size={18} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              className="admin-input"
              placeholder="Search by ID, user, provider..."
              style={{ paddingLeft: "2.5rem" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <span style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Filter size={16} /> Filter:
            </span>
            <select
              className="admin-input"
              style={{ width: "160px" }}
              value={status}
              onChange={(e) => { setStatus(e.target.value as BookingStatus | ""); setPage(1); }}
            >
              <option value="">All Bookings</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={bookings}
          rowKey={(b) => b._id}
          isLoading={loading}
          emptyMessage="No bookings found."
          footer={
            totalPages > 1 ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>
                  Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
                </span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="admin-btn-secondary"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    style={{ padding: "0.4rem 0.75rem" }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ padding: "0.4rem 0.75rem", fontSize: "0.875rem", fontWeight: 500 }}>
                    {page} / {totalPages}
                  </span>
                  <button
                    className="admin-btn-secondary"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    style={{ padding: "0.4rem 0.75rem" }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ) : null
          }
        />
      </div>
    </div>
  );
}
