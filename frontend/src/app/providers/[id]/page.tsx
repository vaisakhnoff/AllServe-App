"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import {
  ArrowLeft, Star, BadgeCheck, MapPin, Loader2, MessageSquarePlus,
  Layers, Clock, CalendarDays, Sparkles,
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
    let cancelled = false;
    setLoading(true);
    providerService.getPublicProviderById(id)
      .then((res) => { if (!cancelled) setProvider(res.data.data); })
      .catch((err) => { if (!cancelled) toast.error(getErrorMessage(err) || "Failed to load provider"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, canViewDetails]);

  useEffect(() => {
    if (!id || !canViewDetails) return;
    let cancelled = false;
    setSlotsLoading(true);
    slotService.getAvailable(id)
      .then((res) => { if (!cancelled) setSlots(res.data.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setSlotsLoading(false); });
    return () => { cancelled = true; };
  }, [id, canViewDetails]);

  const slotsByDate = useMemo(() => {
    const map = new Map<string, Slot[]>();
    slots.forEach((s) => { const list = map.get(s.date) ?? []; list.push(s); map.set(s.date, list); });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [slots]);

  if (isInitialized && !canViewDetails) {
    return (
      <LoginRequiredPrompt
        title="Login to view provider"
        message="Please login or sign up to view provider details, availability, and services."
      />
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--surface-2)]">
        <Loader2 size={32} className="animate-spin text-[var(--primary)]" />
      </main>
    );
  }

  if (!provider) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--surface-2)]">
        <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-4"><Sparkles size={24} className="text-purple-400" /></div>
        <p className="font-bold text-slate-600 text-lg">Provider not found</p>
        <Link href="/providers" className="mt-4 text-sm font-bold text-[var(--primary)] hover:underline">Back to providers</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[var(--primary)] transition-colors">
          <ArrowLeft size={15} /> Back
        </button>

        {/* Premium Hero Banner */}
        <header className="overflow-hidden rounded-[20px] border border-purple-200/40 bg-gradient-to-br from-[#6D28FF] via-[#7c3aed] to-[#8B5CF6] text-white shadow-xl shadow-purple-500/10 fade-up">
          <div className="relative p-5 sm:p-7">
            <div className="absolute top-[-60px] right-[-40px] w-[250px] h-[250px] bg-white/5 rounded-full blur-2xl" />
            <div className="absolute bottom-[-30px] left-[-30px] w-[180px] h-[180px] bg-white/5 rounded-full blur-2xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm text-3xl font-extrabold overflow-hidden ring-2 ring-white/20">
                {provider.profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={provider.profileImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  provider.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-[clamp(1.6rem,4vw,2.25rem)] font-extrabold truncate tracking-tight">
                  {provider.businessName ?? provider.name}
                </h1>
                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-sm font-semibold">
                  <span className="inline-flex items-center gap-1.5 text-purple-100"><BadgeCheck size={15} /> Verified</span>
                  <span className="inline-flex items-center gap-1.5 text-amber-200"><Star size={14} fill="#fbbf24" strokeWidth={0} /> {provider.rating || "New"}</span>
                  {provider.category && (
                    <span className="rounded-full bg-white/15 backdrop-blur-sm px-3.5 py-1 text-xs font-bold">{provider.category.name}</span>
                  )}
                </div>
              </div>
              <button
                onClick={async () => {
                  if (!user) { router.push("/login"); return; }
                  try {
                    await messagingService.getOrCreateConversation({ providerId: provider.id });
                    router.push("/messages");
                  } catch { toast.error("Failed to start conversation"); }
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[var(--primary)] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <MessageSquarePlus size={16} /> Message provider
              </button>
            </div>
          </div>
        </header>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          {/* Left column */}
          <section className="space-y-5">
            {/* About */}
            <article className="rounded-[18px] border border-slate-200/60 bg-white p-5 sm:p-6">
              <h2 className="text-lg font-extrabold text-slate-900">About</h2>
              {provider.description ? (
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{provider.description}</p>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No description provided.</p>
              )}
              {provider.serviceAreas && provider.serviceAreas.length > 0 && (
                <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full">
                  <MapPin size={12} className="text-[var(--primary)]" /> {provider.serviceAreas.join(", ")}
                </p>
              )}
            </article>

            {/* Subcategories */}
            <article className="rounded-[18px] border border-slate-200/60 bg-white p-5 sm:p-6">
              <h2 className="flex items-center gap-2.5 text-lg font-extrabold text-slate-900">
                <Layers size={18} className="text-[var(--primary)]" /> Sub-categories
              </h2>
              {provider.subcategoriesWorkedIn.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No sub-categories tagged yet.</p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {provider.subcategoriesWorkedIn.map((sub) => (
                    <Link key={sub} href={`/providers/${provider.id}/sub/${encodeURIComponent(sub)}`}
                      className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-800 transition-all hover:border-purple-200 hover:bg-purple-50 hover:text-[var(--primary)] hover:-translate-y-0.5 hover:shadow-sm">
                      {sub}
                    </Link>
                  ))}
                </div>
              )}
            </article>

            {/* Slots */}
            <article className="rounded-[18px] border border-slate-200/60 bg-white p-5 sm:p-6">
              <h2 className="flex items-center gap-2.5 text-lg font-extrabold text-slate-900">
                <CalendarDays size={18} className="text-[var(--primary)]" /> Upcoming availability
              </h2>
              {slotsLoading ? (
                <div className="mt-5 flex items-center gap-2 text-sm text-slate-500"><Loader2 size={14} className="animate-spin" /> Loading slots...</div>
              ) : slotsByDate.length === 0 ? (
                <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                  <p className="font-bold text-slate-600">No published slots</p>
                  <p className="mt-1 text-xs text-slate-500">Try messaging the provider directly</p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {slotsByDate.slice(0, 5).map(([date, daySlots]) => (
                    <div key={date}>
                      <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-400">{formatDateLabel(date)}</p>
                      <div className="flex flex-wrap gap-2">
                        {daySlots.slice(0, 12).map((slot) => (
                          <span key={slot._id} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
                            <Clock size={11} /> {slot.startTime}–{slot.endTime}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-slate-500 font-medium">Open a service to book a slot.</p>
                </div>
              )}
            </article>
          </section>

          {/* Right column */}
          <aside className="space-y-4">
            <div className="rounded-[18px] border border-slate-200/60 bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.03)]">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pricing</p>
              <p className="mt-2 text-[2rem] font-extrabold text-slate-950 tracking-tight">
                {provider.price !== null ? `from ₹${provider.price.toFixed(0)}` : "On request"}
              </p>
              <p className="text-sm text-slate-500 mt-1">across active services</p>
            </div>

            {provider.services.length > 0 && (
              <div className="rounded-[18px] border border-slate-200/60 bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.03)]">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">All services</p>
                <ul className="space-y-3">
                  {provider.services.slice(0, 6).map((s) => (
                    <li key={s.id} className="flex items-center justify-between text-sm">
                      <Link href={`/services/${s.id}`} className="truncate font-semibold text-slate-700 hover:text-[var(--primary)] transition-colors">{s.name}</Link>
                      <span className="font-extrabold text-slate-900 shrink-0 ml-3">₹{s.price.toFixed(0)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={async () => {
                if (!user) { router.push("/login"); return; }
                try {
                  await messagingService.getOrCreateConversation({ providerId: provider.id });
                  router.push("/messages");
                } catch { toast.error("Failed to start conversation"); }
              }}
              className="w-full rounded-[14px] bg-gradient-to-r from-[#6D28FF] to-[#8B5CF6] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <MessageSquarePlus size={16} /> Message provider
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}
