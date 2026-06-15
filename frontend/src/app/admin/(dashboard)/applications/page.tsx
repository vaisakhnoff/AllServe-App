"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2, XCircle, FileText, Loader2,
  Archive, TrendingUp, AlertCircle, ShieldCheck,
  Briefcase, X, Search, ChevronDown, MessageSquare,
} from "lucide-react";
import { adminService } from "@/services/admin";
import { ProviderApplication } from "@/types/provider.types";
import { getErrorMessage } from "@/utils/errorHandler";
import toast from "react-hot-toast";

// ---------------------------------------------------------------------------
// Predefined rejection reasons (mirrors backend RejectionReasonCode enum)
// ---------------------------------------------------------------------------
const REJECTION_REASONS = [
  { code: "UNCLEAR_DOCUMENTS",      label: "Verification proof is unclear or not visible" },
  { code: "DOCUMENT_MISMATCH",      label: "Uploaded document does not match entered information" },
  { code: "EXPIRED_DOCUMENT",       label: "Invalid or expired verification document" },
  { code: "INCOMPLETE_FIELDS",      label: "Required fields are incomplete" },
  { code: "DUPLICATE_APPLICATION",  label: "Duplicate application detected" },
  { code: "UNVERIFIABLE_BUSINESS",  label: "Business details could not be verified" },
  { code: "INVALID_CONTACT",        label: "Contact information is invalid" },
  { code: "OTHER",                  label: "Other (with custom remarks)" },
] as const;

type ReasonCode = (typeof REJECTION_REASONS)[number]["code"];

