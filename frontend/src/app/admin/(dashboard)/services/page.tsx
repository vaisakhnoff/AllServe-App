"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search, ShieldCheck, ShieldX, Loader2, Clock, MapPin,
  Image as ImageIcon, Briefcase, ChevronLeft, ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminService } from "@/services/admin";
import { Service, ServiceStatus } from "@/types/service.types";
import { getErrorMessage } from "@/utils/errorHandler";

const STATUS_BADGE: Record<ServiceStatus, string> = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-slate-100 text-slate-600",
};

const PAGE_SIZE = 12;

export default function AdminServicesPage() {
  const [items, setItems] = useState<Service[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ServiceStatus>("");
  const [blockedFilter, setBlockedFilter] = useState<"" | "true" | "false">("");
  const [actingId, setActingId] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getServices({
        page,
        limit: PAGE_SIZE,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(blockedFilter !== "" ? { isBlocked: blockedFilter === "true" } : {}),
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      });
      setItems(res.data.data.items);
      setTotal(res.data.data.total);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to load services");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, blockedFilter, debouncedSearch]);

  // Apply search query with debounce and reset page
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Refetch when page or active filters/search change
  useEffect(() => {
    const t = setTimeout(() => {
      void fetch();
    }, 300);
    return () => clearTimeout(t);
  }, [page, statusFilter, blockedFilter, debouncedSearch, fetch]);

  const handleBlock = async (svc: Service) => {
    if (!confirm(`Block "${svc.name}"? The provider will no longer be able to edit it.`)) return;
    setActingId(svc.id);
    try {
      await adminService.blockService(svc.id);
      toast.success("Service blocked");
      await fetch();
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to block service");
    } finally {
      setActingId(null);
    }
  };

  const handleUnblock = async (svc: Service) => {
    setActingId(svc.id);
    try {
      await adminService.unblockService(svc.id);
      toast.success("Service unblocked");
      await fetch();
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to unblock service");
    } finally {
      setActingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Services</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">All provider services</h1>
          <p className="mt-1 text-sm text-slate-500">{total} services total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services by name, description, or tag"
            className="w-full rounded-lg border border-slate-200 bg-white px-9 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as "" | ServiceStatus);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={blockedFilter}
          onChange={(e) => {
            setBlockedFilter(e.target.value as "" | "true" | "false");
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
        >
          <option value="">All</option>
          <option value="false">Not blocked</option>
          <option value="true">Blocked</option>
        </select>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading services...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Briefcase size={36} className="mx-auto text-slate-300" />
          <p className="mt-4 font-bold text-slate-600">No services match these filters</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {items.map((svc) => {
            const provider =
              typeof svc.providerId === "object" && svc.providerId !== null
                ? svc.providerId
                : null;
            return (
              <article key={svc.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="relative h-32 w-full bg-slate-100">
                  {svc.images.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={svc.images[0]} alt={svc.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <ImageIcon size={32} />
                    </div>
                  )}
                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_BADGE[svc.status]}`}>
                      {svc.status}
                    </span>
                    {svc.isBlocked && (
                      <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-red-700">
                        Blocked
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-black text-slate-950">{svc.name}</h2>
                      {svc.category && (
                        <p className="mt-0.5 text-xs font-semibold text-indigo-600">{svc.category.name}</p>
                      )}
                      {provider && (
                        <p className="mt-1 truncate text-xs text-slate-500">
                          by <span className="font-semibold text-slate-700">{provider.businessName ?? provider.name ?? provider.id}</span>
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-lg font-black text-slate-900">₹{svc.price.toFixed(0)}</p>
                  </div>

                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">{svc.description}</p>

                  <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} /> {svc.duration} min
                    </span>
                    {svc.serviceArea && (
                      <span className="inline-flex items-center gap-1 truncate max-w-[60%]">
                        <MapPin size={12} /> {svc.serviceArea}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
                    {svc.isBlocked ? (
                      <button
                        onClick={() => handleUnblock(svc)}
                        disabled={actingId === svc.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {actingId === svc.id ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                        Unblock
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBlock(svc)}
                        disabled={actingId === svc.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {actingId === svc.id ? <Loader2 size={12} className="animate-spin" /> : <ShieldX size={12} />}
                        Block
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && items.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-xs font-semibold text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
