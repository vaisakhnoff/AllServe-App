"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setApplicationStatus } from "@/features/auth";
import { providerService } from "@/services/provider";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowRight, BadgeCheck, Banknote, BriefcaseBusiness,
  CalendarClock, CheckCircle2, Clock3, AlertTriangle,
  ShieldCheck, Users, User, LogOut, FileText, RefreshCw, Sparkles,
  Zap, TrendingUp, ChevronDown, ChevronUp, Star, Award, Check
} from "lucide-react";

// ── Landing page for unauthenticated visitors ─────────────────────────────────

const benefits = [
  {
    title: "100% Flexible Hours",
    copy: "You are your own boss. Accept job requests whenever you choose to work.",
    icon: CalendarClock,
    badge: "Flexible",
    color: "from-emerald-500/10 to-teal-500/10",
    iconColor: "text-[#00B761]",
  },
  {
    title: "Higher Earning Potential",
    copy: "Keep maximum profits with 0% hidden commissions and transparent job values.",
    icon: Banknote,
    badge: "High Pay",
    color: "from-blue-500/10 to-indigo-500/10",
    iconColor: "text-blue-600",
  },
  {
    title: "Verified Customer Leads",
    copy: "Get discovered by pre-screened customers in your immediate service area.",
    icon: Users,
    badge: "Verified",
    color: "from-purple-500/10 to-violet-500/10",
    iconColor: "text-purple-600",
  },
  {
    title: "Direct & Secure Payouts",
    copy: "Timely bank transfers right after job completion with full transaction history.",
    icon: ShieldCheck,
    badge: "Secure",
    color: "from-amber-500/10 to-orange-500/10",
    iconColor: "text-amber-600",
  },
];

const faqs = [
  {
    q: "How do I get paid for completed jobs?",
    a: "Payouts are transferred directly to your registered bank account on a weekly basis or immediately after customer approval for digital payments.",
  },
  {
    q: "What documents do I need to register?",
    a: "You need a valid Government ID (Aadhaar/PAN/Passport), proof of experience or skill certification, and a profile photo.",
  },
  {
    q: "Are there any registration or monthly subscription fees?",
    a: "Signing up as an AllServe Pro partner is completely free. We do not charge any upfront registration fees.",
  },
  {
    q: "Can I choose my service location radius?",
    a: "Yes! You can define your service area and maximum travel distance right from your provider settings dashboard.",
  },
];

