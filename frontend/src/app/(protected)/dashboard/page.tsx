"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  ArrowRight, Star, Sparkles, BadgeCheck,
  MapPin, Search,
} from "lucide-react";
import { RootState } from "@/store";
import { categoryService } from "@/services/category";
import { providerService } from "@/services/provider";
import { Category } from "@/types/category.types";
import { PublicProvider } from "@/types/provider.types";
import { getErrorMessage } from "@/utils/errorHandler";

const categoryGradients = [
  "from-blue-500 to-cyan-400",
  "from-violet-500 to-purple-400",
  "from-amber-500 to-orange-400",
  "from-emerald-500 to-teal-400",
  "from-rose-500 to-pink-400",
  "from-indigo-500 to-blue-400",
];

const SEARCH_EXAMPLES = [
  "Search AC Repair...",
  "Search Electrician...",
  "Search Cleaning Services...",
  "Search Painting Services...",
  "Search Plumbing...",
];

const renderCategoryIcon = (category: Category) => {
  if (!category.icon) return category.name.charAt(0).toUpperCase();
  if (category.icon.startsWith("http") || category.icon.startsWith("/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={category.icon} alt="" className="w-8 h-8 object-contain" />;
  }
  return category.icon;
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const location = useSelector((state: RootState) => state.location);
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<PublicProvider[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPlaceholderIdx((i) => (i + 1) % SEARCH_EXAMPLES.length), 2800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoadingData(true);
        setDataError("");
        const providerParams: Record<string, any> = {};
        if (location.isSet && location.latitude && location.longitude) {
          providerParams.latitude = location.latitude;
          providerParams.longitude = location.longitude;
          providerParams.radius = 15;
        }
        const [categoryRes, providerRes] = await Promise.all([
          categoryService.getAll(),
          providerService.getPublicProviders(providerParams),
        ]);
        if (!active) return;
        const catData = categoryRes.data.data || categoryRes.data;
        const categories = catData.items || (Array.isArray(catData) ? catData : []);
        const provData = providerRes.data.data || providerRes.data;
        setCategories(categories);
        setProviders(Array.isArray(provData) ? provData : []);
      } catch (err) {
        if (active) setDataError(getErrorMessage(err) || "Failed to load dashboard data");
      } finally {
        if (active) setLoadingData(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [location.latitude, location.longitude, location.isSet]);

  const handleSearch = useCallback(() => {
    const q = searchQuery.trim();
    router.push(q ? `/providers?search=${encodeURIComponent(q)}` : "/providers");
  }, [searchQuery, router]);

  return (
    <div className="fade-up">

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[20px] mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/90 via-white to-violet-50/70" />
        <div className="absolute top-[-80px] right-[-60px] w-[350px] h-[350px] bg-gradient-to-bl from-purple-200/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-[-40px] left-[-40px] w-[250px] h-[250px] bg-gradient-to-tr from-violet-200/15 to-transparent rounded-full blur-3xl" />

        <div className="relative px-5 py-7 text-center sm:px-8">
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-purple-100/80 rounded-full px-3.5 py-1.5 mb-3 shadow-sm">
            <Sparkles size={14} className="text-[var(--primary)]" />
            <span className="text-sm font-bold text-[var(--primary)]">Welcome back, {user?.name?.split(" ")[0] ?? "there"}</span>
          </div>

          <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-3">
            Find the right professional{" "}
            <span className="bg-gradient-to-r from-[#6D28FF] via-[#8B5CF6] to-[#A855F7] bg-clip-text text-transparent">near you</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-lg mx-auto mb-5">
            Browse categories, discover services, and book verified professionals.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto">
            <div className="flex items-center gap-2 bg-white border-2 border-slate-200/80 rounded-[18px] p-2 pl-5 shadow-[0_8px_32px_rgba(109,40,255,0.06)] focus-within:border-purple-400 focus-within:shadow-[0_12px_40px_rgba(109,40,255,0.1)] transition-all">
              <Search size={20} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={SEARCH_EXAMPLES[placeholderIdx]}
                className="flex-1 bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400 py-2"
              />
              <button onClick={handleSearch} className="shrink-0 inline-flex items-center gap-1.5 bg-gradient-to-r from-[#6D28FF] to-[#8B5CF6] text-white rounded-[12px] px-5 py-2.5 text-sm font-bold shadow-md shadow-purple-500/15 hover:shadow-lg transition-all">
                Search <ArrowRight size={14} />
              </button>
            </div>
          </div>

        </div>
      </section>

      {dataError && (
        <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-3.5 text-sm font-semibold text-red-700 mb-6">{dataError}</div>
      )}

      {/* Content */}
      <div className="space-y-7">
          {/* Categories */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Browse Categories</h2>
              <Link href="/categories" className="text-sm font-bold text-[var(--primary)] hover:text-purple-700 flex items-center gap-1 group">
                View all <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {loadingData ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-[16px] border border-slate-100 p-4 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl skeleton" />
                    <div className="w-16 h-3 rounded-lg skeleton" />
                  </div>
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="rounded-[16px] border-2 border-dashed border-slate-200 bg-white p-8 text-center">
                <Sparkles size={24} className="text-purple-400 mx-auto mb-3" />
                <p className="font-bold text-slate-600">No categories available</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 stagger">
                {categories.map((category, i) => (
                  <Link key={category._id} href={`/categories/${category._id}`}
                    className="group bg-white rounded-[16px] border border-slate-100/80 p-4 flex flex-col items-center gap-3 hover:shadow-[0_12px_40px_rgba(109,40,255,0.06)] hover:-translate-y-1 hover:border-purple-200/60 transition-all duration-200">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryGradients[i % categoryGradients.length]} flex items-center justify-center text-white text-lg font-extrabold shadow-md group-hover:scale-110 transition-transform duration-200`}>
                      {renderCategoryIcon(category)}
                    </div>
                    <span className="text-xs font-bold text-slate-800 text-center leading-snug group-hover:text-[var(--primary)] transition-colors">{category.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Providers */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Top Professionals</h2>
              <Link href="/providers" className="text-sm font-bold text-[var(--primary)] hover:text-purple-700 flex items-center gap-1 group">
                View all <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {loadingData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-[16px] border border-slate-100 p-4">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl skeleton" />
                      <div className="flex-1 space-y-2">
                        <div className="w-28 h-4 rounded-lg skeleton" />
                        <div className="w-16 h-3 rounded-lg skeleton" />
                      </div>
                    </div>
                    <div className="w-full h-10 rounded-xl skeleton" />
                  </div>
                ))}
              </div>
            ) : providers.length === 0 ? (
              <div className="rounded-[16px] border-2 border-dashed border-slate-200 bg-white p-8 text-center">
                <p className="font-bold text-slate-500">{location.isSet ? "No providers near you" : "No providers available"}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
                {providers.slice(0, 6).map((provider) => (
                  <Link key={provider.id} href={`/providers/${provider.id}`}
                    className="group bg-white rounded-[16px] border border-slate-100/80 p-4 hover:shadow-[0_12px_40px_rgba(109,40,255,0.06)] hover:-translate-y-1 hover:border-purple-200/60 transition-all duration-200">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-violet-100 flex items-center justify-center text-[var(--primary)] font-extrabold text-base shrink-0 overflow-hidden ring-1 ring-purple-100">
                        {provider.profileImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={provider.profileImage} alt="" className="w-full h-full object-cover" />
                        ) : provider.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate group-hover:text-[var(--primary)] transition-colors">{provider.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-600"><Star size={11} fill="#d97706" strokeWidth={0} /> {provider.rating || "New"}</span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><BadgeCheck size={10} /> Verified</span>
                        </div>
                      </div>
                      <p className="text-base font-extrabold text-slate-900 shrink-0">{provider.price !== null ? `₹${provider.price}` : "Quote"}</p>
                    </div>
                    <div className="w-full bg-gradient-to-r from-[#6D28FF] to-[#8B5CF6] text-white text-center rounded-xl py-2.5 text-xs font-bold shadow-md shadow-purple-500/10 group-hover:shadow-lg transition-all">
                      View & Book
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
      </div>
    </div>
  );
}
