"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ROUTES } from "@/shared/routes";
import { Search, Star, ArrowRight, Zap, Shield, Clock } from "lucide-react";
import { Category } from "@/types/category.types";
import { PublicProvider } from "@/types/provider.types";
import { categoryService } from "@/services/category";
import { providerService } from "@/services/provider";
import { FloatingCard, staggerContainer, staggerItem } from "@/components/ui/motion";

const categoryCardColors = [
  { background: "from-blue-500/10 to-cyan-500/5", accent: "#3B82F6" },
  { background: "from-amber-500/10 to-orange-500/5", accent: "#F59E0B" },
  { background: "from-violet-500/10 to-purple-500/5", accent: "#7C3AED" },
  { background: "from-sky-500/10 to-blue-500/5", accent: "#0284C7" },
  { background: "from-rose-500/10 to-pink-500/5", accent: "#DB2777" },
  { background: "from-emerald-500/10 to-teal-500/5", accent: "#16A34A" },
];

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<PublicProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, provRes] = await Promise.all([
          categoryService.getAll(),
          providerService.getPublicProviders(),
        ]);
        const catData = catRes.data.data || catRes.data;
        const provData = provRes.data.data || provRes.data;
        setCategories((catData as { items?: Category[] }).items || (Array.isArray(catData) ? catData as Category[] : []));
        setProviders(Array.isArray(provData) ? provData : []);
      } catch {
        // silently fail — show empty state
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="home-shell">
      {/* ── Floating Navbar ──────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-100/60">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[12px] bg-gradient-to-br from-[#6D28FF] to-[#A855F7] flex items-center justify-center shadow-md shadow-purple-500/15">
              <Zap size={16} color="white" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-[1.05rem] text-slate-900">Allserve</span>
            <span className="text-[10px] font-bold text-[var(--primary)] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100/80">MARKETPLACE</span>
          </div>

          <div className="flex items-center gap-3">
            <Link href={ROUTES.LOGIN} className="text-sm font-semibold text-slate-600 hover:text-[var(--primary)] transition-colors">
              Login
            </Link>
            <Link href={ROUTES.SIGNUP}>
              <motion.button
                whileHover={{ y: -1, scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                className="bg-gradient-to-r from-[#6D28FF] to-[#8B5CF6] text-white border-none rounded-[12px] px-5 py-2.5 font-bold text-sm shadow-md shadow-purple-500/15 cursor-pointer"
              >
                Sign Up
              </motion.button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero — Immersive Spatial Section ─────────────────────────── */}
      <section className="home-hero relative overflow-hidden">
        {/* Ambient orbs */}
        <div className="absolute top-[-150px] right-[-100px] w-[500px] h-[500px] bg-gradient-to-bl from-purple-200/25 to-transparent rounded-full blur-[100px] animate-breathe" />
        <div className="absolute bottom-[-100px] left-[-80px] w-[400px] h-[400px] bg-gradient-to-tr from-blue-200/20 to-transparent rounded-full blur-[80px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-radial from-violet-100/15 to-transparent rounded-full blur-[60px]" />

        <div className="relative max-w-[700px] mx-auto px-5 sm:px-8 pt-20 pb-16 sm:pt-24 sm:pb-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-[clamp(2.25rem,5.5vw,3.5rem)] font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-5"
          >
            Find the right professional.
            <br />
            <span className="gradient-text">Instantly.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="text-[1.05rem] text-slate-500 leading-relaxed max-w-[520px] mx-auto mb-9"
          >
            Describe what you need done, and we&apos;ll match you with top-rated experts available in your area.
          </motion.p>

          {/* Floating Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="max-w-[560px] mx-auto mb-5"
          >
            <div className="flex gap-0 bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-[20px] p-2 pl-5 shadow-[0_12px_48px_rgba(109,40,255,0.08),0_4px_16px_rgba(0,0,0,0.03)] focus-within:shadow-[var(--shadow-glow)] focus-within:border-purple-200 transition-all duration-300">
              <Search size={18} className="text-slate-400 shrink-0 self-center" />
              <input
                type="text"
                placeholder="Ask anything... like 'I need an electrician for a new socket'"
                className="flex-1 border-none outline-none text-[0.9375rem] text-slate-900 px-3 py-2.5 bg-transparent font-medium placeholder:text-slate-400"
              />
              <Link href={ROUTES.LOGIN}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  className="bg-gradient-to-r from-[#6D28FF] to-[#8B5CF6] text-white border-none rounded-[14px] px-5 py-2.5 font-bold text-[0.9375rem] cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md shadow-purple-500/15"
                >
                  Search <ArrowRight size={15} />
                </motion.button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2 justify-center flex-wrap"
          >
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Popular:</span>
            {categories.slice(0, 3).map(cat => (
              <span key={cat._id} className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                {cat.name}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Categories — Spatial Grid ────────────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-5 sm:px-8 py-16">
        <div className="flex justify-between items-center mb-7">
          <h2 className="text-[1.5rem] font-extrabold text-slate-900 tracking-tight">Browse Categories</h2>
          <Link href={ROUTES.LOGIN} className="text-sm font-bold text-[var(--primary)] hover:text-purple-700 flex items-center gap-1 group">
            View all <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[var(--radius)] border border-slate-100/60 p-6 flex flex-col items-center gap-3 shadow-sm">
                <div className="w-14 h-14 rounded-[14px] skeleton" />
                <div className="w-16 h-3 skeleton rounded-lg" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 rounded-[var(--radius-lg)] bg-white p-10 text-center">
            <p className="font-bold text-slate-500">No categories available.</p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            {categories.map((cat, i) => {
              const color = categoryCardColors[i % categoryCardColors.length];
              return (
                <motion.div key={cat._id} variants={staggerItem}>
                  <Link href={ROUTES.LOGIN}>
                    <FloatingCard className={`bg-gradient-to-br ${color.background} rounded-[var(--radius)] border border-slate-100/60 p-6 flex flex-col items-center gap-3 cursor-pointer shadow-sm`}>
                      <div
                        className="w-14 h-14 rounded-[14px] bg-white flex items-center justify-center text-[1.5rem] font-extrabold shadow-sm"
                        style={{ color: color.accent }}
                      >
                        {cat.icon && (cat.icon.startsWith("http") || cat.icon.startsWith("/"))
                          ? <img src={cat.icon} alt="" className="w-8 h-8 object-contain" />
                          : cat.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[0.8125rem] font-bold text-slate-800 text-center leading-snug">{cat.name}</span>
                    </FloatingCard>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>

      {/* ── Top Providers — Elevated Cards ───────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-5 sm:px-8 pb-16">
        <div className="flex justify-between items-center mb-7">
          <h2 className="text-[1.5rem] font-extrabold text-slate-900 tracking-tight">Top-Rated Professionals</h2>
          <Link href={ROUTES.LOGIN} className="text-sm font-bold text-[var(--primary)] hover:text-purple-700 flex items-center gap-1 group">
            View all <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[var(--radius-lg)] border border-slate-100/60 p-6 shadow-sm">
                <div className="flex gap-3 mb-4">
                  <div className="w-13 h-13 rounded-[14px] skeleton" />
                  <div className="space-y-2 flex-1">
                    <div className="w-28 h-4 skeleton rounded" />
                    <div className="w-20 h-3 skeleton rounded" />
                  </div>
                </div>
                <div className="w-full h-10 skeleton rounded-xl" />
              </div>
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 rounded-[var(--radius-lg)] bg-white p-10 text-center">
            <p className="font-bold text-slate-500">No providers available yet.</p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {providers.map(pro => (
              <motion.div key={pro.id} variants={staggerItem}>
                <FloatingCard className="bg-white rounded-[var(--radius-lg)] border border-slate-100/60 p-6 cursor-pointer shadow-sm">
                  <div className="flex items-start gap-3.5 mb-5">
                    <div className="w-13 h-13 rounded-[14px] bg-gradient-to-br from-purple-50 to-violet-100 flex items-center justify-center font-extrabold text-[1.1rem] text-[var(--primary)] shrink-0 overflow-hidden ring-1 ring-purple-100/60 shadow-sm">
                      {pro.profileImage
                        ? <img src={pro.profileImage} alt="" className="w-full h-full object-cover" />
                        : pro.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-900 text-[0.9375rem]">{pro.name}</p>
                          <p className="text-slate-500 text-xs mt-0.5">Verified Professional</p>
                        </div>
                        <p className="font-extrabold text-[var(--primary)] text-[0.9375rem]">
                          {pro.price !== null ? `₹${pro.price}` : "Quote"}
                          <span className="text-[10px] text-slate-400 font-medium block text-right">starting</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                          <Star size={12} fill="#D97706" strokeWidth={0} /> {pro.rating || "New"}
                        </span>
                        <span className="bg-purple-50 text-[var(--primary)] text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-100/60">Approved</span>
                      </div>
                    </div>
                  </div>
                  <Link href={ROUTES.LOGIN}>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-[12px] py-3 font-semibold text-sm text-slate-700 hover:border-purple-200 hover:text-[var(--primary)] hover:bg-purple-50/50 transition-all cursor-pointer"
                    >
                      View Profile
                    </motion.button>
                  </Link>
                </FloatingCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* ── Trust Badges — Spatial Section ───────────────────────────── */}
      <section className="bg-white/80 backdrop-blur-sm border-t border-slate-100/60 py-16">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-[900px] mx-auto px-5 sm:px-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center"
        >
          {[
            { icon: <Shield size={26} className="text-[var(--primary)]" />, title: "Verified Professionals", desc: "Background-checked & certified providers" },
            { icon: <Zap size={26} className="text-amber-500" />, title: "Instant Matching", desc: "Get matched in seconds, book in minutes" },
            { icon: <Clock size={26} className="text-emerald-500" />, title: "24/7 Support", desc: "We're here whenever you need help" },
          ].map((item) => (
            <motion.div key={item.title} variants={staggerItem} className="flex flex-col items-center gap-3.5">
              <div className="w-14 h-14 rounded-[16px] bg-slate-50 border border-slate-100/60 flex items-center justify-center shadow-sm">
                {item.icon}
              </div>
              <p className="font-bold text-slate-900 text-[0.9375rem]">{item.title}</p>
              <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100/60 py-6 text-center">
        <p className="text-sm text-slate-400 font-medium">© 2026 AllServe. All rights reserved.</p>
      </footer>
    </div>
  );
}