function LandingView() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [daysPerWeek, setDaysPerWeek] = useState(5);

  const estimatedEarnings = daysPerWeek * 1850 * 4;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/provider-portal" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00B761] text-white shadow-md shadow-[#00B761]/20">
              <BriefcaseBusiness size={20} />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900">AllServe Pro</span>
              <span className="ml-2 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#00B761] border border-emerald-100">
                Partner Portal
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/provider-portal/login"
              className="hidden sm:inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Sign In
            </Link>
            <Link
              href="/provider-portal/signup"
              className="rounded-xl bg-[#00B761] hover:bg-[#009E52] px-5 py-2 text-xs font-bold text-white shadow-sm shadow-[#00B761]/20 transition"
            >
              Become a Partner
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-emerald-50/20 to-[#F8FAFC] pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            {/* Left Content */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-1.5 text-xs font-extrabold text-[#00B761]">
                <Sparkles size={15} /> #1 Verified Service Partner Platform
              </div>

              <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.1]">
                Grow Your Service Business &amp; Earn Up To <span className="text-[#00B761]">₹75,000/mo</span>
              </h1>

              <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-600 font-medium max-w-2xl">
                Connect directly with thousands of nearby customers seeking trusted electricians, plumbers, home cleaners, and repair technicians.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap gap-4 items-center">
                <Link
                  href="/provider-portal/signup"
                  className="flex items-center gap-2 rounded-2xl bg-[#00B761] hover:bg-[#009E52] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#00B761]/25 hover:shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  Apply to Partner <ArrowRight size={18} />
                </Link>
                <Link
                  href="/provider-portal/login"
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-6 py-3.5 text-sm font-bold text-slate-700 shadow-2xs transition cursor-pointer"
                >
                  Check Application Status
                </Link>
              </div>

              {/* Trust badges */}
              <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-slate-100 pt-6">
                <div className="flex items-center gap-2">
                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-800">4.9/5 Rating</span>
                </div>

                <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <BadgeCheck size={16} className="text-[#00B761]" /> Verified Customers
                </div>

                <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Award size={16} className="text-[#00B761]" /> 0% Signup Fee
                </div>
              </div>
            </div>

            {/* Right Card — Live Partner Earnings Card */}
            <div className="relative">
              <div className="overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-2xl shadow-slate-950/20">
                <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Partner Income Hub</p>
                      <p className="text-sm font-bold text-white">Average Earnings Potential</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
                    Live Data
                  </span>
                </div>

                <div className="my-6">
                  <p className="text-xs font-semibold text-slate-400">Estimated Monthly Earnings</p>
                  <p className="text-4xl font-black text-white mt-1">₹{estimatedEarnings.toLocaleString("en-IN")}+</p>
                  <p className="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                    <Zap size={14} /> Based on working {daysPerWeek} days/week
                  </p>
                </div>

                {/* Days slider */}
                <div className="rounded-2xl bg-white/5 p-4 border border-white/10 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">Working days per week:</span>
                    <span className="text-emerald-400">{daysPerWeek} Days</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={7}
                    value={daysPerWeek}
                    onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                    className="w-full accent-[#00B761] cursor-pointer"
                  />
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/5 p-3 border border-white/10 text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Electrical</span>
                    <span className="font-extrabold text-white">₹799 / repair job</span>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3 border border-white/10 text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">AC Service</span>
                    <span className="font-extrabold text-white">₹1,299 / unit</span>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3 border border-white/10 text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Deep Cleaning</span>
                    <span className="font-extrabold text-white">₹1,899 / service</span>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3 border border-white/10 text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Plumbing</span>
                    <span className="font-extrabold text-white">₹650 / hour</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Why Partner With AllServe?</h2>
          <p className="mt-3 text-sm text-slate-600 font-medium">
            Everything you need to grow your home and commercial service business smoothly.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="group relative rounded-3xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 ${b.iconColor}`}>
                      <Icon size={22} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                      {b.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-[#00B761] transition-colors">
                    {b.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500 font-medium">{b.copy}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3 Step Application Process */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-12 shadow-sm">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold text-[#00B761] uppercase tracking-widest">Simple Onboarding</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Get Started in 3 Easy Steps</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3 relative">
            {[
              { title: "Register Account", desc: "Fill out basic contact information in less than 2 minutes.", icon: User },
              { title: "Submit Verification", desc: "Upload your ID document and select your service expertise.", icon: FileText },
              { title: "Start Earning", desc: "Get approved by admin and receive instant customer bookings.", icon: CheckCircle2 },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="flex flex-col items-center text-center relative z-10">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00B761] text-white shadow-md shadow-[#00B761]/30 mb-4 text-lg font-black">
                    <Icon size={24} />
                  </div>
                  <span className="text-[11px] font-bold text-[#00B761] uppercase tracking-wider">Step 0{i + 1}</span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">{step.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-2 font-medium max-w-xs">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Frequently Asked Questions</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 font-medium">Have questions before joining? We&apos;ve got answers.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={faq.q} className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-extrabold text-sm text-slate-800 hover:text-[#00B761] transition"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={18} className="text-[#00B761]" /> : <ChevronDown size={18} className="text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs leading-relaxed text-slate-600 border-t border-slate-100 font-medium">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer Banner */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-8 sm:p-12 text-center text-white shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Ready to Boost Your Daily Income?</h2>
          <p className="mt-3 text-sm text-slate-300 max-w-xl mx-auto font-medium">
            Join AllServe Pro today and start receiving high-value customer service requests in your area.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/provider-portal/signup"
              className="rounded-2xl bg-[#00B761] hover:bg-[#009E52] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#00B761]/30 transition-all cursor-pointer"
            >
              Apply to Partner Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Authenticated provider hub ────────────────────────────────────────────────

function AuthenticatedHub() {
  const { user, applicationStatus } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const { logout } = useAuth();

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
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [applicationStatus, dispatch]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/provider-portal" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00B761] text-white shadow-md shadow-[#00B761]/20">
              <BriefcaseBusiness size={20} />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight text-slate-900">AllServe Pro</p>
              <p className="text-xs font-semibold text-slate-500">Partner Hub</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700">{user?.name}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 hover:border-red-200 hover:text-red-600 transition cursor-pointer"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">Provider Portal</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Welcome back, {user?.name?.split(" ")[0]}. Here is your onboarding status.
          </p>
        </div>

        <StatusCard status={applicationStatus} />
      </section>
    </div>
  );
}

function StatusCard({ status }: { status?: string | null }) {
  if (status === "approved") {
    return (
      <div className="rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-[#00B761]">
          <CheckCircle2 size={36} />
        </div>
        <h2 className="mt-4 text-xl font-black text-slate-900">You&apos;re a Verified Provider!</h2>
        <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto font-medium">
          Your account is active and verified. Manage your services and start receiving jobs.
        </p>
        <div className="mt-6">
          <Link
            href="/provider-portal/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-[#00B761] hover:bg-[#009E52] px-7 py-3 text-xs font-bold text-white shadow-md shadow-[#00B761]/20 transition"
          >
            Go to Provider Dashboard <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-amber-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Clock3 size={36} />
          </div>
          <h2 className="mt-4 text-xl font-black text-slate-900">Application Under Review</h2>
          <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto font-medium">
            Our admin team is reviewing your application. This usually takes 1–3 business days.
          </p>
          <div className="mt-6">
            <Link
              href="/provider-portal/status"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <FileText size={16} /> View Full Status
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-2xs">
          <h3 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">What happens next?</h3>
          <ul className="space-y-2 text-xs font-semibold text-slate-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#00B761] shrink-0" /> Your documents are being verified
            </li>
            <li className="flex items-center gap-2">
              <Clock3 size={14} className="text-amber-500 shrink-0" /> Admin will review your profile details
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-indigo-500 shrink-0" /> You&apos;ll be notified once approved
            </li>
          </ul>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertTriangle size={36} />
        </div>
        <h2 className="mt-4 text-xl font-black text-slate-900">Application Needs Updates</h2>
        <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto font-medium">
          Your application was not approved. Review the feedback and resubmit.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/provider-portal/status"
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            View Rejection Details
          </Link>
          <Link
            href="/provider-portal/reapply"
            className="inline-flex items-center gap-2 rounded-xl bg-[#00B761] hover:bg-[#009E52] px-6 py-2.5 text-xs font-bold text-white transition"
          >
            <RefreshCw size={16} /> Reapply
          </Link>
        </div>
      </div>
    );
  }

  // Default: not_applied
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-[#00B761]">
          <FileText size={36} />
        </div>
        <h2 className="mt-4 text-xl font-black text-slate-900">Start Your Application</h2>
        <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto font-medium">
          Complete your provider application to get verified and start receiving jobs on AllServe.
        </p>
        <div className="mt-6">
          <Link
            href="/provider-portal/apply"
            className="inline-flex items-center gap-2 rounded-xl bg-[#00B761] hover:bg-[#009E52] px-7 py-3 text-xs font-bold text-white shadow-md shadow-[#00B761]/20 transition"
          >
            Start Application <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-2xs">
        <h3 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">Required Steps:</h3>
        <ul className="space-y-2 text-xs font-semibold text-slate-600">
          <li className="flex items-center gap-2">
            <BriefcaseBusiness size={14} className="text-[#00B761] shrink-0" /> Service category &amp; experience
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#00B761] shrink-0" /> Valid ID document (front &amp; back)
          </li>
          <li className="flex items-center gap-2">
            <Users size={14} className="text-[#00B761] shrink-0" /> Profile headshot photo
          </li>
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
    <main className="min-h-screen">
      {isProvider ? <AuthenticatedHub /> : <LandingView />}
    </main>
  );
}
