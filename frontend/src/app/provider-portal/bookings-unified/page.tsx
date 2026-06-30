"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Loader2, Clock, Calendar, MapPin, FileText,  ChevronRight,  ListFilter, Search,
} from "lucide-react";
import toast from "react-hot-toast";
import { ProviderPortalShell } from "@/components/provider/ProviderPortalShell";
import { orderService } from "@/services/order";
import {
  OrderStatusBadge,
  WarningAlert,
  
  
  
  WARNING_MESSAGES,
} from "@/components/provider/orders";
import { ServiceOrder, OrderDeliveryModel } from "@/types/order.types";
import { getErrorMessage } from "@/utils/errorHandler";

type ViewMode = "all" | "pending" | "active" | "completed";

const VIEW_MODES: { value: ViewMode; label: string; icon: string }[] = [
  { value: "all", label: "All", icon: "📋" },
  { value: "pending", label: "Pending / Quoting", icon: "⏰" },
  { value: "active", label: "In Progress", icon: "🚀" },
  { value: "completed", label: "Completed", icon: "✓" },
];

const DELIVERY_MODELS: { value: OrderDeliveryModel | ""; label: string; icon: string }[] = [
  { value: "", label: "All Types", icon: "📦" },
  { value: "direct", label: "Instant & Scheduled", icon: "⚡" },
  { value: "inspection_required", label: "Inspection First", icon: "🔍" },
  { value: "custom", label: "Service Requests (Custom)", icon: "📋" },
];

