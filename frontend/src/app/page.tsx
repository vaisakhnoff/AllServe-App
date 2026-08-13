"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  ArrowRight, Star, Search, CheckCircle2,
  Wrench, Zap, Hammer, Home as HomeIcon, Paintbrush, Cpu, Bug,
  Share2, Globe, Mail, Phone, Layers, User
} from "lucide-react";
import { RootState } from "@/store";
import { categoryService } from "@/services/category";
import { providerService } from "@/services/provider";
import { Category } from "@/types/category.types";
import { PublicProvider } from "@/types/provider.types";
import { ROUTES } from "@/shared/routes";

const CATEGORY_STYLE_PALETTE = [
  { bg: "bg-[#E6F7F0]", text: "text-[#00B761]", icon: Wrench },
  { bg: "bg-[#FFF5E6]", text: "text-[#D97706]", icon: Zap },
  { bg: "bg-[#FFF0EB]", text: "text-[#C2410C]", icon: Hammer },
  { bg: "bg-[#F3E8FF]", text: "text-[#9333EA]", icon: HomeIcon },
  { bg: "bg-[#FCE7F3]", text: "text-[#DB2777]", icon: Paintbrush },
  { bg: "bg-[#E0F2FE]", text: "text-[#0284C7]", icon: Cpu },
  { bg: "bg-[#DCFCE7]", text: "text-[#16A34A]", icon: Bug },
];

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const location = useSelector((state: RootState) => state.location);

  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<PublicProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const providerParams: Record<string, number> = {};
        if (location.isSet && location.latitude && location.longitude) {
          providerParams.latitude = location.latitude;
          providerParams.longitude = location.longitude;
          providerParams.radius = 25;
        }

        const [catRes, provRes] = await Promise.all([
          categoryService.getAll().catch(() => null),
          providerService.getPublicProviders(providerParams).catch(() => null),
        ]);

        if (!active) return;

        if (catRes) {
          const rawCat = catRes.data?.data || catRes.data;
          const catItems = (rawCat as { items?: Category[] })?.items || (Array.isArray(rawCat) ? (rawCat as Category[]) : []);
          setCategories(catItems);
        }

        if (provRes) {
          const rawProv = provRes.data?.data || provRes.data;
          const provItems = Array.isArray(rawProv) ? (rawProv as PublicProvider[]) : [];
          setProviders(provItems);
        }
      } catch {
        // Silently fail gracefully
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadData();
    return () => { active = false; };
  }, [location.latitude, location.longitude, location.isSet]);

  const handleSearch = useCallback((query?: string) => {
    const q = (query ?? searchQuery).trim();
    if (q) {
      router.push(`/providers?search=${encodeURIComponent(q)}`);
    } else {
      router.push("/providers");
    }
  }, [searchQuery, router]);

  const firstName = user?.name?.split(" ")[0] ?? null;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00B761] text-white shadow-sm shadow-[#00B761]/20">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">AllServe</span>
          </Link>

          {/* Right Nav Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href={ROUTES.DASHBOARD}>
                <button className="px-4 py-2 rounded-xl bg-[#00B761] hover:bg-[#009E52] text-white font-bold text-sm transition-all shadow-sm shadow-[#00B761]/20">
                  Go to Dashboard
                </button>
              </Link>
            ) : (
              <>
                <Link href={ROUTES.LOGIN} className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors px-3 py-2">
                  Login
                </Link>
                <Link href={ROUTES.SIGNUP}>
                  <button className="px-4 py-2 rounded-xl bg-[#00B761] hover:bg-[#009E52] text-white font-bold text-sm transition-all shadow-sm shadow-[#00B761]/20">
                    Sign Up
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Content ────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-10 pb-6">

        {/* ══════════════════════════════════════════════════════════════════
            HERO BANNER
            ══════════════════════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#F0F2FF] via-[#EBF7FD] to-[#F7F5FF] px-6 py-8 sm:px-10 sm:py-10 border border-slate-100/80 shadow-sm"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Left Text Block */}
            <div className="w-full md:w-[55%] z-10">
              <p className="text-sm font-extrabold text-[#00B761]">
                {firstName ? `Welcome back, ${firstName} 👋` : "Welcome to AllServe 👋"}
              </p>
              <h1 className="mt-2 text-3xl sm:text-4xl lg:text-[44px] font-black leading-[1.1] text-slate-900 tracking-tight">
                What service do<br />you need <span className="text-[#00B761]">today?</span>
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-500 font-medium max-w-md">
                Find trusted professionals for every service you need.
              </p>

              {/* Search Input Bar */}
              <div className="mt-6 flex items-center bg-white rounded-full p-1.5 pl-5 shadow-sm border border-slate-200/80 max-w-lg w-full focus-within:border-[#00B761] transition-all">
                <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search for services (e.g. Plumbing, Carpentry...)"
                  className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 font-medium"
                />
                <button
                  onClick={() => handleSearch()}
                  aria-label="Search"
                  className="w-10 h-10 rounded-full bg-[#00B761] hover:bg-[#009E52] flex items-center justify-center text-white shrink-0 ml-2 transition-all shadow-md shadow-[#00B761]/20"
                >
                  <ArrowRight size={18} />
                </button>
              </div>

              {/* Dynamic Popular Tags based on loaded categories */}
              {categories.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="text-slate-500 mr-1">Popular:</span>
                  {categories.slice(0, 4).map((cat, idx) => {
                    const palette = CATEGORY_STYLE_PALETTE[idx % CATEGORY_STYLE_PALETTE.length];
                    return (
                      <button
                        key={cat._id}
                        onClick={() => handleSearch(cat.name)}
                        className={`px-3.5 py-1.5 rounded-full ${palette.bg} ${palette.text} hover:opacity-90 transition-opacity`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right 3D Illustration */}
            <div className="w-full md:w-[45%] flex justify-center items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hero_3d.png"
                alt="3D Services Illustration"
                className="w-full max-w-[380px] sm:max-w-[420px] object-contain drop-shadow-lg transform hover:scale-[1.02] transition-transform duration-300"
              />
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════════════════════
            POPULAR CATEGORIES (100% Dynamic from Database)
            ══════════════════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Popular Categories</h2>
            <Link href="/categories" className="text-sm font-bold text-[#00B761] hover:underline inline-flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-slate-200/60 animate-pulse" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-dashed border-slate-200 text-center">
              <Layers className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-600">No categories found</p>
              <p className="text-xs text-slate-400 mt-1">Categories created in the admin panel will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
              {categories.map((cat, index) => {
                const palette = CATEGORY_STYLE_PALETTE[index % CATEGORY_STYLE_PALETTE.length];
                const IconComponent = palette.icon;
                const subCount = cat.subcategories?.length ?? 0;
                return (
                  <Link key={cat._id} href={`/categories/${cat._id}`}>
                    <motion.div
                      whileHover={{ y: -3 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all text-left flex flex-col justify-between h-full group"
                    >
                      <div className={`w-11 h-11 rounded-xl ${palette.bg} ${palette.text} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                        {cat.icon && (cat.icon.startsWith("http") || cat.icon.startsWith("/")) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cat.icon} alt={cat.name} className="w-6 h-6 object-contain" />
                        ) : (
                          <IconComponent size={20} />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">{cat.name}</h3>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {subCount > 0 ? `${subCount} services` : "Explore"}
                        </p>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            TOP PROVIDERS (100% Dynamic from Database)
            ══════════════════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Top Providers</h2>
            <Link href="/providers" className="text-sm font-bold text-[#00B761] hover:underline inline-flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-56 rounded-2xl bg-slate-200/60 animate-pulse" />
              ))}
            </div>
          ) : providers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-dashed border-slate-200 text-center">
              <User className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-600">No active providers available</p>
              <p className="text-xs text-slate-400 mt-1">Verified service providers will appear here automatically.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {providers.map((prov) => (
                <motion.div
                  key={prov.id}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all flex flex-col items-center text-center justify-between"
                >
                  {/* Avatar with Verified Checkmark */}
                  <div className="relative mb-3">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-[#E6F7F0] flex items-center justify-center text-lg font-black text-[#00B761]">
                      {prov.profileImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={prov.profileImage}
                          alt={prov.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{prov.name[0]?.toUpperCase() || "P"}</span>
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 bg-[#00B761] text-white rounded-full p-0.5 ring-2 ring-white">
                      <CheckCircle2 size={13} className="fill-[#00B761] text-white" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="w-full">
                    <div className="flex items-center justify-center gap-1">
                      <h3 className="text-sm font-bold text-slate-900 truncate max-w-[140px]">{prov.name}</h3>
                      <CheckCircle2 size={13} className="text-[#00B761] fill-[#00B761] text-white shrink-0" />
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                      {prov.price !== null ? `Starting at ₹${prov.price}` : "Verified Professional"}
                    </p>

                    {/* Rating */}
                    <div className="flex items-center justify-center gap-1 mt-2 text-xs font-bold text-slate-800">
                      <Star size={13} className="fill-amber-400 text-amber-400" />
                      <span>{prov.rating ? prov.rating.toFixed(1) : "New"}</span>
                    </div>

                    {/* Button */}
                    <Link href={`/providers/${prov.id}`} className="mt-3.5 block w-full">
                      <button className="w-full py-2 px-3 rounded-xl bg-[#E6F7F0] hover:bg-[#d5f2e6] text-[#00B761] text-xs font-bold transition-colors flex items-center justify-center gap-1.5">
                        <span>View Profile</span>
                        <ArrowRight size={13} />
                      </button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            FOOTER SECTION
            ══════════════════════════════════════════════════════════════════ */}
        <footer className="mt-16 pt-12 border-t border-slate-100 bg-white -mx-4 -mb-6 px-6 sm:-mx-6 sm:px-10 lg:-mx-8 lg:px-12 rounded-t-[32px]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12">
            {/* Col 1: Brand & Social */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#00B761] text-white">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                  </svg>
                </div>
                <span className="text-xl font-black text-slate-900 tracking-tight">AllServe</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your trusted marketplace for all home and professional services.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <a href="#" className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#00B761] hover:border-[#00B761] transition-colors"><Globe size={14} /></a>
                <a href="#" className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#00B761] hover:border-[#00B761] transition-colors"><Share2 size={14} /></a>
                <a href="#" className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#00B761] hover:border-[#00B761] transition-colors"><Mail size={14} /></a>
                <a href="#" className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#00B761] hover:border-[#00B761] transition-colors"><Phone size={14} /></a>
              </div>
            </div>

            {/* Col 2: Company */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3.5">Company</h4>
              <ul className="space-y-2 text-xs font-medium text-slate-500">
                <li><Link href="#" className="hover:text-slate-900 transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-slate-900 transition-colors">How it Works</Link></li>
                <li><Link href="#" className="hover:text-slate-900 transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-slate-900 transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-slate-900 transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            {/* Col 3: For Customers */}
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3.5">For Customers</h4>
              <ul className="space-y-2 text-xs font-medium text-slate-500">
                <li><Link href="#" className="hover:text-slate-900 transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-slate-900 transition-colors">Safety Center</Link></li>
                <li><Link href="#" className="hover:text-slate-900 transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-slate-900 transition-colors">Refund Policy</Link></li>
              </ul>
            </div>

            {/* Col 4: For Providers */}
<div>
  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3.5">For Providers</h4>
  <ul className="space-y-2 text-xs font-medium text-slate-500">
    <li><Link href="/provider-portal/signup" className="hover:text-slate-900 transition-colors">Become a Provider</Link></li>
    <li><Link href="/provider-portal" className="hover:text-slate-900 transition-colors">Provider Resources</Link></li>
    <li><Link href="/provider-portal" className="hover:text-slate-900 transition-colors">Success Stories</Link></li>
    <li><Link href="/provider-portal/login" className="hover:text-slate-900 transition-colors">Provider Login</Link></li>
  </ul>
</div>


            {/* Col 5: Newsletter & App store */}
            <div className="lg:col-span-1 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Stay updated with AllServe</h4>
              <p className="text-xs text-slate-500">Subscribe to get latest offers & updates</p>

              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-full p-1 pl-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
                />
                <button className="w-7 h-7 rounded-full bg-[#00B761] hover:bg-[#009E52] text-white flex items-center justify-center shrink-0 ml-1">
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* App buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 text-left hover:bg-slate-50 transition-colors">
                  <div className="text-slate-900 font-bold text-base"></div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-slate-400 leading-none">Download on the</p>
                    <p className="text-xs font-bold text-slate-900 leading-tight">App Store</p>
                  </div>
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 text-left hover:bg-slate-50 transition-colors">
                  <div className="text-[#00B761] font-bold text-sm">▶</div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-slate-400 leading-none">GET IT ON</p>
                    <p className="text-xs font-bold text-slate-900 leading-tight">Google Play</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 py-6 text-center text-xs font-medium text-slate-400">
            © 2025 AllServe. All rights reserved.
          </div>
        </footer>
      </main>
    </div>
  );
}
