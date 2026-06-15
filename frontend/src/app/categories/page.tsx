"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { categoryService } from "@/services/category";
import { Category } from "@/types/category.types";

const categoryGradients = [
  "from-blue-500 to-cyan-400",
  "from-violet-500 to-purple-400",
  "from-amber-500 to-orange-400",
  "from-emerald-500 to-teal-400",
  "from-rose-500 to-pink-400",
  "from-indigo-500 to-blue-400",
];

const LIMIT = 20;

const renderCategoryIcon = (category: Category) => {
  if (!category.icon) return category.name.charAt(0).toUpperCase();
  if (category.icon.startsWith("http") || category.icon.startsWith("/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={category.icon} alt="" className="w-8 h-8 object-contain" />;
  }
  return category.icon;
};

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / LIMIT);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoryService.getWithPagination(debouncedSearch || undefined, page, LIMIT);
      const data = res.data.data;
      setCategories(data.items);
      setTotal(data.total);
    } catch {
      setCategories([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-[var(--surface-2)]">
      {/* Premium Hero Banner */}
      <section className="relative overflow-hidden border-b border-slate-200/40">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/90 via-white to-violet-50/70" />
        <div className="absolute top-[-100px] right-[-80px] w-[450px] h-[450px] bg-gradient-to-bl from-purple-200/25 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-[-40px] left-[-40px] w-[300px] h-[300px] bg-gradient-to-tr from-violet-200/20 to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[var(--primary)] transition-colors">
            <ArrowLeft size={15} /> Back
          </button>

          <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold text-slate-900 leading-tight tracking-tight">
            Explore <span className="bg-gradient-to-r from-[#6D28FF] to-[#A855F7] bg-clip-text text-transparent">every service</span>
          </h1>
          <p className="mt-2 text-slate-500 max-w-lg text-sm sm:text-base">{total} categories available • Pick a category to discover trusted professionals for the job.</p>

          {/* Search */}
          <form onSubmit={handleSearch} className="mt-5 max-w-md">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories..."
                className="w-full rounded-2xl border border-slate-200/80 bg-white pl-12 pr-4 py-3 text-sm font-medium outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/8 shadow-sm transition-all"
              />
            </div>
          </form>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[16px] border border-slate-100 p-5 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl skeleton" />
                <div className="w-20 h-3.5 rounded-lg skeleton" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-[18px] border-2 border-dashed border-slate-200 bg-white p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-purple-400" />
            </div>
            <p className="font-bold text-slate-600 text-lg">No categories found</p>
            <p className="text-sm text-slate-400 mt-1">Try a different search term</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 stagger">
              {categories.map((category, i) => (
                <Link
                  key={category._id}
                  href={`/categories/${category._id}`}
                  className="group bg-white rounded-[16px] border border-slate-100/80 p-5 flex flex-col items-center gap-3 hover:shadow-[0_20px_60px_rgba(109,40,255,0.08)] hover:-translate-y-1 hover:border-purple-200/60 transition-all duration-300"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${categoryGradients[i % categoryGradients.length]} flex items-center justify-center text-white text-xl font-extrabold shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                    {renderCategoryIcon(category)}
                  </div>
                  <span className="text-sm font-bold text-slate-800 text-center leading-snug group-hover:text-[var(--primary)] transition-colors">
                    {category.name}
                  </span>
                  {category.subcategories && category.subcategories.length > 0 && (
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-full">{category.subcategories.length} services</span>
                  )}
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-medium text-slate-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
