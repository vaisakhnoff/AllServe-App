"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { ArrowLeft, ChevronRight, Layers } from "lucide-react";
import { categoryService } from "@/services/category";
import { Category } from "@/types/category.types";
import { getErrorMessage } from "@/utils/errorHandler";
import toast from "react-hot-toast";
import { RootState } from "@/store";
import { Role } from "@/enums/role.enum";
import { LoginRequiredPrompt } from "@/components/auth/LoginRequiredPrompt";

export default function CategoryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const { isAuthenticated, isInitialized, role } = useSelector((state: RootState) => state.auth);
  const canViewDetails = isInitialized && isAuthenticated && role === Role.USER;
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !canViewDetails) return;
    let cancelled = false;
    setLoading(true);
    categoryService
      .getAll()
      .then((res) => {
        if (cancelled) return;
        const categories = res.data?.data?.items ?? [];
        const found = categories.find((c) => c._id === id) ?? null;
        setCategory(found);
      })
      .catch((err) => toast.error(getErrorMessage(err) || "Failed to load category"))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, canViewDetails]);

  if (isInitialized && !canViewDetails) {
    return (
      <LoginRequiredPrompt
        title="Login to view category"
        message="Please login or sign up to open categories and browse their sub-categories."
      />
    );
  }

  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      {/* Premium gradient banner */}
      <section className="relative overflow-hidden border-b border-slate-200/40">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/90 via-white to-violet-50/70" />
        <div className="absolute top-[-100px] right-[-80px] w-[420px] h-[420px] bg-gradient-to-bl from-purple-200/25 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-[-40px] left-[-40px] w-[280px] h-[280px] bg-gradient-to-tr from-violet-200/20 to-transparent rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
          <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[var(--primary)] transition-colors">
            <ArrowLeft size={15} /> Back
          </button>

          {loading ? (
            <div className="space-y-3">
              <div className="skeleton h-4 w-24 rounded-lg" />
              <div className="skeleton h-10 w-64 rounded-lg" />
              <div className="skeleton h-4 w-80 rounded-lg" />
            </div>
          ) : category ? (
            <header className="fade-up">
              <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold tracking-tight text-slate-950">{category.name}</h1>
              {category.description && (
                <p className="mt-2 max-w-xl text-slate-500 leading-relaxed text-sm sm:text-base">{category.description}</p>
              )}
            </header>
          ) : null}
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-[18px] border border-slate-100 bg-white overflow-hidden">
                <div className="skeleton h-36 w-full rounded-none" />
                <div className="p-6 space-y-2.5">
                  <div className="skeleton h-5 w-28 rounded-lg" />
                  <div className="skeleton h-3.5 w-44 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : !category ? (
          <div className="rounded-[18px] border-2 border-dashed border-slate-200 bg-white p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
              <Layers size={24} className="text-purple-400" />
            </div>
            <p className="font-bold text-slate-600 text-lg">Category not found</p>
            <Link href="/dashboard" className="mt-4 inline-block text-sm font-bold text-[var(--primary)] hover:underline">
              Back to dashboard
            </Link>
          </div>
        ) : (
          <>
            <h2 className="mb-4 flex items-center gap-2.5 text-xl font-extrabold text-slate-900 tracking-tight">
              <Layers size={20} className="text-[var(--primary)]" />
              Browse sub-categories
            </h2>

            {(!category.subcategories || category.subcategories.length === 0) ? (
              <div className="rounded-[18px] border-2 border-dashed border-slate-200 bg-white p-10 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50">
                  <Layers size={28} className="text-purple-400" />
                </div>
                <p className="font-bold text-slate-700 text-lg">No sub-categories yet</p>
                <p className="mt-1.5 text-sm text-slate-500">Browse all approved providers in this category instead.</p>
                <Link
                  href={`/providers?categoryId=${category._id}`}
                  className="mt-6 inline-flex items-center gap-1.5 rounded-[14px] bg-gradient-to-r from-[#6D28FF] to-[#8B5CF6] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all"
                >
                  See providers <ChevronRight size={14} />
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger">
                {category.subcategories.map((sub) => (
                  <Link
                    key={sub.name}
                    href={`/categories/${category._id}/sub/${encodeURIComponent(sub.name)}`}
                    className="group bg-white rounded-[18px] border border-slate-100/80 overflow-hidden hover:shadow-[0_20px_60px_rgba(109,40,255,0.08)] hover:-translate-y-1 hover:border-purple-200/60 transition-all duration-300"
                  >
                    <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-purple-100 to-violet-100">
                      {sub.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={sub.image} alt={sub.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-purple-200">
                          <Layers size={36} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-extrabold text-slate-950 group-hover:text-[var(--primary)] transition-colors">{sub.name}</h3>
                        <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-0.5 group-hover:text-[var(--primary)] transition-all" />
                      </div>
                      <p className="mt-2 text-xs font-semibold text-slate-500">View services from approved providers</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
