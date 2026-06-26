"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Loader2, ArrowLeft, MapPin, ImagePlus, Trash2, CheckCircle2,
  ChevronRight, Palette, Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { categoryService } from "@/services/category";
import { orderService } from "@/services/order";
import { userService } from "@/services/user";
import { Category } from "@/types/category.types";
import { Address } from "@/types/user.types";
import { getErrorMessage } from "@/utils/errorHandler";
import { LoginRequiredPrompt } from "@/components/auth/LoginRequiredPrompt";
import { Role } from "@/enums/role.enum";

export default function RequestCustomPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isInitialized, role } = useSelector((s: RootState) => s.auth);
  const canAccess = isInitialized && isAuthenticated && role === Role.USER;

  const prefilledCategoryId = searchParams?.get("categoryId") || "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(prefilledCategoryId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [budgetType, setBudgetType] = useState<"fixed" | "flexible" | "quote_needed">("quote_needed");
  const [images, setImages] = useState<string[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    if (!canAccess) return;
    Promise.all([
      categoryService.getAll(),
      userService.getProfile(),
    ]).then(([cRes, uRes]) => {
      const catData = cRes.data.data || cRes.data;
      const cats: Category[] = (catData as { items?: Category[] }).items || (Array.isArray(catData) ? catData as Category[] : []);
      setCategories(cats);
      const addrs = uRes.data.data.addresses || [];
      setAddresses(addrs);
      setSelectedAddress(addrs.find((a) => a.isDefault) || addrs[0] || null);
    }).catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, [canAccess]);

  const handleSubmit = async () => {
    if (!selectedCategoryId) { toast.error("Select a category"); return; }
    if (title.trim().length < 5) { toast.error("Title must be at least 5 characters"); return; }
    if (description.trim().length < 10) { toast.error("Description must be at least 10 characters"); return; }
    if (!selectedAddress) { toast.error("Select an address"); return; }

    setSubmitting(true);
    try {
      const res = await orderService.createCustom({
        categoryId: selectedCategoryId,
        title: title.trim(),
        description: description.trim(),
        budget: budget ? Number(budget) : undefined,
        budgetType,
        address: {
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zip: selectedAddress.zip,
          country: selectedAddress.country,
        },
        images,
      });
      setOrderId(res.data.data.orderId);
      setSuccess(true);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImage = async (files: FileList | null) => {
    if (!files || images.length >= 10) return;
    const file = files[0];
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setImages((p) => [...p, reader.result as string]);
    reader.readAsDataURL(file);
  };

  if (isInitialized && !canAccess) return <LoginRequiredPrompt title="Login required" message="Sign in to post a custom request." />;
  if (loading) return <main className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></main>;

  if (success) {
    return (
      <main className="min-h-screen bg-[var(--surface-2)] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl border border-slate-100">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100">
            <Users size={36} className="text-purple-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-950">Request Broadcast!</h1>
          <p className="mt-2 text-sm text-slate-500">
            Your request has been sent to all matching providers in your area. You&apos;ll start receiving quotations soon.
          </p>
          <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-xs text-slate-500">Order ID</p>
            <p className="text-lg font-black text-indigo-600">{orderId}</p>
            <p className="text-xs text-slate-400 mt-1">Expires in 7 days if no quote is accepted</p>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => router.push("/dashboard")} className="btn btn-ghost flex-1 py-3 text-sm">Home</button>
            <button onClick={() => router.push("/my-orders")} className="btn btn-primary flex-1 py-3 text-sm">My Orders</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <button onClick={() => router.back()} className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600">
          <ArrowLeft size={14} /> Back
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700">🎨 Custom Request</span>
          </div>
          <h1 className="text-2xl font-black text-slate-950">Post Custom Request</h1>
          <p className="text-sm text-slate-500 mt-1">
            Describe your unique project and receive competitive quotations from multiple providers
          </p>
        </div>

        {/* Info banner */}
        <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-4 mb-6 flex items-start gap-3">
          <Palette size={18} className="text-purple-600 shrink-0 mt-0.5" />
          <div className="text-xs text-purple-800 leading-relaxed">
            <p className="font-bold mb-1">How it works:</p>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>Post your requirement with details and budget</li>
              <li>All matching providers in your area receive the request</li>
              <li>Providers send you competitive quotations</li>
              <li>Compare quotes and accept the best one</li>
              <li>Provider starts the project</li>
            </ol>
            <p className="mt-2 font-semibold">No upfront fee — you only pay when you accept a quote.</p>
          </div>
        </div>

        {/* Category */}
        <section className="premium-card p-5 mb-5">
          <h3 className="text-sm font-black text-slate-900 mb-3">Category *</h3>
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400"
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </section>

        {/* Title & Description */}
        <section className="premium-card p-5 mb-5">
          <h3 className="text-sm font-black text-slate-900 mb-3">Project Details *</h3>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 mb-3"
            placeholder="Project title (e.g. Custom gaming PC build)"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            maxLength={3000}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none resize-none focus:border-indigo-400"
            placeholder="Describe your project in detail — specifications, preferences, timeline expectations..."
          />
          <p className="mt-1 text-right text-xs text-slate-400">{description.length}/3000</p>

          {/* Images */}
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs font-semibold text-indigo-600">
            <ImagePlus size={14} /> Add reference images ({images.length}/10)
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e.target.files)} />
          </label>
          {images.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <div key={i} className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 rounded-full bg-white/90 p-0.5 text-red-500"><Trash2 size={10} /></button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Budget */}
        <section className="premium-card p-5 mb-5">
          <h3 className="text-sm font-black text-slate-900 mb-3">Budget</h3>
          <div className="grid gap-2 sm:grid-cols-3 mb-3">
            {([
              { value: "quote_needed" as const, label: "Need quotes", desc: "Let providers suggest pricing" },
              { value: "flexible" as const, label: "Flexible", desc: "Have a rough range in mind" },
              { value: "fixed" as const, label: "Fixed budget", desc: "Know your exact budget" },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setBudgetType(opt.value)}
                className={`rounded-xl border-2 p-3 text-left transition ${budgetType === opt.value ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}
              >
                <p className="text-xs font-black text-slate-900">{opt.label}</p>
                <p className="text-[11px] text-slate-500">{opt.desc}</p>
              </button>
            ))}
          </div>
          {budgetType !== "quote_needed" && (
            <input
              type="number"
              min={0}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400"
              placeholder={budgetType === "fixed" ? "Your budget (₹)" : "Approximate budget (₹)"}
            />
          )}
        </section>

        {/* Address */}
        <section className="premium-card p-5 mb-6">
          <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
            <MapPin size={14} className="text-indigo-600" /> Location
          </h3>
          <div className="space-y-2">
            {addresses.map((a) => (
              <button key={a._id} onClick={() => setSelectedAddress(a)} className={`w-full text-left rounded-xl border-2 p-3 transition ${selectedAddress?._id === a._id ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}>
                <p className="text-sm font-bold text-slate-900">{a.street}</p>
                <p className="text-xs text-slate-500">{a.city}, {a.state} {a.zip}</p>
              </button>
            ))}
          </div>
        </section>

        <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary w-full py-4 text-base">
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
          Broadcast Request to Providers
        </button>
      </div>
    </main>
  );
}
