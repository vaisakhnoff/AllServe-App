"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setApplicationStatus } from "@/features/auth";
import { providerService } from "@/services/provider";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowRight, BadgeCheck, Banknote, BriefcaseBusiness,
  CalendarClock, CheckCircle2, Clock3, AlertTriangle,
  ShieldCheck, Users, LogOut, FileText, RefreshCw,
} from "lucide-react";

// ── Landing page for unauthenticated visitors ─────────────────────────────────

const benefits = [
  { title: "Flexible work hours", copy: "Accept jobs around your own schedule and availability.", icon: CalendarClock },
  { title: "High earning potential", copy: "Set competitive service pricing and track every payout.", icon: Banknote },
  { title: "Access to customers", copy: "Get discovered by nearby customers looking for trusted professionals.", icon: Users },
  { title: "Secure payments", copy: "Transparent job values and platform-backed payment tracking.", icon: ShieldCheck },
];

function LandingView() {
  return (
    <>
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/provider-portal" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
            <BriefcaseBusiness size={20} />
          </div>
          <div>
            <p className="text-lg font-black tracking-tight">AllServe</p>
            <p className="text-xs font-semibold text-slate-500">Provider Portal</p>
          </div>
        </Link>
        <Link href="/provider-portal/login" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600">
          Provider Login
        </Link>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-20 lg:pt-16">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-2 text-sm font-bold text-indigo-700 shadow-sm">
            <BadgeCheck size={16} /> Verified professionals marketplace
          </div>
          <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-tight text-slate-950 sm:text-6xl">
            Start earning by offering your services
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            Join AllServe as a professional service provider and manage jobs, services, earnings, and customer communication from one clean portal.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/provider-portal/signup" className="btn btn-primary px-7 py-3 text-base">
              Apply Now <ArrowRight size={18} />
            </Link>
            <Link href="/provider-portal/login" className="btn btn-ghost px-7 py-3 text-base">
              Check Status
            </Link>
          </div>
        </div>
        <div className="premium-card overflow-hidden p-6">
          <div className="rounded-[1.25rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-800 p-6 text-white">
            <p className="text-sm font-semibold text-indigo-200">Earnings Preview</p>
            <p className="mt-3 text-4xl font-black">₹45,000+</p>
            <p className="mt-2 text-sm text-indigo-100">Monthly potential for active professionals</p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {["₹799 / repair job", "₹1,299 / AC service", "₹1,899 / cleaning", "₹450 / hour average"].map((item) => (
                <div key={item} className="rounded-2xl bg-white/10 p-4 text-sm font-bold backdrop-blur">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.title} className="premium-card soft-hover p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Icon size={20} /></div>
                <h3 className="font-black text-slate-950">{b.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{b.copy}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="premium-card p-6">
          <h2 className="text-2xl font-black">How it works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {["Sign Up & Verify", "Submit Application", "Start Receiving Jobs"].map((step, i) => (
              <div key={step} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-black text-white">{i + 1}</span>
                <p className="mt-4 text-lg font-black">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

// ── Authenticated provider hub ────────────────────────────────────────────────

function AuthenticatedHub() {
  const { user, applicationStatus } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const { logout } = useAuth();

  // Refetch live application status from the server every time the hub mounts.
  // This keeps the UI in sync with admin-side approve/reject changes that the
  // JWT (issued at login time) doesn't know about.
  useEffect(() => {
    let cancelled = false;
    providerService
      .getApplicationStatus()
      .then((res) => {
        if (cancelled) return;
        const status = res.data.data?.status;
        if (status && status !== applicationStatus) {
          dispatch(
            setApplicationStatus(
              status as "not_applied" | "pending" | "approved" | "rejected" | "suspended"
            )
          );
        }
      })
      .catch(() => {
        // Silently ignore — fall back to the JWT-decoded status already in redux.
      });
    return () => {
      cancelled = true;
    };
    // Run once on mount; we don't want a re-run when redux updates from this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/provider-portal" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
            <BriefcaseBusiness size={20} />
          </div>
          <div>
            <p className="text-lg font-black tracking-tight">AllServe</p>
            <p className="text-xs font-semibold text-slate-500">Provider Portal</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-700">{user?.name}</span>
          <button onClick={logout} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:border-red-200 hover:text-red-600 transition">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-950">Provider Portal</h1>
          <p className="mt-2 text-slate-600">Welcome back, {user?.name?.split(" ")[0]}. Here&apos;s your onboarding status.</p>
        </div>

        {/* Status Card */}
        <StatusCard status={applicationStatus} />
      </section>
    </>
  );
}

function StatusCard({ status }: { status?: string | null }) {
  if (status === "approved") {
    return (
      <div className="premium-card p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 border-2 border-emerald-100 text-emerald-600">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="mt-4 text-xl font-black text-slate-900">You&apos;re a Verified Provider!</h2>
        <p className="mt-2 text-sm text-slate-500">Your account is active. Manage your services and start receiving jobs.</p>
        <div className="mt-6">
          <Link href="/provider-portal/dashboard" className="btn btn-primary px-8 py-3">
            Go to Dashboard <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="space-y-4">
        <div className="premium-card p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 border-2 border-amber-100 text-amber-600">
            <Clock3 size={32} />
          </div>
          <h2 className="mt-4 text-xl font-black text-slate-900">Application Under Review</h2>
          <p className="mt-2 text-sm text-slate-500">Our team is reviewing your application. This usually takes 1–3 business days.</p>
          <div className="mt-6">
            <Link href="/provider-portal/status" className="btn btn-ghost px-6 py-2.5">
              <FileText size={16} /> View Full Status
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-3">What happens next?</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" /> Your documents are being verified</li>
            <li className="flex items-start gap-2"><Clock3 size={14} className="text-amber-500 mt-0.5 shrink-0" /> Admin will review your profile details</li>
            <li className="flex items-start gap-2"><ShieldCheck size={14} className="text-indigo-500 mt-0.5 shrink-0" /> You&apos;ll be notified once approved</li>
          </ul>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="premium-card p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 border-2 border-red-100 text-red-600">
          <AlertTriangle size={32} />
        </div>
        <h2 className="mt-4 text-xl font-black text-slate-900">Application Needs Updates</h2>
        <p className="mt-2 text-sm text-slate-500">Your application was not approved. Review the feedback and resubmit.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/provider-portal/status" className="btn btn-ghost px-6 py-2.5">
            View Rejection Details
          </Link>
          <Link href="/provider-portal/reapply" className="btn btn-primary px-6 py-2.5">
            <RefreshCw size={16} /> Reapply
          </Link>
        </div>
      </div>
    );
  }

  // Default: not_applied
  return (
    <div className="space-y-4">
      <div className="premium-card p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 border-2 border-indigo-100 text-indigo-600">
          <FileText size={32} />
        </div>
        <h2 className="mt-4 text-xl font-black text-slate-900">Start Your Application</h2>
        <p className="mt-2 text-sm text-slate-500">Complete your provider application to get verified and start receiving jobs on AllServe.</p>
        <div className="mt-6">
          <Link href="/provider-portal/apply" className="btn btn-primary px-8 py-3">
            Start Application <ArrowRight size={16} />
          </Link>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-3">You&apos;ll need:</h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2"><BriefcaseBusiness size={14} className="text-indigo-500 mt-0.5 shrink-0" /> Service category &amp; experience</li>
          <li className="flex items-start gap-2"><ShieldCheck size={14} className="text-indigo-500 mt-0.5 shrink-0" /> Valid ID document (front &amp; back)</li>
          <li className="flex items-start gap-2"><Users size={14} className="text-indigo-500 mt-0.5 shrink-0" /> Profile headshot photo</li>
        </ul>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProviderPortalPage() {
  const { isAuthenticated, role } = useSelector((state: RootState) => state.auth);
  const isProvider = isAuthenticated && role === "provider";

  return (
    <main className="provider-shell min-h-screen">
      {isProvider ? <AuthenticatedHub /> : <LandingView />}
    </main>
  );
}
