"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Send, MapPin, Calendar, Clock, IndianRupee, AlertCircle,
  ImagePlus, Sparkles, ArrowLeft, CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { categoryService } from "@/services/category";
import { serviceRequestService } from "@/services/serviceRequest";
import { Category } from "@/types/category.types";
import { BudgetType, UrgencyLevel } from "@/types/serviceRequest.types";
import { getErrorMessage } from "@/utils/errorHandler";

const urgencyOptions: { value: UrgencyLevel; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "medium", label: "Medium", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-700 border-red-200" },
];

const budgetOptions: { value: BudgetType; label: string; desc: string }[] = [
  { value: "fixed", label: "Fixed Budget", desc: "I have a specific budget in mind" },
  { value: "flexible", label: "Flexible Budget", desc: "I have a range I'm comfortable with" },
  { value: "quote_needed", label: "Need Quote", desc: "Let providers suggest their price" },
];

export default function PostRequestPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    categoryId: "",
    subCategory: "",
    title: "",
    description: "",
    budgetType: "flexible" as BudgetType,
    budgetMin: "",
    budgetMax: "",
    preferredDate: "",
    preferredTime: "",
    urgency: "medium" as UrgencyLevel,
    address: { street: "", city: "", state: "", zip: "" },
    images: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedCategory = categories.find((c) => c._id === form.categoryId);

  useEffect(() => {
    categoryService.getAll().then((res) => {
      const data = res.data.data || res.data;
      const categories = data.items || (Array.isArray(data) ? data : []);
      setCategories(categories);
    }).catch(() => {});
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.categoryId) e.categoryId = "Please select a category";
    if (!form.subCategory) e.subCategory = "Please select a subcategory";
    if (!form.title.trim()) e.title = "Title is required";
    else if (form.title.trim().length < 5) e.title = "Title must be at least 5 characters";
    if (!form.description.trim()) e.description = "Description is required";
    else if (form.description.trim().length < 10) e.description = "Description must be at least 10 characters";
    if (form.budgetType !== "quote_needed" && !form.budgetMin) e.budgetMin = "Please enter a budget amount";
    if (form.budgetType === "flexible" && form.budgetMin && form.budgetMax && Number(form.budgetMax) <= Number(form.budgetMin)) e.budgetMax = "Max budget must be greater than min";
    if (!form.address.street.trim()) e.street = "Street address is required";
    if (!form.address.city.trim()) e.city = "City is required";
    if (!form.address.state.trim()) e.state = "State is required";
    if (!form.address.zip.trim()) e.zip = "PIN code is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { toast.error("Please fix the errors below"); return; }
    setLoading(true);
    try {
      await serviceRequestService.create({
        ...form,
        budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
        budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
        images: form.images.length > 0 ? form.images : undefined,
      });
      setSuccess(true);
      toast.success("Request posted! Providers will start sending quotes.");
      setTimeout(() => router.push("/my-requests"), 2000);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 size={40} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Request Posted Successfully!</h2>
        <p className="mt-2 text-slate-500 max-w-md">Nearby providers matching your requirements will be notified. You&apos;ll receive quotes shortly.</p>
        <button onClick={() => router.push("/my-requests")} className="mt-6 btn btn-primary px-8 py-3">
          View My Requests
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/20">
            <Sparkles size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Post a Service Request</h1>
            <p className="text-sm text-slate-500">Describe what you need and get quotes from verified providers</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category & Subcategory */}
        <div className="premium-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Service Category</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category *</label>
              <select
                value={form.categoryId}
                onChange={(e) => { setForm({ ...form, categoryId: e.target.value, subCategory: "" }); setErrors((p) => ({ ...p, categoryId: "" })); }}
                className={`w-full rounded-xl border ${errors.categoryId ? "border-red-300 ring-2 ring-red-100" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all`}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="mt-1 text-xs font-medium text-red-600">{errors.categoryId}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subcategory *</label>
              <select
                value={form.subCategory}
                onChange={(e) => { setForm({ ...form, subCategory: e.target.value }); setErrors((p) => ({ ...p, subCategory: "" })); }}
                className={`w-full rounded-xl border ${errors.subCategory ? "border-red-300 ring-2 ring-red-100" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all`}
                disabled={!selectedCategory}
              >
                <option value="">Select subcategory</option>
                {selectedCategory?.subcategories?.map((s) => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
              {errors.subCategory && <p className="mt-1 text-xs font-medium text-red-600">{errors.subCategory}</p>}
            </div>
          </div>
        </div>

        {/* Title & Description */}
        <div className="premium-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Request Details</h3>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => { setForm({ ...form, title: e.target.value }); setErrors((p) => ({ ...p, title: "" })); }}
              placeholder="e.g., Need House Painting for 3BHK"
              className={`w-full rounded-xl border ${errors.title ? "border-red-300 ring-2 ring-red-100" : "border-slate-200"} bg-white px-4 py-3 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all`}
            />
            {errors.title && <p className="mt-1 text-xs font-medium text-red-600">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => { setForm({ ...form, description: e.target.value }); setErrors((p) => ({ ...p, description: "" })); }}
              placeholder="Describe your requirements in detail. The more specific you are, the better quotes you'll receive..."
              className={`w-full rounded-xl border ${errors.description ? "border-red-300 ring-2 ring-red-100" : "border-slate-200"} bg-white px-4 py-3 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all resize-none`}
              rows={4}
            />
            {errors.description && <p className="mt-1 text-xs font-medium text-red-600">{errors.description}</p>}
          </div>
        </div>

        {/* Budget */}
        <div className="premium-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <IndianRupee size={14} /> Budget
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {budgetOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm({ ...form, budgetType: opt.value })}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  form.budgetType === opt.value
                    ? "border-purple-500 bg-purple-50 shadow-sm"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <p className="text-sm font-bold text-slate-900">{opt.label}</p>
                <p className="mt-1 text-xs text-slate-500">{opt.desc}</p>
              </button>
            ))}
          </div>
          {form.budgetType !== "quote_needed" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {form.budgetType === "fixed" ? "Budget Amount (₹)" : "Min Budget (₹)"}
                </label>
                <input
                  type="number"
                  value={form.budgetMin}
                  onChange={(e) => { setForm({ ...form, budgetMin: e.target.value }); setErrors((p) => ({ ...p, budgetMin: "" })); }}
                  placeholder="e.g., 5000"
                  className={`w-full rounded-xl border ${errors.budgetMin ? "border-red-300 ring-2 ring-red-100" : "border-slate-200"} bg-white px-4 py-3 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all`}
                />
                {errors.budgetMin && <p className="mt-1 text-xs font-medium text-red-600">{errors.budgetMin}</p>}
              </div>
              {form.budgetType === "flexible" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Max Budget (₹)</label>
                  <input
                    type="number"
                    value={form.budgetMax}
                    onChange={(e) => { setForm({ ...form, budgetMax: e.target.value }); setErrors((p) => ({ ...p, budgetMax: "" })); }}
                    placeholder="e.g., 8000"
                    className={`w-full rounded-xl border ${errors.budgetMax ? "border-red-300 ring-2 ring-red-100" : "border-slate-200"} bg-white px-4 py-3 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all`}
                  />
                  {errors.budgetMax && <p className="mt-1 text-xs font-medium text-red-600">{errors.budgetMax}</p>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Schedule & Urgency */}
        <div className="premium-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Schedule & Urgency</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} /> Preferred Date
              </label>
              <input
                type="date"
                value={form.preferredDate}
                onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock size={14} /> Preferred Time
              </label>
              <input
                type="time"
                value={form.preferredTime}
                onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Urgency Level</label>
            <div className="flex flex-wrap gap-2">
              {urgencyOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, urgency: opt.value })}
                  className={`rounded-full border px-4 py-2 text-xs font-bold transition-all ${
                    form.urgency === opt.value ? opt.color + " ring-2 ring-offset-1" : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="premium-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <MapPin size={14} /> Service Location
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Street Address *</label>
              <input
                type="text"
                value={form.address.street}
                onChange={(e) => { setForm({ ...form, address: { ...form.address, street: e.target.value } }); setErrors((p) => ({ ...p, street: "" })); }}
                placeholder="House/Flat No., Street, Landmark"
                className={`w-full rounded-xl border ${errors.street ? "border-red-300 ring-2 ring-red-100" : "border-slate-200"} bg-white px-4 py-3 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all`}
              />
              {errors.street && <p className="mt-1 text-xs font-medium text-red-600">{errors.street}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">City *</label>
              <input
                type="text"
                value={form.address.city}
                onChange={(e) => { setForm({ ...form, address: { ...form.address, city: e.target.value } }); setErrors((p) => ({ ...p, city: "" })); }}
                placeholder="e.g., Kozhikode"
                className={`w-full rounded-xl border ${errors.city ? "border-red-300 ring-2 ring-red-100" : "border-slate-200"} bg-white px-4 py-3 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all`}
              />
              {errors.city && <p className="mt-1 text-xs font-medium text-red-600">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">State *</label>
              <input
                type="text"
                value={form.address.state}
                onChange={(e) => { setForm({ ...form, address: { ...form.address, state: e.target.value } }); setErrors((p) => ({ ...p, state: "" })); }}
                placeholder="e.g., Kerala"
                className={`w-full rounded-xl border ${errors.state ? "border-red-300 ring-2 ring-red-100" : "border-slate-200"} bg-white px-4 py-3 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all`}
              />
              {errors.state && <p className="mt-1 text-xs font-medium text-red-600">{errors.state}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">PIN Code *</label>
              <input
                type="text"
                value={form.address.zip}
                onChange={(e) => { setForm({ ...form, address: { ...form.address, zip: e.target.value } }); setErrors((p) => ({ ...p, zip: "" })); }}
                placeholder="e.g., 673001"
                className={`w-full rounded-xl border ${errors.zip ? "border-red-300 ring-2 ring-red-100" : "border-slate-200"} bg-white px-4 py-3 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all`}
              />
              {errors.zip && <p className="mt-1 text-xs font-medium text-red-600">{errors.zip}</p>}
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="premium-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <ImagePlus size={14} /> Attach Images (Optional)
          </h3>
          <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 p-6 text-center">
            <ImagePlus size={24} className="text-slate-400" />
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-700">Upload reference images</p>
              <p className="text-xs text-slate-500">Paste image URLs (max 5). Photo upload coming soon.</p>
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
          <AlertCircle size={18} className="text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-blue-900">How it works</p>
            <p className="mt-1 text-xs text-blue-700 leading-5">
              After posting, nearby verified providers matching your category will be notified. They&apos;ll send you quotes with their price, availability, and message. You can compare and accept the best one — a booking will be created automatically.
            </p>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all disabled:opacity-50"
        >
          {loading ? (
            <span className="animate-pulse">Posting request...</span>
          ) : (
            <>
              <Send size={16} /> Post Service Request
            </>
          )}
        </button>
      </form>
    </div>
  );
}
