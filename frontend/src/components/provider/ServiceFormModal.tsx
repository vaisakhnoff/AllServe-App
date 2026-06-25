"use client";

import { useEffect, useState } from "react";
import { Loader2, X, Plus, ImagePlus, Trash2, Lock, Info } from "lucide-react";
import {
  AvailabilityStatus,
  CreateServiceDto,
  PricingModel,
  Service,
  ServiceStatus,
  ServiceType,
} from "@/types/service.types";
import { UI_MESSAGES } from "@/shared/messages";
import {
  getPricingModelsForServiceType,
  getServiceTypeEmoji,
} from "@/utils/serviceType.utils";

interface LockedCategory {
  id: string;
  name: string;
  subcategories: string[];
  defaultDeliveryModel?: ServiceType;
}

interface ServiceFormModalProps {
  open: boolean;
  initial?: Service | null;
  lockedCategory: LockedCategory | null;
  saving?: boolean;
  onSubmit: (dto: CreateServiceDto) => Promise<void> | void;
  onClose: () => void;
}

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 10;
const MAX_TAGS = 20;

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

const SERVICE_TYPE_OPTIONS: { value: ServiceType; label: string; desc: string; emoji: string }[] = [
  {
    value: "direct",
    emoji: "⚡",
    label: "Instant Booking",
    desc: "Fixed price — customers pick a slot and book immediately",
  },
  {
    value: "inspection_required",
    emoji: "🏠",
    label: "Inspection Required",
    desc: "You visit first, inspect the job, then provide a quote",
  },
  {
    value: "custom",
    emoji: "🎨",
    label: "Custom / Bidding",
    desc: "Customers post a request and you send a competitive quote",
  },
];

