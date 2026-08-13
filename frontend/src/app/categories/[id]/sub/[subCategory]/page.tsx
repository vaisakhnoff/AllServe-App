"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  ArrowLeft, Search, Loader2, Star, Clock, Tag, Image as ImageIcon,
  ChevronRight, MapPin, SlidersHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";
import { serviceService } from "@/services/service";
import { Service } from "@/types/service.types";
import { getErrorMessage } from "@/utils/errorHandler";
import { RootState } from "@/store";
import { Role } from "@/enums/role.enum";
import { UserShell } from "@/components/layout/UserShell";

const SORT_OPTIONS = [
  { value: "recent", label: "Most recent" },
  { value: "priceAsc", label: "Price: low → high" },
  { value: "priceDesc", label: "Price: high → low" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export default function SubCategoryServicesPage() {
  const params = useParams<{ id: string; subCategory: string }>();
  const router = useRouter();
  const location = useSelector((state: RootState) => state.location);

  const categoryId = params?.id;
  const subCategory = params?.subCategory ? decodeURIComponent(params.subCategory) : "";

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState<SortValue>("recent");
  const [providerFilter, setProviderFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Derive provider list from results
  const providers = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    services.forEach((s) => {
      if (s.providerId && typeof s.providerId === "object") {
        const ref = s.providerId;
        if (!map.has(ref.id)) map.set(ref.id, { id: ref.id, name: ref.businessName ?? ref.name ?? "Provider" });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [services]);

  useEffect(() => {
    if (!categoryId || !subCategory) return;
    let cancelled = false;

    const fetchServices = async () => {
      setLoading(true);
      try {
        const res = await serviceService.publicList({
          categoryId,
          subCategory,
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(minPrice !== "" ? { minPrice: Number(minPrice) } : {}),
          ...(maxPrice !== "" ? { maxPrice: Number(maxPrice) } : {}),
          ...(location.isSet && location.latitude && location.longitude ? { latitude: location.latitude, longitude: location.longitude, radius: 15 } : {}),
          sortBy,
          limit: 50,
        });
        if (!cancelled) setServices(res.data.data.items);
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err) || "Failed to load services");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const t = setTimeout(fetchServices, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [categoryId, subCategory, search, minPrice, maxPrice, sortBy, location.latitude, location.longitude, location.isSet]);

  const visible = providerFilter
    ? services.filter((s) => typeof s.providerId === "object" && s.providerId !== null && s.providerId.id === providerFilter)
    : services;

  const hasActiveFilters = minPrice !== "" || maxPrice !== "" || providerFilter !== "";

  return (
    <UserShell>

    <div className="pb-12 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="group inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
          </button>
          <div>
            <p className="text-[10px] font-bold text-[#00B761] uppercase tracking-wider">Sub-category</p>
            <h1 className="text-xl font-extrabold text-slate-900 leading-tight mt-0.5">{subCategory}</h1>
          </div>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            hasActiveFilters
              ? "bg-[#E6F7F0] border-[#99E2C0] text-[#009E52]"
              : "bg-white border-slate-200 text-slate-600 hover:border-[#00B761] hover:bg-slate-50"
          }`}
        >
          <SlidersHorizontal size={13} />
          <span>Filters</span>
          {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#00B761]" />}
        </button>
      </div>

      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services in this sub-category..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-sm font-medium outline-none focus:border-[#00B761] focus:ring-2 focus:ring-[#00B761]/10 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Expandable Filters Panel */}
        {showFilters && (
          <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filters & Sort</h3>
              {hasActiveFilters && (
                <button
                  onClick={() => { setMinPrice(""); setMaxPrice(""); setProviderFilter(""); }}
                  className="text-xs font-bold text-red-500 hover:text-red-600 transition cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Min Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-[#00B761] transition"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Max Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Any"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-[#00B761] transition"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortValue)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-[#00B761] transition cursor-pointer"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Provider chips */}
            {providers.length > 0 && (
              <div className="pt-2 border-t border-slate-50">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Filter by provider</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setProviderFilter("")}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                      providerFilter === ""
                        ? "bg-[#00B761] text-white shadow-xs"
                        : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    All
                  </button>
                  {providers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setProviderFilter(p.id === providerFilter ? "" : p.id)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                        providerFilter === p.id
                          ? "bg-[#00B761] text-white shadow-xs"
                          : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Count */}
        {!loading && (
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {visible.length} service{visible.length !== 1 ? "s" : ""} found
          </p>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-[#00B761]" />
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <Tag size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="font-extrabold text-slate-800 text-base">No services found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visible.map((svc) => {
              const provider = typeof svc.providerId === "object" && svc.providerId !== null ? svc.providerId : null;
              return (
                <Link
                  key={svc.id}
                  href={`/services/${svc.id}`}
                  className="group flex overflow-hidden rounded-2xl border border-slate-100 bg-white hover:shadow-md hover:border-[#00B761]/30 transition-all duration-200"
                >
                  <div className="relative h-32 w-32 shrink-0 bg-slate-50 overflow-hidden sm:h-36 sm:w-36">
                    {svc.images.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={svc.images[0]}
                        alt={svc.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon size={24} className="text-slate-300" />
                      </div>
                    )}
                    {svc.location?.city && (
                      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-xs rounded-lg px-2 py-0.5 flex items-center gap-1 shadow-2xs">
                        <MapPin size={9} className="text-[#00B761]" />
                        <span className="text-[9px] font-bold text-slate-700">{svc.location.city}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4 sm:p-5 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-[#00B761] transition-colors">{svc.name}</h3>
                      <p className="shrink-0 text-base font-black text-slate-950">₹{svc.price.toFixed(0)}</p>
                    </div>
                    {provider && (
                      <p className="mt-0.5 truncate text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        by {provider.businessName ?? provider.name}
                      </p>
                    )}
                    <p className="mt-2 line-clamp-2 text-xs text-slate-500 leading-relaxed">{svc.description}</p>
                    <div className="mt-auto flex items-center gap-3 pt-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} className="text-[#00B761]" /> {svc.duration} min
                      </span>
                      {provider && (provider as { rating?: number }).rating != null && (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <Star size={11} fill="#d97706" strokeWidth={0} /> {(provider as { rating?: number }).rating}
                        </span>
                      )}
                      <span className="ml-auto inline-flex items-center gap-1 text-[#00B761] group-hover:translate-x-0.5 transition-transform font-bold text-xs capitalize normal-case">
                        View Details <ChevronRight size={11} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  </UserShell>
  );
}
