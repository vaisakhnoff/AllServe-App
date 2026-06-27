"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  ArrowLeft, Star, BadgeCheck, MapPin, Loader2, MessageSquarePlus,
  Clock, CalendarDays, ArrowUpRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { RootState } from "@/store";
import { providerService } from "@/services/provider";
import { slotService, Slot } from "@/services/provider";
import { messagingService } from "@/services/messaging";
import { PublicProviderDetails } from "@/types/provider.types";
import { getErrorMessage } from "@/utils/errorHandler";
import { Role } from "@/enums/role.enum";
import { LoginRequiredPrompt } from "@/components/auth/LoginRequiredPrompt";

function formatDateLabel(iso: string) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(new Date(iso));
}

export default function ProviderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";
  const { user, isAuthenticated, isInitialized, role } = useSelector((state: RootState) => state.auth);
  const canViewDetails = isInitialized && isAuthenticated && role === Role.USER;

  const [provider, setProvider] = useState<PublicProviderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (!id || !canViewDetails) return;
    let c = false;
    setLoading(true);
    providerService.getPublicProviderById(id)
      .then((res) => { if (!c) setProvider(res.data.data); })
      .catch((err) => { if (!c) toast.error(getErrorMessage(err) || "Failed to load provider"); })
      .finally(() => { if (!c) setLoading(false); });
    return () => { c = true; };
  }, [id, canViewDetails]);

  useEffect(() => {
    if (!id || !canViewDetails) return;
    let c = false;
    setSlotsLoading(true);
    slotService.getAvailable(id)
      .then((res) => { if (!c) setSlots(res.data.data); })
      .catch(() => {})
      .finally(() => { if (!c) setSlotsLoading(false); });
    return () => { c = true; };
  }, [id, canViewDetails]);

  const slotsByDate = useMemo(() => {
    const map = new Map<string, Slot[]>();
    slots.forEach((s) => { const list = map.get(s.date) ?? []; list.push(s); map.set(s.date, list); });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [slots]);

  const startConversation = async () => {
    if (!user || !provider) { router.push("/login"); return; }
    try {
      await messagingService.getOrCreateConversation({ providerId: provider.id });
      router.push("/messages");
    } catch { toast.error("Failed to start conversation"); }
  };

  if (isInitialized && !canViewDetails) {
    return <LoginRequiredPrompt title="Login to view provider" message="Please login or sign up to view provider details." />;
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 size={28} className="animate-spin text-[var(--primary)]" /></div>;
  }

  if (!provider) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-bold text-[var(--text-primary)]">Provider not found</p>
        <Link href="/providers" className="mt-3 text-sm font-semibold text-[var(--primary)] hover:underline">Back to providers</Link>
      </div>
    );
  }

  return (
    <div className="pb-12">
      {/* Breadcrumb */}
      <button onClick={() => router.back()} className="group mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--primary)]">
        <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" /> Back
      </button>

      <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
        {/* LEFT — Sticky profile card */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-[var(--shadow-card)]"
          >
            {/* Avatar region */}
            <div className="relative bg-gradient-to-br from-[#141414] to-[#2d2d2d] px-6 pb-14 pt-8 text-center text-white">
              <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-[var(--primary)]/20 blur-[60px]" />
              <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border-4 border-white/20 shadow-xl">
                {provider.profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={provider.profileImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[var(--primary)] text-3xl font-[900]">{provider.name[0]}</div>
                )}
              </div>
              <h1 className="mt-4 truncate text-xl font-[800] tracking-tight">{provider.businessName ?? provider.name}</h1>
              <div className="mt-2 flex items-center justify-center gap-3 text-[13px] text-white/60">
                <span className="flex items-center gap-1"><BadgeCheck size={13} /> Verified</span>
                <span className="flex items-center gap-1"><Star size={12} fill="#fbbf24" strokeWidth={0} /> {provider.rating || "New"}</span>
              </div>
              {provider.category && (
                <span className="mt-3 inline-block rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold backdrop-blur-sm">{provider.category.name}</span>
              )}
              {/* Online / Availability status */}
              {provider.onlineStatus && (
                <div className="mt-3 flex items-center justify-center">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold backdrop-blur-sm ${
                    provider.onlineStatus === "online"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-white/10 text-white/50"
                  }`}>
                    <span className={`h-2 w-2 rounded-full ${
                      provider.onlineStatus === "online" ? "bg-emerald-400 animate-pulse" : "bg-white/40"
                    }`} />
                    {provider.onlineStatus === "online"
                      ? (provider.engagementStatus === "busy" ? "Online · Busy" : "Online · Available")
                      : "Offline"}
                  </span>
                </div>
              )}
            </div>

            {/* Stats + actions */}
            <div className="relative -mt-6 rounded-t-[24px] bg-white px-6 pt-8 pb-6 space-y-5">
              {/* Pricing */}
              <div className="rounded-2xl bg-[var(--surface-3)] p-4 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Starting from</p>
                <p className="mt-1 text-[1.75rem] font-[900] tracking-tight text-[var(--text-primary)]">
                  {provider.price !== null ? `₹${provider.price.toFixed(0)}` : "On request"}
                </p>
              </div>

              {/* Service areas */}
              {provider.serviceAreas && provider.serviceAreas.length > 0 && (
                <div className="flex items-start gap-2.5">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-[var(--primary)]" />
                  <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">{provider.serviceAreas.join(", ")}</p>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={startConversation}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#141414] py-3.5 text-[14px] font-bold text-white transition hover:bg-black"
              >
                <MessageSquarePlus size={16} /> Message
              </button>
            </div>
          </motion.div>
        </aside>

        {/* RIGHT — Scrollable content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="space-y-6"
        >
          {/* About */}
          <section className="rounded-[22px] border border-[var(--border)] bg-white p-6">
            <h2 className="text-[17px] font-[800] text-[var(--text-primary)]">About</h2>
            {provider.description ? (
              <p className="mt-3 text-[14px] leading-[1.8] text-[var(--text-secondary)]">{provider.description}</p>
            ) : (
              <p className="mt-3 text-sm italic text-[var(--text-muted)]">No description provided.</p>
            )}
          </section>

          {/* Services — table style */}
          {provider.services.length > 0 && (
            <section className="rounded-[22px] border border-[var(--border)] bg-white overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-light)]">
                <h2 className="text-[17px] font-[800] text-[var(--text-primary)]">Services</h2>
                <span className="text-[12px] font-bold text-[var(--text-muted)]">{provider.services.length} available</span>
              </div>
              <div className="divide-y divide-[var(--border-light)]">
                {provider.services.map((s) => (
                  <Link key={s.id} href={`/services/${s.id}`} className="group flex items-center justify-between px-6 py-4 transition hover:bg-[var(--surface-2)]">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)]">{s.name}</p>
                      <p className="mt-0.5 line-clamp-1 text-[12px] text-[var(--text-muted)]">{s.description}</p>
                    </div>
                    <div className="flex items-center gap-3 pl-4">
                      <span className="text-[15px] font-[800] text-[var(--text-primary)]">₹{s.price.toFixed(0)}</span>
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-3)] text-[var(--text-muted)] transition group-hover:bg-[var(--primary)] group-hover:text-white group-hover:rotate-[-45deg]">
                        <ArrowUpRight size={13} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Sub-categories */}
          {provider.subcategoriesWorkedIn.length > 0 && (
            <section className="rounded-[22px] border border-[var(--border)] bg-white p-6">
              <h2 className="text-[17px] font-[800] text-[var(--text-primary)]">Specialisations</h2>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {provider.subcategoriesWorkedIn.map((sub) => (
                  <Link
                    key={sub}
                    href={`/providers/${provider.id}/sub/${encodeURIComponent(sub)}`}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-[13px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--primary)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)]"
                  >
                    {sub}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Availability */}
          <section className="rounded-[22px] border border-[var(--border)] bg-white p-6">
            <div className="flex items-center gap-2.5">
              <CalendarDays size={18} className="text-[var(--primary)]" />
              <h2 className="text-[17px] font-[800] text-[var(--text-primary)]">Availability</h2>
            </div>
            {slotsLoading ? (
              <div className="mt-5 flex items-center gap-2 text-sm text-[var(--text-muted)]"><Loader2 size={14} className="animate-spin" /> Loading...</div>
            ) : slotsByDate.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] p-8 text-center">
                <p className="font-semibold text-[var(--text-secondary)]">No upcoming slots published</p>
                <p className="mt-1 text-[13px] text-[var(--text-muted)]">Send them a message to check availability</p>
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                {slotsByDate.slice(0, 4).map(([date, daySlots]) => (
                  <div key={date}>
                    <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{formatDateLabel(date)}</p>
                    <div className="flex flex-wrap gap-2">
                      {daySlots.slice(0, 8).map((slot) => (
                        <span key={slot._id} className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2 text-[12px] font-bold text-emerald-700">
                          <Clock size={11} /> {slot.startTime}–{slot.endTime}
                        </span>
                      ))}
                      {daySlots.length > 8 && (
                        <span className="rounded-xl bg-[var(--surface-3)] px-3.5 py-2 text-[12px] font-semibold text-[var(--text-muted)]">
                          +{daySlots.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </motion.div>
      </div>
    </div>
  );
}
