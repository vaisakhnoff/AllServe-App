"use client";

/**
 * Provider Application Status Page
 *
 * Authenticated flow:
 *   - Provider logs in
 *   - Redirects here if status is "pending", "suspended", or "rejected" (from login redirect or AuthRouteGuard)
 *   - Fetches the application status from the backend
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  AlertTriangle, CheckCircle2, Clock3, FileUp,
  Loader2, CalendarDays, MessageSquare, RefreshCw,
  Ban
} from "lucide-react";
import { providerService } from "@/services/provider";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/utils/errorHandler";
import { useRouter } from "next/navigation";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  not_applied: {
    title: "Application Not Started",
    copy: "You have not submitted a provider application yet. Let's get started.",
    icon: FileUp,
    iconBg: "bg-slate-50 border-slate-100 text-slate-600",
    badge: "bg-slate-100 text-slate-700",
  },
  pending: {
    title: "Application Under Review",
    copy: "Our verification team is checking your profile details and documents. This usually takes 1–3 business days.",
    icon: Clock3,
    iconBg: "bg-amber-50 border-amber-100 text-amber-600",
    badge: "bg-amber-100 text-amber-700",
  },
  approved: {
    title: "You Are Now a Verified Provider",
    copy: "Congratulations! Your profile is active. You can manage services and start receiving job requests.",
    icon: CheckCircle2,
    iconBg: "bg-emerald-50 border-emerald-100 text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
  },
  rejected: {
    title: "Application Requires Updates",
    copy: "Your application was not approved. Review the feedback below, make the necessary corrections, and reapply.",
    icon: AlertTriangle,
    iconBg: "bg-red-50 border-red-100 text-red-600",
    badge: "bg-red-100 text-red-700",
  },
  suspended: {
    title: "Account Suspended",
    copy: "Your provider account has been temporarily suspended by an administrator. Please contact support.",
    icon: Ban,
    iconBg: "bg-red-50 border-red-100 text-red-600",
    badge: "bg-red-100 text-red-700",
  },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

interface StatusData {
  status: StatusKey;
  rejectionReason: string | null;
  rejectionReasonCode: string | null;
  adminRemarks: string | null;
  rejectedAt: string | null;
  submittedAt?: string;
  updatedAt?: string;
}

// ─── Helper: format date nicely ───────────────────────────────────────────────
function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function ProviderStatusPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  
  const { isAuthenticated, role } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || role !== "provider") {
      router.replace("/provider-portal/login");
      return;
    }

    const fetchStatus = async () => {
      try {
        const res = await providerService.getApplicationStatus();
        const data = res.data.data;
        
        setStatusData({
          status: (data.status as StatusKey) || "pending",
          rejectionReason: data.rejectionReason ?? null,
          rejectionReasonCode: (data as unknown).rejectionReasonCode ?? null,
          adminRemarks: (data as unknown).adminRemarks ?? null,
          rejectedAt: (data as unknown).rejectedAt ?? null,
          submittedAt: (data as unknown).submittedAt,
          updatedAt: (data as unknown).updatedAt,
        });
      } catch (err) {
        toast.error(getErrorMessage(err) || "Failed to fetch status");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [isAuthenticated, role, router]);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="provider-shell flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </main>
    );
  }

  if (!statusData) {
    return (
      <main className="provider-shell flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500">Could not load application status.</p>
        </div>
      </main>
    );
  }

  const config = STATUS_CONFIG[statusData.status] || STATUS_CONFIG.pending;
  const Icon   = config.icon;
  const isRejected = statusData.status === "rejected";

  return (
    <main className="provider-shell flex min-h-screen flex-col px-4 py-12">
      <div className="w-full max-w-2xl mx-auto">
        <div className="space-y-5">
          {/* ── Status Card ─────────────────────────────────────────────── */}
          <div className="premium-card p-8 text-center">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 ${config.iconBg}`}>
              <Icon size={32} />
            </div>

            <div className="mt-4 inline-flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${config.badge}`}>
                {statusData.status.replace("_", " ")}
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-black text-slate-900">{config.title}</h1>
            <p className="mx-auto mt-3 max-w-md text-slate-500 text-sm">{config.copy}</p>

            {/* Submission / Update Dates */}
            {(statusData.submittedAt || statusData.updatedAt) && (
              <div className="mt-5 flex flex-wrap justify-center gap-4 text-xs text-slate-400">
                {statusData.submittedAt && (
                  <span className="flex items-center gap-1">
                    <CalendarDays size={12} />
                    Submitted: {formatDate(statusData.submittedAt)}
                  </span>
                )}
                {statusData.updatedAt && (
                  <span className="flex items-center gap-1">
                    <RefreshCw size={12} />
                    Last updated: {formatDate(statusData.updatedAt)}
                  </span>
                )}
              </div>
            )}

            {/* Actions Based on Status */}
            {statusData.status === "not_applied" && (
              <div className="mt-8">
                <Link href="/provider-portal/apply" className="btn btn-primary px-8 py-3">
                  Start Application
                </Link>
              </div>
            )}

            {statusData.status === "approved" && (
              <div className="mt-8">
                <Link href="/provider-portal/dashboard" className="btn btn-primary px-8 py-3">
                  Go to Dashboard
                </Link>
              </div>
            )}

            {/* Pending checklist */}
            {statusData.status === "pending" && (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
                <p className="text-sm font-black text-slate-900 mb-3">Verification checklist</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {["Basic profile", "Professional details", "Documents"].map((item) => (
                    <div key={item} className="rounded-xl bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm border border-slate-100 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-400" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Rejection Detail Card (only shown when rejected) ─────────── */}
          {isRejected && (
            <div className="rounded-2xl border border-red-200 bg-white overflow-hidden shadow-sm">

              {/* Header */}
              <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-800">Rejection Details</p>
                  {statusData.rejectedAt && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                      <CalendarDays size={10} />
                      Rejected on {formatDate(statusData.rejectedAt)}
                    </p>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                {/* Reason */}
                {statusData.rejectionReason && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Reason</p>
                    <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                      <div className="mt-0.5 h-2 w-2 rounded-full bg-red-500 shrink-0" />
                      <p className="text-sm font-semibold text-red-800">{statusData.rejectionReason}</p>
                    </div>
                  </div>
                )}

                {/* Admin Remarks */}
                {statusData.adminRemarks && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                      <MessageSquare size={11} /> Admin Remarks
                    </p>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                      <p className="text-sm text-slate-700 italic leading-relaxed">
                        &ldquo;{statusData.adminRemarks}&rdquo;
                      </p>
                    </div>
                  </div>
                )}

                {/* What to fix guidance */}
                <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3">
                  <p className="text-xs font-bold text-indigo-700 mb-1">What to do next</p>
                  <p className="text-xs text-indigo-600 leading-relaxed">
                    Review the feedback above, correct the flagged issues in your application, and resubmit. Your previously entered details will be pre-loaded so you only need to fix the identified problems.
                  </p>
                </div>
              </div>

              {/* Reapply Action */}
              <div className="px-6 py-5 border-t border-slate-100 bg-slate-50">
                <Link
                  href="/provider-portal/reapply"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/20"
                >
                  <RefreshCw size={15} /> Update &amp; Reapply
                </Link>
              </div>
            </div>
          )}

          {/* Back home link / Logout */}
          <div className="text-center">
            <Link href="/provider-portal" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
              ← Back to Provider Home
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