export function ServiceFormModal({
  open,
  initial,
  lockedCategory,
  saving,
  onSubmit,
  onClose,
}: ServiceFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("direct");
  const [pricingModel, setPricingModel] = useState<PricingModel>("fixed");
  const [price, setPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState("");
  const [duration, setDuration] = useState("");
  const [freeInspection, setFreeInspection] = useState(true);
  const [inspectionFee, setInspectionFee] = useState("");
  const [estimatedProjectDays, setEstimatedProjectDays] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>("available");
  const [status, setStatus] = useState<ServiceStatus>("active");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // When service type changes, reset pricing model to first valid option
  const handleServiceTypeChange = (t: ServiceType) => {
    setServiceType(t);
    const opts = getPricingModelsForServiceType(t);
    setPricingModel(opts[0].value);
    // Reset inspection-only fields when switching away
    if (t !== "inspection_required") {
      setFreeInspection(true);
      setInspectionFee("");
      setEstimatedProjectDays("");
    }
    if (t !== "custom") {
      setEstimatedProjectDays("");
    }
  };

  useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    setErrors({});
    const defaultType = initial?.deliveryModel ?? initial?.serviceType ?? lockedCategory?.defaultDeliveryModel ?? "direct";
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setServiceType(defaultType);
    setPricingModel(initial?.pricingModel ?? getPricingModelsForServiceType(defaultType)[0].value);
    setPrice(initial?.price != null ? String(initial.price) : "");
    setPriceUnit(initial?.priceUnit ?? "");
    setDuration(initial?.duration != null ? String(initial.duration) : "");
    setFreeInspection(initial?.freeInspection ?? true);
    setInspectionFee(initial?.inspectionFee != null ? String(initial.inspectionFee) : "");
    setEstimatedProjectDays(
      initial?.estimatedProjectDays != null ? String(initial.estimatedProjectDays) : ""
    );
    setSubCategory(initial?.subCategory ?? "");
    setAvailabilityStatus(initial?.availabilityStatus ?? "available");
    setStatus(initial?.status ?? "active");
    setTags(initial?.tags ?? []);
    setTagInput("");
    setImages(initial?.images ?? []);
  }, [open, initial, lockedCategory]);

  const isEdit = Boolean(initial);
  const pricingOptions = getPricingModelsForServiceType(serviceType);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) next.name = UI_MESSAGES.SERVICE_NAME_MIN;
    else if (name.trim().length > 100) next.name = UI_MESSAGES.SERVICE_NAME_MAX;

    if (!description.trim() || description.trim().length < 10)
      next.description = UI_MESSAGES.SERVICE_DESCRIPTION_MIN;
    else if (description.trim().length > 2000)
      next.description = UI_MESSAGES.SERVICE_DESCRIPTION_MAX;

    const priceNum = Number(price);
    if (price === "" || Number.isNaN(priceNum)) next.price = UI_MESSAGES.SERVICE_PRICE_REQUIRED;
    else if (priceNum < 0) next.price = UI_MESSAGES.SERVICE_PRICE_NEGATIVE;

    const durationNum = Number(duration);
    if (duration === "" || Number.isNaN(durationNum))
      next.duration = UI_MESSAGES.SERVICE_DURATION_REQUIRED;
    else if (!Number.isInteger(durationNum)) next.duration = UI_MESSAGES.SERVICE_DURATION_INTEGER;
    else if (durationNum < 1) next.duration = UI_MESSAGES.SERVICE_DURATION_MIN;
    else if (durationNum > 1440) next.duration = UI_MESSAGES.SERVICE_DURATION_MAX;

    if (pricingModel === "per_unit" && !priceUnit.trim())
      next.priceUnit = "Price unit is required (e.g. sq.ft, item)";

    if (serviceType === "inspection_required" && !freeInspection) {
      const fee = Number(inspectionFee);
      if (!inspectionFee || Number.isNaN(fee) || fee <= 0)
        next.inspectionFee = "Inspection fee must be greater than ₹0";
    }

    if (
      (serviceType === "inspection_required" || serviceType === "custom") &&
      estimatedProjectDays !== ""
    ) {
      const days = Number(estimatedProjectDays);
      if (!Number.isInteger(days) || days < 1)
        next.estimatedProjectDays = "Must be a whole number of days ≥ 1";
    }

    if (images.length > MAX_IMAGES) next.images = UI_MESSAGES.SERVICE_IMAGES_MAX;
    if (tags.length > MAX_TAGS) next.tags = UI_MESSAGES.SERVICE_TAGS_MAX;

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    const dto: CreateServiceDto = {
      name: name.trim(),
      description: description.trim(),
      deliveryModel: serviceType,
      pricingModel,
      price: Number(price),
      priceUnit: pricingModel === "per_unit" ? priceUnit.trim() : undefined,
      duration: Number(duration),
      freeInspection: serviceType === "inspection_required" ? freeInspection : undefined,
      inspectionFee:
        serviceType === "inspection_required" && !freeInspection && inspectionFee
          ? Number(inspectionFee)
          : undefined,
      estimatedProjectDays:
        (serviceType === "inspection_required" || serviceType === "custom") && estimatedProjectDays
          ? Number(estimatedProjectDays)
          : undefined,
      images,
      subCategory: subCategory.trim() || undefined,
      availabilityStatus,
      status,
      tags,
    };

    try {
      await onSubmit(dto);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save service";
      setSubmitError(msg);
    }
  };

  const handleAddTag = () => {
    const value = tagInput.trim();
    if (!value) return;
    if (tags.includes(value)) { setTagInput(""); return; }
    if (tags.length >= MAX_TAGS) {
      setErrors((p) => ({ ...p, tags: UI_MESSAGES.SERVICE_TAGS_MAX }));
      return;
    }
    if (value.length > 30) {
      setErrors((p) => ({ ...p, tags: UI_MESSAGES.SERVICE_TAG_MAX_LENGTH }));
      return;
    }
    setTags([...tags, value]);
    setTagInput("");
    setErrors((p) => ({ ...p, tags: "" }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); handleAddTag(); }
  };

  const handleImagesPicked = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setErrors((p) => ({ ...p, images: UI_MESSAGES.SERVICE_IMAGES_MAX }));
      return;
    }
    const picked = Array.from(files).slice(0, remaining).filter((f) => {
      if (f.size > MAX_IMAGE_SIZE_BYTES) {
        setErrors((p) => ({ ...p, images: `${f.name} exceeds 5 MB` }));
        return false;
      }
      if (!f.type.startsWith("image/")) {
        setErrors((p) => ({ ...p, images: `${f.name} is not an image` }));
        return false;
      }
      return true;
    });
    if (!picked.length) return;
    try {
      const b64 = await Promise.all(picked.map(fileToBase64));
      setImages((prev) => [...prev, ...b64]);
      setErrors((p) => ({ ...p, images: "" }));
    } catch {
      setErrors((p) => ({ ...p, images: UI_MESSAGES.SERVICE_IMAGE_READ_FAILED }));
    }
  };

  const fc = (key: string) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-indigo-400 ${
      errors[key] ? "border-red-300 bg-red-50" : "border-slate-200"
    }`;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-950">
            {isEdit ? "Edit Service" : "Add new service"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {submitError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {submitError}
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          {/* ── Service Type ──────────────────────────────────────────── */}
          <div>
            <label className="mb-2 block text-xs font-bold text-slate-600">
              Service Type *
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              {SERVICE_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleServiceTypeChange(opt.value)}
                  className={`rounded-xl border-2 p-3 text-left transition-all ${
                    serviceType === opt.value
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="text-lg">{opt.emoji}</span>
                  <p className="mt-1 text-xs font-black text-slate-900">{opt.label}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500 leading-tight">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Name + Category ──────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Service name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fc("name")}
                placeholder="e.g. Interior House Painting"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Category</label>
              <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                <span className="truncate">{lockedCategory?.name ?? "Approved category not set"}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                  <Lock size={10} /> Locked
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                All your services are tied to your approved category.
              </p>
            </div>
          </div>

          {/* ── Sub-category ─────────────────────────────────────────── */}
          {lockedCategory && lockedCategory.subcategories.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Sub-category</label>
              <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className={fc("subCategory")}>
                <option value="">— None —</option>
                {lockedCategory.subcategories.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                {subCategory && !lockedCategory.subcategories.includes(subCategory) && (
                  <option value={subCategory}>{subCategory} (existing)</option>
                )}
              </select>
            </div>
          )}

          {/* ── Description ──────────────────────────────────────────── */}
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              className={`${fc("description")} resize-none`}
              placeholder="Describe what's included, materials used, and what makes this service stand out."
            />
            <div className="mt-1 flex items-center justify-between">
              {errors.description ? (
                <p className="text-xs text-red-500">{errors.description}</p>
              ) : (
                <span className="text-xs text-slate-400">Min 10, max 2000 characters</span>
              )}
              <span className="text-xs text-slate-400">{description.length}/2000</span>
            </div>
          </div>

          {/* ── Pricing Model + Price ─────────────────────────────────── */}
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">Pricing Model *</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {pricingOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPricingModel(opt.value)}
                  className={`rounded-xl border-2 p-3 text-left transition-all ${
                    pricingModel === opt.value
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <p className="text-xs font-black text-slate-900">{opt.label}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{opt.hint}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">
                {pricingModel === "per_unit" ? "Price per unit (₹) *" :
                 pricingModel === "hourly"   ? "Price per hour (₹) *" :
                 pricingModel === "starting_from" ? "Starting price (₹) *" :
                 pricingModel === "quote_based" ? "Base estimate (₹)" :
                 "Price (₹) *"}
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={fc("price")}
                placeholder={pricingModel === "quote_based" ? "Optional estimate" : "e.g. 500"}
              />
              {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
            </div>

            {/* Price unit – only for per_unit */}
            {pricingModel === "per_unit" && (
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Price unit *</label>
                <input
                  type="text"
                  value={priceUnit}
                  onChange={(e) => setPriceUnit(e.target.value)}
                  className={fc("priceUnit")}
                  placeholder="e.g. sq.ft, sq.m, item"
                />
                {errors.priceUnit && <p className="mt-1 text-xs text-red-500">{errors.priceUnit}</p>}
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">
                {serviceType === "inspection_required" ? "Inspection duration (min) *" : "Duration (minutes) *"}
              </label>
              <input
                type="number"
                min={1}
                max={1440}
                step="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={fc("duration")}
                placeholder="e.g. 60"
              />
              {errors.duration && <p className="mt-1 text-xs text-red-500">{errors.duration}</p>}
              {serviceType === "inspection_required" && (
                <p className="mt-1 text-[11px] text-slate-400">Duration of the initial inspection visit.</p>
              )}
            </div>
          </div>

          {/* ── visit_first extra fields ─────────────────────────────── */}
          {serviceType === "inspection_required" && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏠</span>
                <p className="text-xs font-bold text-blue-700">Inspection Visit Settings</p>
              </div>

              {/* Free inspection toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={freeInspection}
                  onChange={(e) => {
                    setFreeInspection(e.target.checked);
                    if (e.target.checked) setInspectionFee("");
                  }}
                  className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                />
                <div>
                  <p className="text-xs font-bold text-slate-700">Free inspection visit</p>
                  <p className="text-[11px] text-slate-500">Offer the initial assessment visit at no cost</p>
                </div>
              </label>

              {/* Inspection fee – only when not free */}
              {!freeInspection && (
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">Inspection fee (₹) *</label>
                  <input
                    type="number"
                    min={1}
                    step="0.01"
                    value={inspectionFee}
                    onChange={(e) => setInspectionFee(e.target.value)}
                    className={fc("inspectionFee")}
                    placeholder="e.g. 200"
                  />
                  {errors.inspectionFee && <p className="mt-1 text-xs text-red-500">{errors.inspectionFee}</p>}
                </div>
              )}

              {/* Estimated project days */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Estimated project duration (days)</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  step="1"
                  value={estimatedProjectDays}
                  onChange={(e) => setEstimatedProjectDays(e.target.value)}
                  className={fc("estimatedProjectDays")}
                  placeholder="e.g. 3"
                />
                {errors.estimatedProjectDays && (
                  <p className="mt-1 text-xs text-red-500">{errors.estimatedProjectDays}</p>
                )}
                <p className="mt-1 text-[11px] text-slate-500">
                  Helps customers understand the typical project timeline.
                </p>
              </div>
            </div>
          )}

          {/* ── custom estimated project days ───────────────────────── */}
          {serviceType === "custom" && (
            <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎨</span>
                <p className="text-xs font-bold text-purple-700">Project Estimate</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Estimated project duration (days)</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  step="1"
                  value={estimatedProjectDays}
                  onChange={(e) => setEstimatedProjectDays(e.target.value)}
                  className={fc("estimatedProjectDays")}
                  placeholder="e.g. 5"
                />
                {errors.estimatedProjectDays && (
                  <p className="mt-1 text-xs text-red-500">{errors.estimatedProjectDays}</p>
                )}
              </div>
            </div>
          )}

          {/* ── Status + Availability ────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Listing status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as ServiceStatus)} className={fc("status")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Availability</label>
              <select value={availabilityStatus} onChange={(e) => setAvailabilityStatus(e.target.value as AvailabilityStatus)} className={fc("availabilityStatus")}>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>

          {/* ── Tags ─────────────────────────────────────────────────── */}
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">
              Tags <span className="font-normal text-slate-400">({tags.length}/{MAX_TAGS})</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                className={fc("tags")}
                placeholder="Type and press Enter to add"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                <Plus size={14} /> Add
              </button>
            </div>
            {errors.tags && <p className="mt-1 text-xs text-red-500">{errors.tags}</p>}
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    {t}
                    <button type="button" onClick={() => setTags(tags.filter((tag) => tag !== t))} className="text-indigo-500 hover:text-indigo-700" aria-label={`Remove ${t}`}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Images ───────────────────────────────────────────────── */}
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">
              Images <span className="font-normal text-slate-400">({images.length}/{MAX_IMAGES})</span>
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-indigo-200 bg-indigo-50 px-4 py-6 text-center text-xs font-semibold text-indigo-700 hover:bg-indigo-100">
              <ImagePlus size={20} className="mb-1" />
              Upload images (JPG/PNG, up to 5 MB each)
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void handleImagesPicked(e.target.files); e.target.value = ""; }} />
            </label>
            {errors.images && <p className="mt-1 text-xs text-red-500">{errors.images}</p>}
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {images.map((img, idx) => (
                  <div key={`${idx}-${img.slice(0, 16)}`} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Service image ${idx + 1}`} className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))} className="absolute right-1 top-1 hidden rounded-full bg-white/90 p-1 text-red-600 shadow-sm group-hover:block" aria-label="Remove image">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Booking-flow info banner ──────────────────────────────── */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex items-start gap-2">
            <Info size={14} className="mt-0.5 shrink-0 text-slate-400" />
            <div>
              <p className="text-[11px] font-bold text-slate-600">
                {getServiceTypeEmoji(serviceType)}{" "}
                {serviceType === "direct"
                  ? "Customers can book an available slot immediately"
                  : serviceType === "inspection_required"
                  ? "Customers will book a free inspection visit — you send the final quote after assessing the work"
                  : "Customers will post a service request — you submit a competitive quote"}
              </p>
            </div>
          </div>

          {/* ── Footer ───────────────────────────────────────────────── */}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60">
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {isEdit ? "Save changes" : "Create service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
