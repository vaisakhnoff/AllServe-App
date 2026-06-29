"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight, ShieldAlert,
  Image as ImageIcon, Search, Loader2, Tag, MapPin, Clock, X,
} from "lucide-react";
import toast from "react-hot-toast";
import { ProviderPortalShell } from "@/components/provider/ProviderPortalShell";
import { ServiceFormModal } from "@/components/provider/ServiceFormModal";
import { serviceService } from "@/services/service";
import { providerService } from "@/services/provider";
import { categoryService } from "@/services/category";
import { Service, CreateServiceDto, ServiceStatus, ServiceType } from "@/types/service.types";
import { Category } from "@/types/category.types";
import { getErrorMessage } from "@/utils/errorHandler";
import {
  getServiceTypeBadgeClass,
  getServiceTypeLabel,
  getServiceTypeEmoji,
  getDisplayPrice,} from "@/utils/serviceType.utils";

const STATUS_BADGE: Record<ServiceStatus, string> = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-slate-100 text-slate-600",
};

// ── Confirm Delete Modal ──────────────────────────────────────────────────────
function DeleteConfirmModal({
  serviceName,
  onConfirm,
  onClose,
  loading,
}: {
  serviceName: string;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-[800] text-slate-900">Delete Service</h3>
            <p className="mt-1 text-sm text-slate-600">
              Delete <span className="font-bold">&ldquo;{serviceName}&rdquo;</span>? This cannot be undone.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

interface LockedCategory {
  id: string;
  name: string;
  subcategories: string[];
  defaultDeliveryModel?: ServiceType;
}

export default function ProviderServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ServiceStatus>("");
  const [lockedCategory, setLockedCategory] = useState<LockedCategory | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await serviceService.list({
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      setServices(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      void fetchServices();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    const load = async () => {
      try {
        const [statusRes, catsRes] = await Promise.all([
          providerService.getApplicationStatus(),
          categoryService.getAll(),
        ]);
        const cat = statusRes.data.data?.category;
        if (!cat || typeof cat !== "object" || !("_id" in cat) || !cat._id) return;
        const catData = catsRes.data.data || catsRes.data;
        const cats: Category[] = (catData as { items?: Category[] }).items || (Array.isArray(catData) ? catData as Category[] : []);
        const id = String(cat._id);
        const full = cats.find((c) => c._id === id);
        setLockedCategory({
          id,
          name: full?.name ?? cat.name ?? "Your category",
          subcategories: full?.subcategories?.map((s) => s.name) ?? [],
          defaultDeliveryModel: full?.defaultDeliveryModel,
        });
      } catch {
        // Non-fatal: form will show "Approved category not set" hint and the
        // server will reject creates with a clear error.
      }
    };
    void load();
  }, []);

  const openCreate = () => {
    if (!lockedCategory) {
      toast.error("Your approved category isn't loaded yet. Please refresh.");
      return;
    }
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (svc: Service) => {
    if (svc.isBlocked) {
      toast.error("This service is blocked by an administrator");
      return;
    }
    setEditing(svc);
    setModalOpen(true);
  };

  const handleSubmit = async (dto: CreateServiceDto) => {
    setSaving(true);
    try {
      if (editing) {
        await serviceService.update(editing.id, dto);
        toast.success("Service updated");
      } else {
        await serviceService.create(dto);
        toast.success("Service created");
      }
      setModalOpen(false);
      setEditing(null);
      await fetchServices();
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to save service");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (svc: Service) => {
    if (svc.isBlocked) {
      toast.error("Cannot modify a blocked service");
      return;
    }
    setTogglingId(svc.id);
    try {
      if (svc.status === "active") {
        await serviceService.deactivate(svc.id);
        toast.success("Service deactivated");
      } else {
        await serviceService.activate(svc.id);
        toast.success("Service activated");
      }
      await fetchServices();
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to update service status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (svc: Service) => {
    setDeleteTarget(svc);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    setDeleteTarget(null);
    try {
      await serviceService.remove(deleteTarget.id);
      toast.success("Service deleted");
      setServices((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to delete service");
    } finally {
      setDeletingId(null);
    }
  };

  const counts = useMemo(() => {
    const total = services.length;
    const active = services.filter((s) => s.status === "active").length;
    const blocked = services.filter((s) => s.isBlocked).length;
    return { total, active, blocked };
  }, [services]);

  return (
    <ProviderPortalShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-indigo-600">Services</p>
          <h1 className="mt-2 text-2xl font-black text-slate-950">Manage your service catalog</h1>
          <p className="mt-1 text-sm text-slate-500">
            {counts.total} total · {counts.active} active{counts.blocked ? ` · ${counts.blocked} blocked by admin` : ""}
          </p>
        </div>
        <button onClick={openCreate} className="btn btn-primary px-4 py-2.5 text-sm">
          <Plus size={16} /> Add new service
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services by name, description, or tag"
            className="w-full rounded-lg border border-slate-200 bg-white px-9 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "" | ServiceStatus)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading services...</div>
      ) : services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Tag size={36} className="mx-auto text-slate-300" />
          <p className="mt-4 font-bold text-slate-600">No services yet</p>
          <p className="mt-1 text-sm text-slate-400">Add your first service to start receiving bookings.</p>
          <button onClick={openCreate} className="btn btn-primary mt-5 px-4 py-2 text-sm">
            <Plus size={14} /> Add service
          </button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {services.map((svc) => (
            <article key={svc.id} className="premium-card soft-hover overflow-hidden p-0">
              {/* Cover image */}
              <div className="relative h-40 w-full bg-slate-100">
                {svc.images.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={svc.images[0]} alt={svc.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <ImageIcon size={36} />
                  </div>
                )}
                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${STATUS_BADGE[svc.status]}`}
                  >
                    {svc.status}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                      svc.availabilityStatus === "available"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {svc.availabilityStatus}
                  </span>
                  {svc.isBlocked && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold uppercase text-red-700">
                      <ShieldAlert size={10} /> Blocked
                    </span>
                  )}
                </div>
                {/* Service-type badge – bottom-right corner */}
                <div className="absolute right-3 bottom-3">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm ${getServiceTypeBadgeClass((svc.deliveryModel ?? svc.serviceType) ?? "direct")}`}>
                    {getServiceTypeEmoji((svc.deliveryModel ?? svc.serviceType) ?? "direct")}{" "}
                    {getServiceTypeLabel((svc.deliveryModel ?? svc.serviceType) ?? "direct")}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-black text-slate-950">{svc.name}</h2>
                    {svc.category && (
                      <p className="mt-0.5 text-xs font-semibold text-indigo-600">{svc.category.name}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-2xl font-black text-slate-900">
                      {getDisplayPrice(svc.price, svc.pricingModel ?? "fixed", svc.priceUnit)}
                    </p>
                    {svc.estimatedProjectDays && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        ~{svc.estimatedProjectDays}d project
                      </p>
                    )}
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-slate-500">{svc.description}</p>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} />
                    {(svc.deliveryModel ?? svc.serviceType) === "inspection_required" ? `${svc.duration} min inspection` : `${svc.duration} min`}
                  </span>
                  {(svc.deliveryModel ?? svc.serviceType) === "inspection_required" && (
                    <span className="inline-flex items-center gap-1 text-blue-600">
                      {svc.freeInspection ? "Free inspection" : `₹${svc.inspectionFee} inspection fee`}
                    </span>
                  )}
                  {svc.serviceArea && (
                    <span className="inline-flex items-center gap-1 truncate max-w-[60%]">
                      <MapPin size={12} /> {svc.serviceArea}
                    </span>
                  )}
                </div>

                {svc.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {svc.tags.slice(0, 6).map((t) => (
                      <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => handleToggleActive(svc)}
                    disabled={togglingId === svc.id || svc.isBlocked}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {togglingId === svc.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : svc.status === "active" ? (
                      <ToggleRight size={14} className="text-emerald-500" />
                    ) : (
                      <ToggleLeft size={14} className="text-slate-400" />
                    )}
                    {svc.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => openEdit(svc)}
                    disabled={svc.isBlocked}
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-60"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(svc)}
                    disabled={deletingId === svc.id}
                    className="ml-auto inline-flex items-center gap-1 rounded-lg border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    {deletingId === svc.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ServiceFormModal
        open={modalOpen}
        initial={editing}
        lockedCategory={lockedCategory}
        saving={saving}
        onSubmit={handleSubmit}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
      />

      {deleteTarget && (
        <DeleteConfirmModal
          serviceName={deleteTarget.name}
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
          loading={deletingId === deleteTarget.id}
        />
      )}
    </ProviderPortalShell>
  );
}
