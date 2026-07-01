"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  ArrowRight, Star, Search, Mic, ShieldCheck, Clock, CreditCard,
  Headphones, ChevronRight, FileText, Users, CheckCircle2, Zap,
} from "lucide-react";
import { RootState } from "@/store";
import { categoryService } from "@/services/category";
import { providerService } from "@/services/provider";
import { Category } from "@/types/category.types";
import { PublicProvider } from "@/types/provider.types";
import { getErrorMessage } from "@/utils/errorHandler";
import { staggerContainer, staggerItem } from "@/components/ui/motion";

/* ─────────────────────────────────────────────────────────────────────────
   Marketplace dashboard — purple brand system preserved
   ───────────────────────────────────────────────────────────────────────── */

const POPULAR_TAGS = ["Plumbing", "Electrical", "Carpentry", "Home Cleaning"];

const TRUST_BADGES = [
  { icon: ShieldCheck, title: "Verified Professionals", sub: "100% background verified" },
  { icon: Clock, title: "On-time Service", sub: "Always on time" },
  { icon: CreditCard, title: "Secure Payments", sub: "100% safe & secure" },
  { icon: Headphones, title: "24/7 Support", sub: "We are always here" },
];

const STEPS = [
  { no: "01", icon: FileText, title: "Tell us what you need", sub: "Choose a service or post a request." },
  { no: "02", icon: Users, title: "We find the right professional", sub: "We connect you with verified experts." },
  { no: "03", icon: CheckCircle2, title: "Sit back & relax", sub: "Your work gets done with satisfaction." },
];

