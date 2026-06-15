"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { ArrowLeft, Search, Star, BadgeCheck, MapPin } from "lucide-react";
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
    categoryService
      .getAll()
      .then((res) => {
        const data = res.data.data || res.data;
        const categories = data.items || (Array.isArray(data) ? data : []);
        setCategories(categories);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params: Record<string, any> = {};
    if (search.trim()) params.search = search.trim();
    if (categoryId) params.categoryId = categoryId;
    if (location.isSet && location.latitude && location.longitude) {
      params.latitude = location.latitude;
      params.longitude = location.longitude;
      params.radius = 15;
    }

    const t = setTimeout(() => {
      providerService
        .getPublicProviders(params)
        .then((res) => {
          if (!cancelled) setProviders(res.data.data);
        })
        .catch((err) => {
          if (!cancelled) toast.error(getErrorMessage(err) || "Failed to load providers");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, categoryId, location.latitude, location.longitude, location.isSet]);

  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      {/* Premium banner */}
      <section className="relative overflow-hidden border-b border-slate-200/40">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/90 via-white to-violet-50/70" />
        <div className="absolute top-[-100px] right-[-80px] w-[420px] h-[420px] bg-gradient-to-bl from-purple-200/25 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-[-40px] left-[-40px] w-[280px] h-[280px] bg-gradient-to-tr from-violet-200/20 to-transparent rounded-full blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[var(--primary)] transition-colors"
          >
            <ArrowLeft size={15} /> Back
          </button>

          <header>
            <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold tracking-tight text-slate-950">
              Approved <span className="bg-gradient-to-r from-[#6D28FF] to-[#A855F7] bg-clip-text text-transparent">professionals</span>
            </h1>
            {location.isSet && location.label && (
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                <MapPin size={12} /> Near {location.label}
              </p>
            )}
          </header>

          {/* Filters */}
          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_240px]">
            <div className="relative">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search providers..."
                className="w-full rounded-2xl border border-slate-200/80 bg-white pl-12 pr-4 py-3 text-sm font-medium outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/8 shadow-sm transition-all"
              />
            </div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/8 shadow-sm transition-all"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-[18px] border border-slate-100 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="skeleton h-14 w-14 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-28" />
                    <div className="skeleton h-3 w-16" />
                  </div>
                </div>
                <div className="mt-4 flex justify-between">
                  <div className="skeleton h-3 w-12" />
                  <div className="skeleton h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="rounded-[18px] border-2 border-dashed border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50">
              <Search size={26} className="text-purple-400" />
            </div>
            <p className="font-bold text-slate-700 text-lg">No providers match your filters</p>
            <p className="mt-1.5 text-sm text-slate-500">Try adjusting your search or category.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger">
            {providers.map((p) => (
              <Link
                key={p.id}
                href={`/providers/${p.id}`}
                className="group bg-white rounded-[18px] border border-slate-100/80 p-5 hover:shadow-[0_20px_60px_rgba(109,40,255,0.08)] hover:-translate-y-1 hover:border-purple-200/60 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 text-[var(--primary)] font-extrabold text-xl overflow-hidden ring-1 ring-purple-100 group-hover:ring-purple-200 transition-all">
                    {p.profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.profileImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (p.name ?? "?").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-extrabold text-slate-950 group-hover:text-[var(--primary)] transition-colors">
                      {p.name}
                    </p>
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                      <BadgeCheck size={11} /> Verified
                    </span>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold">
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <Star size={13} fill="#d97706" strokeWidth={0} /> {p.rating || "New"}
                  </span>
                  <span className="font-extrabold text-slate-900">
                    {p.price !== null ? `from ₹${p.price.toFixed(0)}` : "Quote"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