const STATUS_COLORS: Record<string, { dot: string; bg: string }> = {
  // Broadcast/Available statuses
  broadcast_open: { dot: "bg-purple-500", bg: "bg-purple-50 text-purple-700 border-purple-200" },
  receiving_quotations: { dot: "bg-blue-500", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  // Pending statuses
  awaiting_provider_response: { dot: "bg-yellow-500", bg: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  inspection_accepted: { dot: "bg-purple-500", bg: "bg-purple-50 text-purple-700 border-purple-200" },
  inspection_completed: { dot: "bg-purple-600", bg: "bg-purple-100 text-purple-800 border-purple-300" },
  quotation_accepted: { dot: "bg-indigo-500", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  // Active statuses
  accepted: { dot: "bg-blue-500", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  in_progress: { dot: "bg-blue-600", bg: "bg-blue-100 text-blue-800 border-blue-300" },
  // Completion statuses
  work_completed: { dot: "bg-green-500", bg: "bg-green-50 text-green-700 border-green-200" },
  awaiting_payment: { dot: "bg-indigo-500", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  completed: { dot: "bg-emerald-600", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  // Failure statuses
  rejected_by_provider: { dot: "bg-red-500", bg: "bg-red-50 text-red-700 border-red-200" },
  cancelled: { dot: "bg-slate-400", bg: "bg-slate-50 text-slate-700 border-slate-200" },
  dropped_by_provider: { dot: "bg-red-400", bg: "bg-red-50 text-red-600 border-red-200" },
};

export default function UnifiedBookingsPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [deliveryFilter, setDeliveryFilter] = useState<OrderDeliveryModel | "">("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Map view mode to status filters
  const getStatusForMode = (mode: ViewMode): string | undefined => {
    if (mode === "pending") return "awaiting_provider_response,quotation_submitted,quotation_accepted,inspection_accepted,inspection_completed,accepted";
    if (mode === "active") return "in_progress";
    if (mode === "completed") return "work_completed,awaiting_payment,completed";
    return undefined;
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = getStatusForMode(viewMode);
      const res = await orderService.getProviderOrders({
        ...(deliveryFilter ? { deliveryModel: deliveryFilter } : {}),
        ...(statusParam ? { status: statusParam } : {}),
        page,
        limit: 20,
      });

      let filteredOrders = res.data.data.items || [];

      // Client-side search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filteredOrders = filteredOrders.filter(
          (o) =>
            o.title?.toLowerCase().includes(term) ||
            o.description.toLowerCase().includes(term) ||
            o.orderId.toLowerCase().includes(term) ||
            o.address.city.toLowerCase().includes(term)
        );
      }

      setOrders(filteredOrders);
      setTotal(res.data.data.total);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [viewMode, deliveryFilter, searchTerm, page]);

  useEffect(() => {
    setPage(1); // Reset to first page when filters change
  }, [viewMode, deliveryFilter, searchTerm]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleAction = async (actionKey: string, orderId: string) => {
    try {
      if (actionKey === "start_work") {
        await orderService.customStartWork(orderId);
      } else if (actionKey === "complete_work") {
        await orderService.customCompleteWork(orderId);
      } else if (actionKey === "accept") {
        await orderService.acceptCustom(orderId);
      } else if (actionKey === "cancel") {
        await orderService.customDropByProvider(orderId, "No reason provided");
      }
      toast.success("Action completed successfully");
      fetchOrders();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };



  return (
    <ProviderPortalShell>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[2rem] font-[800] tracking-tight text-slate-950">Bookings & Orders</h1>
        <p className="mt-1 text-[15px] text-slate-500">Manage all your bookings and service orders</p>
      </div>

      {/* Quick Stats */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {VIEW_MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => setViewMode(mode.value)}
            className={`rounded-xl px-4 py-3 text-center transition-all ${
              viewMode === mode.value
                ? "bg-indigo-600 text-white shadow-lg"
                : "bg-white border border-slate-200 text-slate-700 hover:border-indigo-300"
            }`}
          >
            <div className="text-xl mb-1">{mode.icon}</div>
            <p className="text-xs font-bold">{mode.label}</p>
          </button>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="mb-6 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order ID, title, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
          />
        </div>

        {/* Delivery Model Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <ListFilter size={16} className="text-slate-400" />
          {DELIVERY_MODELS.map((model) => (
            <button
              key={model.value || "all"}
              onClick={() => setDeliveryFilter(model.value)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                deliveryFilter === model.value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
              }`}
            >
              {model.icon} {model.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
            <FileText size={40} className="text-slate-300" />
          </div>
          <p className="text-lg font-bold text-slate-700">
            {viewMode === "pending" ? "No pending orders" : "No orders found"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {viewMode === "all"
              ? "Your bookings will appear here"
              : `No ${viewMode} orders at the moment`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusCfg = STATUS_COLORS[order.status] || {
              dot: "bg-slate-400",
              bg: "bg-slate-50 text-slate-700 border-slate-200",
            };
            const isUrgent = order.status === "awaiting_provider_response" && order.subMode === "instant";

            return (
              <Link
                key={order._id}
                href={`/provider-portal/bookings/${order._id}`}
                className={`group block rounded-2xl border bg-white p-5 transition hover:shadow-md hover:-translate-y-0.5 ${
                  isUrgent ? "border-amber-300 ring-1 ring-amber-100 bg-amber-50/50" : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Status & Type Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <OrderStatusBadge order={order} size="sm" />
                      <span className="text-[10px] font-mono text-slate-400">{order.orderId}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-[15px] font-bold text-slate-900 line-clamp-2 leading-snug mb-2 group-hover:text-indigo-600 transition-colors">
                      {order.title || order.description.slice(0, 80)}
                    </h3>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-4 text-[12px] text-slate-600 mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {order.address.city}, {order.address.state}
                      </span>
                      {order.preferredDate && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {order.preferredDate}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>

                    {/* Warnings */}
                    {isUrgent && (
                      <WarningAlert
                        type="warning"
                        message={WARNING_MESSAGES.response_deadline}
                        dismissible={false}
                      />
                    )}
                  </div>

                  {/* Quick Action */}
                  <span className="shrink-0 flex items-center gap-1 text-indigo-600 group-hover:text-indigo-700 transition text-[12px] font-bold">
                    Open <ChevronRight size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-slate-500">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition"
          >
            Next
          </button>
        </div>
      )}
    </ProviderPortalShell>
  );
}