const renderCategoryIcon = (category: Category) => {
  if (!category.icon) return category.name.charAt(0).toUpperCase();
  if (category.icon.startsWith("http") || category.icon.startsWith("/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={category.icon} alt="" className="h-7 w-7 object-contain" />;
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

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoadingData(true);
        setDataError("");
        const providerParams: Record<string, number> = {};
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
        const cats =
          (catData as { items?: Category[] }).items ||
          (Array.isArray(catData) ? (catData as Category[]) : []);
        const provData = providerRes.data.data || providerRes.data;
        setCategories(cats);
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

  const handleSearch = useCallback((query?: string) => {
    const q = (query ?? searchQuery).trim();
    router.push(q ? `/providers?search=${encodeURIComponent(q)}` : "/providers");
  }, [searchQuery, router]);

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const topProviders = useMemo(
    () => [...providers].sort((a, b) => (b.rating || 0) - (a.rating || 0)),
    [providers]
  );

  return (
    <div className="space-y-10 pb-12">

      {/* ══════════════════════════════════════════════════════════════════
          HERO
          ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-white px-6 py-9 shadow-[var(--shadow-card)] sm:px-10 sm:py-12"
      >
        {/* decorative magnifier / orbs */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 lg:block">
          <div className="absolute right-24 top-10 h-40 w-40 rounded-full bg-[var(--primary)]/10 blur-3xl" />
          <div className="absolute right-10 bottom-8 h-32 w-32 rounded-full bg-[var(--accent)]/10 blur-3xl" />
          <div className="absolute right-16 top-1/2 -translate-y-1/2">
            <div className="relative flex h-44 w-44 items-center justify-center rounded-full border border-[var(--primary)]/20 bg-gradient-to-br from-[var(--primary-light)] to-white shadow-[var(--shadow-glow)]">
              <Search size={72} strokeWidth={1.5} className="text-[var(--primary)]/70" />
            </div>
          </div>
        </div>

        <div className="relative max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
            Welcome back, {firstName}
          </p>
          <h1 className="mt-3 text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-[1.05] tracking-tight text-[var(--text-primary)]">
            What service do<br className="hidden sm:block" /> you need today?
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Find trusted professionals for every service you need.
          </p>

          {/* Search */}
          <div className="mt-7 flex max-w-xl items-center gap-2 rounded-full border border-[var(--border)] bg-white p-2 pl-5 shadow-sm transition focus-within:border-[var(--primary)] focus-within:shadow-[0_0_0_4px_rgba(109,40,255,0.06)]">
            <Search size={19} className="shrink-0 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search for services (e.g. Plumbing, Carpentry...)"
              className="flex-1 bg-transparent py-2 text-sm font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            />
            <button
              onClick={() => handleSearch()}
              aria-label="Search"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#141414] text-white transition hover:bg-black"
            >
              <Mic size={17} />
            </button>
          </div>

          {/* Popular tags */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[var(--text-secondary)]">Popular:</span>
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => handleSearch(tag)}
                className="rounded-full border border-[var(--border)] bg-white px-3.5 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--primary)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)]"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </motion.section>

      {dataError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-semibold text-red-700">
          {dataError}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          POPULAR CATEGORIES
          ══════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader title="Popular Categories" href="/categories" linkLabel="View all categories" />

        {loadingData ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-[20px] bg-black/[0.04] animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <Empty text="No categories available yet" />
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
          >
            {categories.slice(0, 6).map((category) => {
              const count = category.subcategories?.length ?? 0;
              return (
                <motion.div key={category._id} variants={staggerItem}>
                  <Link href={`/categories/${category._id}`}>
                    <motion.div
                      whileHover={{ y: -4 }}
                      transition={{ type: "spring", stiffness: 300, damping: 22 }}
                      className="group flex h-full flex-col rounded-[20px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)] transition hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-card-hover)]"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-3)] text-lg font-bold text-[var(--primary)] ring-1 ring-black/[0.04]">
                        {renderCategoryIcon(category)}
                      </div>
                      <p className="mt-4 truncate text-[15px] font-bold tracking-tight text-[var(--text-primary)]">
                        {category.name}
                      </p>
                      <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">
                        {count > 0 ? `${count} services` : "Explore"}
                      </p>
                      <div className="mt-4 flex items-center justify-between border-t border-[var(--border-light)] pt-3">
                        <span className="text-[12px] font-semibold text-[var(--text-secondary)]">View</span>
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-3)] text-[var(--text-muted)] transition group-hover:bg-[var(--primary)] group-hover:text-white">
                          <ArrowRight size={13} />
                        </span>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TOP RATED PROFESSIONALS
          ══════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader title="Top Rated Professionals" href="/providers" linkLabel="View all providers" />

        {loadingData ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-44 rounded-[20px] bg-black/[0.04] animate-pulse" />
            ))}
          </div>
        ) : topProviders.length === 0 ? (
          <Empty text={location.isSet ? "No professionals near your location yet" : "No professionals available yet"} />
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
          >
            {topProviders.slice(0, 5).map((provider) => (
              <motion.div key={provider.id} variants={staggerItem}>
                <Link href={`/providers/${provider.id}`}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className="group flex h-full flex-col items-center rounded-[20px] border border-[var(--border)] bg-white p-5 text-center shadow-[var(--shadow-card)] transition hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-card-hover)]"
                  >
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--primary-light)] to-white text-lg font-bold text-[var(--primary)] ring-2 ring-white shadow-sm">
                      {provider.profileImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={provider.profileImage} alt="" className="h-full w-full object-cover" />
                      ) : (
                        provider.name[0]?.toUpperCase()
                      )}
                    </div>
                    <p className="mt-3 truncate text-[15px] font-bold tracking-tight text-[var(--text-primary)]">
                      {provider.name}
                    </p>
                    <div className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--text-secondary)]">
                      <Star size={13} fill="#F59E0B" strokeWidth={0} />
                      {provider.rating ? provider.rating.toFixed(1) : "New"}
                      {provider.price !== null && (
                        <>
                          <span className="text-[var(--border)]">•</span>
                          <span className="text-[var(--primary)]">₹{provider.price}</span>
                        </>
                      )}
                    </div>
                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--success-light)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--success)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" /> Available
                    </span>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TRUST BADGES
          ══════════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-2 divide-y divide-[var(--border-light)] rounded-[24px] border border-[var(--border)] bg-white shadow-[var(--shadow-card)] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        {TRUST_BADGES.map((b) => (
          <div key={b.title} className="flex items-center gap-3 px-5 py-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary-light)] text-[var(--primary)]">
              <b.icon size={19} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-[var(--text-primary)]">{b.title}</p>
              <p className="truncate text-[11px] text-[var(--text-muted)]">{b.sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          HOW ALLSERVE WORKS
          ══════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader title="How AllServe works" href="/categories" linkLabel="Learn more" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.no}
              className="relative rounded-[20px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-start justify-between">
                <span className="text-[13px] font-bold text-[var(--text-muted)] tabular-nums">{s.no}</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
                  <s.icon size={18} />
                </div>
              </div>
              <p className="mt-5 text-[16px] font-bold tracking-tight text-[var(--text-primary)]">{s.title}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          EMERGENCY BAND
          ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[28px] border border-[var(--primary)]/15 bg-gradient-to-r from-[var(--primary-light)] via-white to-[var(--primary-light)] p-8 shadow-[var(--shadow-card)] sm:p-10"
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full bg-[var(--primary)]/10 blur-3xl" />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--primary)]">Need urgent help?</p>
            <h3 className="mt-2 max-w-lg text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              Book Instantly and get  professional service in just 30 minutes
            </h3>
          </div>
          <Link href="/categories">
            <motion.span
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2.5 rounded-full bg-[#141414] py-3 pl-6 pr-3 text-sm font-bold text-white shadow-lg"
            >
              Book Now
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-white">
                <Zap size={15} />
              </span>
            </motion.span>
          </Link>
        </div>
      </motion.section>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────────────────────────────────── */

function SectionHeader({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl">{title}</h2>
      <Link
        href={href}
        className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[var(--primary)] transition hover:gap-2"
      >
        {linkLabel}
        <ChevronRight size={16} className="transition group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[24px] border border-dashed border-[var(--border)] bg-white/50 p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-3)] text-[var(--text-muted)]">
        <Search size={22} />
      </div>
      <p className="font-semibold text-[var(--text-secondary)]">{text}</p>
    </div>
  );
}
