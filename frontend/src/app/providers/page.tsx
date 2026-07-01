"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Search, Star, BadgeCheck,  ArrowUpRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { providerService } from "@/services/provider";
import { categoryService } from "@/services/category";
import { PublicProvider } from "@/types/provider.types";
import { Category } from "@/types/category.types";
import { getErrorMessage } from "@/utils/errorHandler";
import { RootState } from "@/store";

export default function ProvidersListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams?.get("categoryId") ?? "";
  const initialSearch = searchParams?.get("search") ?? "";
  const location = useSelector((state: RootState) => state.location);

  const [providers, setProviders] = useState<PublicProvider[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [categoryId, setCategoryId] = useState(initialCategory);

  useEffect(() => {
    categoryService.getAll()
      .then((res) => {
        const data = res.data.data || res.data;
        const cats = (data as { items?: Category[] }).items || (Array.isArray(data) ? data as Category[] : []);
        setCategories(cats);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params: Record<string, string | number> = {};
    if (search.trim()) params.search = search.trim();
    if (categoryId) params.categoryId = categoryId;
    if (location.isSet && location.latitude && location.longitude) {
      params.latitude = location.latitude;
      params.longitude = location.longitude;
      params.radius = 15;
    }
    const t = setTimeout(() => {
      providerService.getPublicProviders(params)
        .then((res) => { if (!cancelled) setProviders(res.data.data); })
        .catch((err) => { if (!cancelled) toast.error(getErrorMessage(err) || "Failed to load providers"); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [search, categoryId, location.latitude, location.longitude, location.isSet]);


  return (
    <div className="space-y-8 pb-12">
      {/* Compact header + inline filters */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-[2rem] font-[800] tracking-[-0.03em] text-[var(--text-primary)]">
            Find a professional
          </h1>
          <p className="mt-1 text-[15px] text-[var(--text-secondary)]">
            {location.isSet && location.label
              ? `Showing verified pros near ${location.label}`
              : "Browse verified professionals across all categories"}
          </p>
        </div>
        <div className="flex gap-2.5 lg:shrink-0">
          <div className="relative flex-1 lg:w-[280px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full rounded-2xl border border-[var(--border)] bg-white py-3 pl-10 pr-4 text-sm font-medium outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/8"
            />
          </div>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="cursor-pointer rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] outline-none transition focus:border-[var(--primary)]"
          >
            <option value="">All categories</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 size={28} className="animate-spin text-[var(--primary)]" />
        </div>
      ) : providers.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="mb-4 h-16 w-16 rounded-full bg-[var(--surface-3)] flex items-center justify-center">
            <Search size={24} className="text-[var(--text-muted)]" />
          </div>
          <p className="text-lg font-bold text-[var(--text-primary)]">No providers found</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Try a different search or category</p>
        </div>
      ) : (
        <>
          {/* Grid — all providers */}
          {providers.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {providers.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.35 }}
                >
                  <Link href={`/providers/${p.id}`}>
                    <div className="group relative flex h-full gap-4 rounded-[22px] border border-[var(--border)] bg-white p-5 transition-all duration-200 hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5">
                      {/* Avatar */}
                      <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--primary-light)] to-[var(--surface-3)] text-xl font-[800] text-[var(--primary)]">
                        {p.profileImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.profileImage} alt="" className="h-full w-full object-cover" />
                        ) : p.name[0]?.toUpperCase()}
                      </div>
                      {/* Info */}
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                          <p className="truncate text-[15px] font-bold text-[var(--text-primary)]">{p.name}</p>
                          <div className="mt-1.5 flex items-center gap-3 text-[12px] font-medium text-[var(--text-muted)]">
                            <span className="inline-flex items-center gap-1 text-amber-600"><Star size={12} fill="#D97706" strokeWidth={0} /> {p.rating?.toFixed(1) || "New"}</span>
                            <span className="inline-flex items-center gap-1 text-emerald-600"><BadgeCheck size={12} /> Verified</span>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-[var(--border-light)] pt-3">
                          <span className="text-[13px] font-[700] text-[var(--text-primary)]">
                            {p.price !== null ? `From ₹${p.price}` : "Get quote"}
                          </span>
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-3)] text-[var(--text-muted)] transition-all group-hover:bg-[var(--primary)] group-hover:text-white group-hover:rotate-[-45deg]">
                            <ArrowUpRight size={14} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