export default function AdminApplicationsPage() {
  const [filterStatus, setFilterStatus] = useState("pending");
  const [applications, setApplications] = useState<ProviderApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [reviewApp, setReviewApp] = useState<ProviderApplication | null>(null);
  // Structured rejection state
  const [selectedReasonCode, setSelectedReasonCode] = useState<ReasonCode | "">("");
  const [adminRemarks, setAdminRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  // ---------------------------------------------------------------------------
  // Data fetching with polling
  // ---------------------------------------------------------------------------
  const fetchApplications = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await adminService.getApplications();
      setApplications(res.data.data);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to load applications");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications(true);
    // Poll every 15 s so admin sees new submissions without refreshing
    const interval = setInterval(() => fetchApplications(false), 15000);
    return () => clearInterval(interval);
  }, []);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const handleApprove = async () => {
    if (!reviewApp) return;
    setActionLoading(true);
    try {
      await adminService.approveProvider(reviewApp._id);
      setSuccessMessage("Application Approved successfully.");
      closeModal();
      await fetchApplications();
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to approve application");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reviewApp) return;

    // Validate: a reason code must be selected
    if (!selectedReasonCode) {
      toast.error("Please select a rejection reason before proceeding.");
      return;
    }
    // Validate: custom remarks required when "Other" is selected
    if (selectedReasonCode === "OTHER" && !adminRemarks.trim()) {
      toast.error("Please provide custom remarks when selecting 'Other'.");
      return;
    }

    setActionLoading(true);
    try {
      await adminService.rejectProvider(
        reviewApp._id,
        selectedReasonCode,
        adminRemarks.trim() || undefined
      );
      setSuccessMessage("Application Rejected successfully.");
      closeModal();
      await fetchApplications();
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to reject application");
    } finally {
      setActionLoading(false);
    }
  };

  const closeModal = () => {
    setReviewApp(null);
    setSelectedReasonCode("");
    setAdminRemarks("");
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const filteredApps = applications.filter((a) => {
    const matchesStatus = filterStatus === "all" || a.applicationStatus === filterStatus;
    const name = a.businessName || a.name || "";
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getInitials = (name: string) =>
    name ? name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() : "U";

  const handleViewDocument = (doc: string) => {
    if (doc.startsWith("data:image")) {
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(
          `<html><body style="margin:0;display:flex;justify-content:center;align-items:center;background:#0f172a;"><img src="${doc}" style="max-width:100%;max-height:100vh;object-fit:contain;" /></body></html>`
        );
        win.document.close();
      }
    } else if (doc.startsWith("http")) {
      window.open(doc, "_blank");
    } else {
      toast.error("This document is unavailable. (Older application format)");
    }
  };

  // Stats
  const pendingCount   = applications.filter((a) => a.applicationStatus === "pending").length;
  const approvedCount  = applications.filter((a) => a.applicationStatus === "approved").length;
  const verifiedRate   = applications.length > 0 ? Math.round((approvedCount / applications.length) * 100) : 0;

  let totalExp = 0;
  applications.forEach((a) => {
    const expNum = parseInt(String(a.experience || "0").replace(/\D/g, "")) || 0;
    totalExp += expNum;
  });
  const avgExp = applications.length > 0 ? (totalExp / applications.length).toFixed(1) : "0";

  // Is the reject button enabled?
  const canReject =
    !!selectedReasonCode &&
    (selectedReasonCode !== "OTHER" || adminRemarks.trim().length > 0);

  // ---------------------------------------------------------------------------
  // Success screen
  // ---------------------------------------------------------------------------
  if (successMessage) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="max-w-sm w-full rounded-2xl bg-white p-8 text-center shadow-lg border border-slate-100 flex flex-col items-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <CheckCircle2 size={36} strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Notification Sent</h2>
          <p className="text-slate-500 mb-8">{successMessage} The provider has been notified.</p>
          <button
            onClick={() => setSuccessMessage("")}
            className="w-full flex justify-center items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <Archive size={18} /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Provider Applications</h1>
          <p className="text-slate-500 mt-1 text-sm">Review and verify new service provider registrations.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors">
            Export Report
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white hover:bg-[#4338CA] transition-colors shadow-sm">
            View Archive
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pending Approval", value: pendingCount, icon: Archive, color: "text-indigo-600 bg-indigo-50" },
          { label: "Avg Experience",   value: `${avgExp}y`, icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
          { label: "Total Applications", value: applications.length, icon: AlertCircle, color: "text-amber-600 bg-amber-50" },
          { label: "Verification Rate", value: `${verifiedRate}%`, icon: ShieldCheck, color: "text-indigo-600 bg-indigo-50" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
              <div className={`p-2 rounded-lg ${color}`}><Icon size={16} /></div>
            </div>
            <span className="text-3xl font-black text-slate-900">{value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex gap-1 w-full sm:w-auto overflow-x-auto p-1">
          {["pending", "approved", "rejected", "all"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                filterStatus === status ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search applications..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-indigo-500 focus:bg-white transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Application Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64 text-slate-400">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="flex justify-center items-center h-64 text-slate-500 bg-white rounded-2xl border border-slate-100 shadow-sm">
          No applications found.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredApps.map((app) => {
            const name   = app.businessName || app.name || "Unknown";
            const catName = typeof app.categoryId === "string" ? app.categoryId : app.categoryId?.name || "Service";
            return (
              <div key={app._id} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col gap-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      {getInitials(name)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 leading-tight">{name}</h3>
                      <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-xs font-medium uppercase tracking-wider">
                        <Briefcase size={12} /> {catName}
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    app.applicationStatus === "pending"  ? "bg-indigo-50 text-indigo-600"  :
                    app.applicationStatus === "approved" ? "bg-emerald-50 text-emerald-600" :
                    "bg-red-50 text-red-600"
                  }`}>{app.applicationStatus}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Experience</span>
                    <span className="font-medium text-slate-900">{app.experience} Years</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Documents</span>
                    <span className="font-medium text-indigo-600">{app.documents?.length || 0} uploaded</span>
                  </div>
                </div>

                <div className="flex pt-2">
                  <button
                    onClick={() => { setReviewApp(app); setSelectedReasonCode(""); setAdminRemarks(""); }}
                    className="w-full flex justify-center items-center gap-2 rounded-xl bg-[#4F46E5] text-white px-4 py-3 text-sm font-semibold hover:bg-[#4338CA] transition-colors shadow-sm"
                  >
                    {app.applicationStatus === "pending" ? "Review Application" : "View Application"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          Review Modal
      ───────────────────────────────────────────────────────────────────── */}
      {reviewApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">

            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Review Application</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Decision for <span className="font-semibold text-slate-700">{reviewApp.businessName || reviewApp.name}</span>
                </p>
              </div>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">

              {/* Applicant Summary */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-full bg-[#4F46E5] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                  {getInitials(reviewApp.businessName || reviewApp.name || "")}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900 truncate">
                    {typeof reviewApp.categoryId === "string" ? reviewApp.categoryId : reviewApp.categoryId?.name || "Specialist"}
                  </h4>
                  <p className="text-sm text-slate-600 mt-0.5">{reviewApp.experience} Years Experience</p>
                </div>
                <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  reviewApp.applicationStatus === "pending"  ? "bg-indigo-50 text-indigo-600"  :
                  reviewApp.applicationStatus === "approved" ? "bg-emerald-50 text-emerald-600" :
                  "bg-red-50 text-red-600"
                }`}>{reviewApp.applicationStatus}</span>
              </div>

              {/* Application Details */}
              <div className="space-y-3 mb-6 text-sm">
                {[
                  ["Service Area", reviewApp.serviceArea],
                  ["Email", reviewApp.email || "N/A"],
                  ["Phone", reviewApp.phone],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-medium text-slate-800 text-right max-w-[60%] truncate">{v}</span>
                  </div>
                ))}
                <div>
                  <span className="text-slate-500 mb-1 block">Description</span>
                  <p className="font-medium text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm leading-relaxed">
                    {reviewApp.description}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 mb-2 block">Uploaded Documents</span>
                  <div className="flex gap-2">
                    {reviewApp.documents?.map((doc, i) => (
                      <button
                        key={i}
                        onClick={() => handleViewDocument(doc)}
                        className="flex items-center gap-2 h-10 px-3 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors border border-indigo-100"
                        title={`View Document ${i + 1}`}
                      >
                        <FileText size={16} />
                        <span className="font-medium text-xs">Doc {i + 1}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Rejection Section (pending only) ── */}
              {reviewApp.applicationStatus === "pending" && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <XCircle size={16} className="text-red-500" />
                    <h3 className="font-semibold text-slate-800 text-sm">Rejection Reason <span className="text-red-500">*</span></h3>
                  </div>

                  {/* Predefined reason chips */}
                  <div className="grid grid-cols-1 gap-2">
                    {REJECTION_REASONS.map(({ code, label }) => (
                      <button
                        key={code}
                        onClick={() => setSelectedReasonCode(code)}
                        className={`flex items-center gap-3 w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                          selectedReasonCode === code
                            ? "border-red-400 bg-red-50 text-red-800 shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-white"
                        }`}
                      >
                        <div className={`h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                          selectedReasonCode === code ? "border-red-500" : "border-slate-300"
                        }`}>
                          {selectedReasonCode === code && (
                            <div className="h-2 w-2 rounded-full bg-red-500" />
                          )}
                        </div>
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Admin Remarks (always shown; required when OTHER) */}
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <MessageSquare size={14} />
                      Admin Remarks
                      {selectedReasonCode === "OTHER"
                        ? <span className="text-red-500 font-normal">(required for &quot;Other&quot;)</span>
                        : <span className="text-slate-400 font-normal">(optional)</span>}
                    </label>
                    <textarea
                      className={`w-full border rounded-xl p-3 text-sm outline-none focus:ring-2 transition-colors bg-white resize-none h-24 ${
                        selectedReasonCode === "OTHER" && !adminRemarks.trim()
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
                      }`}
                      placeholder={
                        selectedReasonCode === "OTHER"
                          ? "Describe the specific issue with this application..."
                          : "Add any additional notes for the provider (optional)..."
                      }
                      value={adminRemarks}
                      onChange={(e) => setAdminRemarks(e.target.value)}
                    />
                    {selectedReasonCode === "OTHER" && !adminRemarks.trim() && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> Custom remarks are required when &quot;Other&quot; is selected.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Show existing rejection details for already-rejected apps */}
              {reviewApp.applicationStatus === "rejected" && (reviewApp as any).rejectionReason && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-red-500 mb-1">Rejection Decision</p>
                  <p className="text-sm font-semibold text-red-800">{(reviewApp as any).rejectionReason}</p>
                  {(reviewApp as any).adminRemarks && (
                    <p className="mt-2 text-sm text-red-700 italic">&ldquo;{(reviewApp as any).adminRemarks}&rdquo;</p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              {reviewApp.applicationStatus === "pending" && (
                <>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading || !canReject}
                    title={!canReject ? "Select a rejection reason first" : undefined}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#DC2626]"
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                    Reject Application
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#10B981] text-white hover:bg-[#059669] transition-colors flex items-center gap-2 shadow-sm shadow-emerald-500/20"
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Approve Provider
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
