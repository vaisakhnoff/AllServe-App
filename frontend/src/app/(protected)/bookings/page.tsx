"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2, FileText, Zap, Calendar, MapPin, Clock, Filter,
  RefreshCw, Ban, ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { orderService } from "@/services/order";
import { ServiceOrder, OrderDeliveryModel } from "@/types/order.types";
import { getErrorMessage } from "@/utils/errorHandler";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  awaiting_provider_response: { label: "Waiting for provider", color: "bg-amber-50 text-amber-700" },
  accepted: { label: "Accepted", color: "bg-emerald-50 text-emerald-700" },
  rejected_by_provider: { label: "Rejected", color: "bg-red-50 text-red-600" },
  provider_unresponsive: { label: "No response", color: "bg-slate-100 text-slate-600" },
  awaiting_payment: { label: "Invoice ready", color: "bg-blue-50 text-blue-700" },
  completed: { label: "Completed", color: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Cancelled", color: "bg-slate-100 text-slate-500" },
  cancelled_with_refund: { label: "Refunded", color: "bg-slate-100 text-slate-500" },
  inspection_pending: { label: "Inspection pending", color: "bg-blue-50 text-blue-700" },
  quotation_submitted: { label: "Quote received", color: "bg-indigo-50 text-indigo-700" },
  quotation_accepted: { label: "Quote accepted", color: "bg-emerald-50 text-emerald-700" },
  awaiting_advance: { label: "Advance pending", color: "bg-amber-50 text-amber-700" },
  in_progress: { label: "In progress", color: "bg-blue-50 text-blue-700" },
  awaiting_final_payment: { label: "Payment pending", color: "bg-indigo-50 text-indigo-700" },
  broadcast_open: { label: "Receiving quotes", color: "bg-purple-50 text-purple-700" },
  receiving_quotations: { label: "Receiving quotes", color: "bg-purple-50 text-purple-700" },
  expired: { label: "Expired", color: "bg-slate-100 text-slate-500" },
};

const MODEL_INFO: Record<OrderDeliveryModel, { label: string; emoji: string; color: string }> = {
  direct: { label: "Direct", emoji: "⚡", color: "bg-emerald-50 text-emerald-700" },
  inspection_required: { label: "Inspection", emoji: "🏠", color: "bg-blue-50 text-blue-700" },
  custom: { label: "Custom", emoji: "🎨", color: "bg-purple-50 text-purple-700" },
};

export default function BookingsPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderDeliveryModel | "">("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderService.getMyOrders({
        ...(filter ? { deliveryModel: filter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        page,
        limit: 20,
      });
      setOrders(res.data.data.items);
      setTotal(res.data.data.total);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [filter, statusFilter, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCustomerChoice = async (orderId: string, choice: "reroute" | "refund") => {
    try {
      await orderService.customerChoice(orderId, { choice });
      toast.success(choice === "refund" ? "Refund initiated" : "Looking for another provider...");
      fetchOrders();
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to process");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-950">My Bookings</h1>
        <p className="mt-1 text-sm text-slate-500">
          All your service requests in one place — {total} total
        </p>
      </div>

      {/* Filters */}
      <div className="mb-5 flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <Filter size={14} className="text-slate-400" />
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value as OrderDeliveryModel | ""); setPage(1); }}
            className="bg-transparent text-sm font-semibold outline-none"
          >
            <option value="">All types</option>
            <option value="direct">⚡ Direct</option>
            <option value="inspection_required">🏠 Inspection</option>
            <option value="custom">🎨 Custom</option>
          </select>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-transparent text-sm font-semibold outline-none"
          >
            <option value="">All statuses</option>
            <option value="awaiting_provider_response">Waiting</option>
            <option value="accepted">Accepted</option>
            <option value="in_progress">In Progress</option>
            <option value="awaiting_payment">Invoice Ready</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="animate-spin text-indigo-500" size={28} />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <FileText size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="font-bold text-slate-600 text-lg">No bookings yet</p>
          <p className="text-sm text-slate-400 mt-1">Browse services and make your first request!</p>
          <Link href="/dashboard" className="btn btn-primary mt-5 px-5 py-2.5 text-sm inline-flex">
            Browse Services
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const model = MODEL_INFO[order.deliveryModel];
            const statusCfg = STATUS_CONFIG[order.status] || { label: order.status, color: "bg-slate-50 text-slate-600" };
            const needsChoice = ["rejected_by_provider", "provider_unresponsive"].includes(order.status);
            const hasAction = ["awaiting_payment", "awaiting_final_payment", "quotation_submitted"].includes(order.status);

            return (
              <Link key={order._id} href={`/bookings/${order._id}`} className="block">
                <article className={`premium-card overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 ${needsChoice ? "ring-2 ring-amber-200" : ""}`}>
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${model.color}`}>
                          {model.emoji} {model.label}
                        </span>
                        {order.subMode && (
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            order.subMode === "instant" ? "bg-orange-50 text-orange-700" : "bg-sky-50 text-sky-700"
                          }`}>
                            {order.subMode === "instant" ? "Instant" : "Scheduled"}
                          </span>
                        )}
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">{order.orderId}</span>
                        <ChevronRight size={14} className="text-slate-300" />
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-sm text-slate-700 font-semibold mb-2 line-clamp-2">
                      {order.title || order.description}
                    </p>

                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      {order.preferredDate && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={11} /> {new Date(order.preferredDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          {order.preferredTime && ` ${order.preferredTime}`}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={11} /> {order.address.city}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} /> {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>

                    {/* Action needed indicator */}
                    {hasAction && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                        <p className="text-xs font-semibold text-indigo-700">Action needed — tap to view</p>
                      </div>
                    )}

                    {/* Customer choice needed */}
                    {needsChoice && (
                      <div className="mt-3 flex items-center gap-3" onClick={(e) => e.preventDefault()}>
                        <button
                          onClick={(e) => { e.preventDefault(); handleCustomerChoice(order._id, "reroute"); }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                        >
                          <RefreshCw size={12} /> Try another
                        </button>
                        <button
                          onClick={(e) => { e.preventDefault(); handleCustomerChoice(order._id, "refund"); }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          <Ban size={12} /> Refund
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border px-3 py-1.5 text-sm font-semibold disabled:opacity-40">Previous</button>
          <span className="text-sm text-slate-500">Page {page} of {Math.ceil(total / 20)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 20)} className="rounded-lg border px-3 py-1.5 text-sm font-semibold disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
