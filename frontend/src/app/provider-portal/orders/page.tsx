"use client";

import { useEffect, useState } from "react";
import {
  Loader2, CheckCircle2, XCircle, Clock, Zap, Calendar, MapPin,
  FileText, ChevronRight, AlertCircle, Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import { ProviderPortalShell } from "@/components/provider/ProviderPortalShell";
import { orderService } from "@/services/order";
import { ServiceOrder, OrderDeliveryModel } from "@/types/order.types";
import { getErrorMessage } from "@/utils/errorHandler";

const STATUS_COLORS: Record<string, string> = {
  awaiting_provider_response: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected_by_provider: "bg-red-50 text-red-600 border-red-200",
  provider_unresponsive: "bg-slate-100 text-slate-600 border-slate-200",
  awaiting_payment: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
  cancelled_with_refund: "bg-slate-100 text-slate-500 border-slate-200",
  inspection_pending: "bg-blue-50 text-blue-700 border-blue-200",
  quotation_submitted: "bg-indigo-50 text-indigo-700 border-indigo-200",
  quotation_accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  awaiting_advance: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  awaiting_final_payment: "bg-indigo-50 text-indigo-700 border-indigo-200",
  broadcast_open: "bg-purple-50 text-purple-700 border-purple-200",
  receiving_quotations: "bg-purple-50 text-purple-700 border-purple-200",
  expired: "bg-slate-100 text-slate-500 border-slate-200",
};

const MODEL_BADGES: Record<OrderDeliveryModel, { label: string; emoji: string; color: string }> = {
  direct: { label: "Direct", emoji: "⚡", color: "bg-emerald-50 text-emerald-700" },
  inspection_required: { label: "Inspection", emoji: "🏠", color: "bg-blue-50 text-blue-700" },
  custom: { label: "Custom", emoji: "🎨", color: "bg-purple-50 text-purple-700" },
};

export default function ProviderOrdersPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderDeliveryModel | "">("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderService.getProviderOrders({
        ...(filter ? { deliveryModel: filter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        page,
        limit: 20,
      });
      const data = res.data.data;
      setOrders(data.items);
      setTotal(data.total);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [filter, statusFilter, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAccept = async (id: string) => {
    setActionLoading(id);
    try {
      await orderService.accept(id);
      toast.success("Order accepted");
      fetchOrders();
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to accept");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Reject this order? The customer will be notified.")) return;
    setActionLoading(id);
    try {
      await orderService.reject(id);
      toast.success("Order rejected");
      fetchOrders();
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to reject");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  return (
    <ProviderPortalShell>
      <div className="mb-6">
        <p className="text-sm font-bold text-indigo-600">Orders</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Service Orders</h1>
        <p className="mt-1 text-sm text-slate-500">
          View and manage incoming service requests ({total} total)
        </p>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-3">
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
            <option value="awaiting_provider_response">Awaiting Response</option>
            <option value="accepted">Accepted</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="animate-spin text-indigo-500" size={28} />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <FileText size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="font-bold text-slate-600">No orders found</p>
          <p className="text-sm text-slate-400 mt-1">Orders from customers will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const badge = MODEL_BADGES[order.deliveryModel];
            const isAwaiting = order.status === "awaiting_provider_response";
            const isInstant = order.subMode === "instant";

            return (
              <article key={order._id} className={`premium-card overflow-hidden transition-all ${
                isAwaiting ? "ring-2 ring-amber-200 ring-offset-1" : ""
              }`}>
                <div className="p-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badge.color}`}>
                        {badge.emoji} {badge.label}
                      </span>
                      {order.subMode && (
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          isInstant ? "bg-orange-50 text-orange-700" : "bg-sky-50 text-sky-700"
                        }`}>
                          {isInstant ? <><Zap size={10} className="inline" /> Instant</> : <><Calendar size={10} className="inline" /> Scheduled</>}
                        </span>
                      )}
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                        STATUS_COLORS[order.status] || "bg-slate-50 text-slate-600"
                      }`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">
                      {order.orderId}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {order.title || order.description.slice(0, 80)}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">{order.description}</p>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    {order.preferredDate && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} /> {formatDate(order.preferredDate)}
                        {order.preferredTime && ` at ${order.preferredTime}`}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} /> {order.address.city}, {order.address.state}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} /> {formatDate(order.createdAt)}
                    </span>
                  </div>

                  {/* Instant timer warning */}
                  {isAwaiting && isInstant && order.responseDeadline && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                      <AlertCircle size={14} className="text-amber-600 shrink-0" />
                      <p className="text-xs font-semibold text-amber-700">
                        Respond within 30 minutes or the request will be auto-cancelled
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {isAwaiting && (
                    <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
                      <button
                        onClick={() => handleAccept(order._id)}
                        disabled={actionLoading === order._id}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-all"
                      >
                        {actionLoading === order._id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(order._id)}
                        disabled={actionLoading === order._id}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100 disabled:opacity-50 transition-all"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                      <ChevronRight size={16} className="ml-auto text-slate-300" />
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">Page {page} of {Math.ceil(total / 20)}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </ProviderPortalShell>
  );
}
