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
import { LoginRequiredPrompt } from "@/components/auth/LoginRequiredPrompt";

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
  const { isAuthenticated, isInitialized, role } = useSelector((state: RootState) => state.auth);
  const canViewDetails = isInitialized && isAuthenticated && role === Role.USER;

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
    if (!categoryId || !subCategory || !canViewDetails) return;
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
  }, [categoryId, subCategory, search, minPrice, maxPrice, sortBy, location.latitude, location.longitude, location.isSet, canViewDetails]);

  const visible = providerFilter
    ? services.filter((s) => typeof s.providerId === "object" && s.providerId !== null && s.providerId.id === providerFilter)
    : services;

  const hasActiveFilters = minPrice !== "" || maxPrice !== "" || providerFilter !== "";

  if (isInitialized && !canViewDetails) {
    return (
      <LoginRequiredPrompt
        title="Login to view services"
        message="Please login or sign up to browse services inside this sub-category."
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f9fc]">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Sub-category</p>
            <h1 className="text-lg font-extrabold text-slate-900 truncate">{subCategory}</h1>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-semibold transition-all ${
              hasActiveFilters
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-200"
            }`}
          >
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-sm font-medium outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all"
            />
          </div>
        </div>

        {/* Expandable Filters Panel */}
        {showFilters && (
          <div className="mb-5 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">Filters & Sort</h3>
              {hasActiveFilters && (
                <button
                  onClick={() => { setMinPrice(""); setMaxPrice(""); setProviderFilter(""); }}
                  className="text-xs font-semibold text-red-500 hover:text-red-600"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Min Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Max Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Any"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortValue)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Provider chips */}
            {providers.length > 0 && (
              <div className="mt-4">
                <label className="text-xs font-semibold text-slate-500 mb-2 block">Filter by provider</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setProviderFilter("")}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      providerFilter === "" ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All
                  </button>
                  {providers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setProviderFilter(p.id === providerFilter ? "" : p.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                        providerFilter === p.id ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
          <p className="text-sm font-semibold text-slate-500 mb-4">
            {visible.length} service{visible.length !== 1 ? "s" : ""} found
          </p>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-indigo-500" />
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-14 text-center">
            <Tag size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="font-bold text-slate-600 text-lg">No services found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or location.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visible.map((svc) => {
              const provider = typeof svc.providerId === "object" && svc.providerId !== null ? svc.providerId : null;
              return (
                <Link
                  key={svc.id}
                  href={`/services/${svc.id}`}
                  className="group flex overflow-hidden rounded-2xl border border-slate-100 bg-white hover:shadow-2xl hover:shadow-indigo-500/[0.06] hover:-translate-y-1 hover:border-indigo-200 transition-all duration-200"
                >
                  <div className="relative h-36 w-36 shrink-0 bg-slate-100 sm:h-40 sm:w-44">
                    {svc.images.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={svc.images[0]} alt={svc.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon size={28} className="text-slate-300" />
                      </div>
                    )}
                    {svc.location?.city && (
                      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-0.5 flex items-center gap-1">
                        <MapPin size={10} className="text-indigo-500" />
                        <span className="text-[10px] font-semibold text-slate-700">{svc.location.city}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-700 transition-colors">{svc.name}</h3>
                      <p className="shrink-0 text-lg font-extrabold text-slate-900">₹{svc.price.toFixed(0)}</p>
                    </div>
                    {provider && (
                      <p className="mt-1 truncate text-xs font-semibold text-indigo-600">
                        by {provider.businessName ?? provider.name}
                      </p>
                    )}
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500 leading-relaxed">{svc.description}</p>
                    <div className="mt-auto flex items-center gap-3 pt-3 text-xs font-semibold text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} /> {svc.duration} min
                      </span>
                      {provider && (provider as { rating?: number }).rating != null && (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <Star size={12} fill="#d97706" strokeWidth={0} /> {(provider as { rating?: number }).rating}
                        </span>
                      )}
                      <span className="ml-auto inline-flex items-center gap-1 text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                        View <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
