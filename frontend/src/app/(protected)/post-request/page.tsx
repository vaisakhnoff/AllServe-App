"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Send, MapPin, Calendar, Clock, IndianRupee, AlertCircle,
  ImagePlus, ArrowLeft, CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { categoryService } from "@/services/category";
import { serviceRequestService } from "@/services/serviceRequest";
import { Category } from "@/types/category.types";
import { BudgetType, UrgencyLevel } from "@/types/serviceRequest.types";
import { getErrorMessage } from "@/utils/errorHandler";

const urgencyOptions: { value: UrgencyLevel; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  { value: "medium", label: "Medium", color: "border-amber-200 bg-amber-50 text-amber-700" },
  { value: "high", label: "High", color: "border-orange-200 bg-orange-50 text-orange-700" },
  { value: "urgent", label: "Urgent", color: "border-red-200 bg-red-50 text-red-700" },
];

const budgetOptions: { value: BudgetType; label: string; desc: string }[] = [
  { value: "fixed", label: "Fixed", desc: "Specific budget" },
  { value: "flexible", label: "Flexible", desc: "A range" },
  { value: "quote_needed", label: "Quote me", desc: "Let providers price it" },
];

export default function PostRequestPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    categoryId: "", subCategory: "", title: "", description: "",
    budgetType: "flexible" as BudgetType, budgetMin: "", budgetMax: "",
    preferredDate: "", preferredTime: "",
    urgency: "medium" as UrgencyLevel,
    address: { street: "", city: "", state: "", zip: "" },
    images: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const selectedCategory = categories.find((c) => c._id === form.categoryId);

  useEffect(() => {
    categoryService.getAll().then((res) => {
      const data = res.data.data || res.data;
      setCategories((data as { items?: Category[] }).items || (Array.isArray(data) ? data as Category[] : []));
    }).catch(() => {});
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.categoryId) e.categoryId = "Required";
    if (!form.subCategory) e.subCategory = "Required";
    if (!form.title.trim() || form.title.trim().length < 5) e.title = "Min 5 characters";
    if (!form.description.trim() || form.description.trim().length < 10) e.description = "Min 10 characters";
    if (form.budgetType !== "quote_needed" && !form.budgetMin) e.budgetMin = "Required";
    if (form.budgetType === "flexible" && form.budgetMin && form.budgetMax && Number(form.budgetMax) <= Number(form.budgetMin)) e.budgetMax = "Must be > min";
    if (!form.address.street.trim()) e.street = "Required";
    if (!form.address.city.trim()) e.city = "Required";
    if (!form.address.state.trim()) e.state = "Required";
    if (!form.address.zip.trim()) e.zip = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { toast.error("Please fix the errors"); return; }
    setLoading(true);
    try {
      await serviceRequestService.create({
        ...form,
        budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
        budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
        images: form.images.length > 0 ? form.images : undefined,
      });
      setSuccess(true);
      toast.success("Request posted!");
      setTimeout(() => router.push("/my-requests"), 2000);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-[800] text-[var(--text-primary)]">Request Posted!</h2>
        <p className="mt-2 max-w-md text-[var(--text-secondary)]">Nearby providers will be notified. You&apos;ll receive quotes shortly.</p>
        <button onClick={() => router.push("/my-requests")} className="mt-6 rounded-full bg-[#141414] px-6 py-3 text-sm font-bold text-white">View My Requests</button>
      </motion.div>
    );
  }

  const inputClass = (field: string) =>
    `w-full rounded-2xl border ${errors[field] ? "border-red-300 ring-2 ring-red-50" : "border-[var(--border)]"} bg-white px-4 py-3 text-sm font-medium outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/8`;

  return (
    <div className="mx-auto max-w-2xl pb-12">
      <button onClick={() => router.back()} className="group mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--primary)]">
        <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" /> Back
      </button>

      <div className="mb-8">
        <h1 className="text-[2rem] font-[800] tracking-[-0.03em] text-[var(--text-primary)]">Post a Request</h1>
        <p className="mt-1 text-[15px] text-[var(--text-secondary)]">Describe what you need — verified providers will send quotes</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category */}
        <section className="rounded-[22px] border border-[var(--border)] bg-white p-6 space-y-4">
          <h3 className="text-[14px] font-[800] text-[var(--text-primary)]">Service Category</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <select value={form.categoryId} onChange={(e) => { setForm({ ...form, categoryId: e.target.value, subCategory: "" }); setErrors((p) => ({ ...p, categoryId: "" })); }} className={inputClass("categoryId")}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.categoryId}</p>}
            </div>
            <div>
              <select value={form.subCategory} onChange={(e) => { setForm({ ...form, subCategory: e.target.value }); setErrors((p) => ({ ...p, subCategory: "" })); }} className={inputClass("subCategory")} disabled={!selectedCategory}>
                <option value="">Select subcategory</option>
                {selectedCategory?.subcategories?.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
              {errors.subCategory && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.subCategory}</p>}
            </div>
          </div>
        </section>

        {/* Details */}
        <section className="rounded-[22px] border border-[var(--border)] bg-white p-6 space-y-4">
          <h3 className="text-[14px] font-[800] text-[var(--text-primary)]">Request Details</h3>
          <div>
            <input type="text" value={form.title} onChange={(e) => { setForm({ ...form, title: e.target.value }); setErrors((p) => ({ ...p, title: "" })); }} placeholder="Title (e.g. Need painting for 3BHK)" className={inputClass("title")} />
            {errors.title && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.title}</p>}
          </div>
          <div>
            <textarea value={form.description} onChange={(e) => { setForm({ ...form, description: e.target.value }); setErrors((p) => ({ ...p, description: "" })); }} placeholder="Describe what you need in detail..." className={`${inputClass("description")} resize-none`} rows={4} />
            {errors.description && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.description}</p>}
          </div>
        </section>

        {/* Budget */}
        <section className="rounded-[22px] border border-[var(--border)] bg-white p-6 space-y-4">
          <h3 className="flex items-center gap-2 text-[14px] font-[800] text-[var(--text-primary)]"><IndianRupee size={14} /> Budget</h3>
          <div className="grid grid-cols-3 gap-2.5">
            {budgetOptions.map((opt) => (
              <button key={opt.value} type="button" onClick={() => setForm({ ...form, budgetType: opt.value })}
                className={`rounded-2xl border-2 p-3.5 text-left transition ${form.budgetType === opt.value ? "border-[var(--primary)] bg-[var(--primary-light)]" : "border-[var(--border)] hover:border-[var(--text-muted)]"}`}>
                <p className="text-[13px] font-bold text-[var(--text-primary)]">{opt.label}</p>
                <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{opt.desc}</p>
              </button>
            ))}
          </div>
          {form.budgetType !== "quote_needed" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <input type="number" value={form.budgetMin} onChange={(e) => { setForm({ ...form, budgetMin: e.target.value }); setErrors((p) => ({ ...p, budgetMin: "" })); }} placeholder={form.budgetType === "fixed" ? "Amount ₹" : "Min ₹"} className={inputClass("budgetMin")} />
                {errors.budgetMin && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.budgetMin}</p>}
              </div>
              {form.budgetType === "flexible" && (
                <div>
                  <input type="number" value={form.budgetMax} onChange={(e) => { setForm({ ...form, budgetMax: e.target.value }); setErrors((p) => ({ ...p, budgetMax: "" })); }} placeholder="Max ₹" className={inputClass("budgetMax")} />
                  {errors.budgetMax && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.budgetMax}</p>}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Schedule */}
        <section className="rounded-[22px] border border-[var(--border)] bg-white p-6 space-y-4">
          <h3 className="text-[14px] font-[800] text-[var(--text-primary)]">Schedule & Urgency</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative">
              <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input type="date" value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} min={new Date().toISOString().split("T")[0]} className="w-full rounded-2xl border border-[var(--border)] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[var(--primary)]" />
            </div>
            <div className="relative">
              <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input type="time" value={form.preferredTime} onChange={(e) => setForm({ ...form, preferredTime: e.target.value })} className="w-full rounded-2xl border border-[var(--border)] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[var(--primary)]" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {urgencyOptions.map((opt) => (
              <button key={opt.value} type="button" onClick={() => setForm({ ...form, urgency: opt.value })}
                className={`rounded-full border px-3.5 py-2 text-[12px] font-bold transition ${form.urgency === opt.value ? opt.color + " ring-2 ring-offset-1" : "border-[var(--border)] text-[var(--text-secondary)]"}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Address */}
        <section className="rounded-[22px] border border-[var(--border)] bg-white p-6 space-y-4">
          <h3 className="flex items-center gap-2 text-[14px] font-[800] text-[var(--text-primary)]"><MapPin size={14} /> Location</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <input type="text" value={form.address.street} onChange={(e) => { setForm({ ...form, address: { ...form.address, street: e.target.value } }); setErrors((p) => ({ ...p, street: "" })); }} placeholder="Street address" className={inputClass("street")} />
              {errors.street && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.street}</p>}
            </div>
            <div>
              <input type="text" value={form.address.city} onChange={(e) => { setForm({ ...form, address: { ...form.address, city: e.target.value } }); setErrors((p) => ({ ...p, city: "" })); }} placeholder="City" className={inputClass("city")} />
              {errors.city && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.city}</p>}
            </div>
            <div>
              <input type="text" value={form.address.state} onChange={(e) => { setForm({ ...form, address: { ...form.address, state: e.target.value } }); setErrors((p) => ({ ...p, state: "" })); }} placeholder="State" className={inputClass("state")} />
              {errors.state && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.state}</p>}
            </div>
            <div>
              <input type="text" value={form.address.zip} onChange={(e) => { setForm({ ...form, address: { ...form.address, zip: e.target.value } }); setErrors((p) => ({ ...p, zip: "" })); }} placeholder="PIN code" className={inputClass("zip")} />
              {errors.zip && <p className="mt-1 text-[11px] font-medium text-red-600">{errors.zip}</p>}
            </div>
          </div>
        </section>

        {/* Info */}
        <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-blue-600" />
          <p className="text-[12px] leading-relaxed text-blue-800">
            After posting, nearby verified providers will send quotes. Compare them and accept the best — a booking is created automatically.
          </p>
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 rounded-full bg-[#141414] py-4 text-[14px] font-bold text-white transition hover:bg-black disabled:opacity-50">
          {loading ? <span className="animate-pulse">Posting...</span> : <><Send size={16} /> Post Request</>}
        </button>
      </form>
    </div>
  );
}
