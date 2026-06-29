"use client";

import { useState } from "react";
import { DollarSign, Clock, MessageSquare, AlertCircle, Send, X } from "lucide-react";
import { WarningAlert } from "./WarningAlert";
import toast from "react-hot-toast";

interface QuotationFormProps {
  isOpen: boolean;
  orderId: string;
  onSubmit: (data: QuotationData) => Promise<void>;
  onClose: () => void;
  title?: string;
  description?: string;
}

export interface QuotationData {
  price: number;
  message: string;
  estimatedDuration: string;
  availabilityNote?: string;
}

export function QuotationForm({
  isOpen,
  orderId,
  onSubmit,
  onClose,
  title = "Submit Quotation",
  description,
}: QuotationFormProps) {
  const [form, setForm] = useState<QuotationData>({
    price: 0,
    message: "",
    estimatedDuration: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.price || form.price <= 0) newErrors.price = "Enter a valid price";
    if (!form.message.trim()) newErrors.message = "Message is required";
    else if (form.message.trim().length < 5) newErrors.message = "Min 5 characters";
    if (!form.estimatedDuration.trim()) newErrors.estimatedDuration = "Duration is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the errors");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(form);
      toast.success("Quotation submitted successfully!");
      setForm({ price: 0, message: "", estimatedDuration: "" });
      setErrors({});
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit quotation");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Warning */}
        <div className="mb-4">
          <WarningAlert
            type="info"
            message="Provide competitive pricing to win the quotation"
            dismissible={false}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              <DollarSign size={14} className="inline mr-1" />
              Your Price (₹) *
            </label>
            <input
              type="number"
              value={form.price || ""}
              onChange={(e) => {
                setForm({ ...form, price: Number(e.target.value) });
                setErrors((p) => ({ ...p, price: "" }));
              }}
              placeholder="e.g., 5000"
              className={`w-full rounded-lg border ${
                errors.price ? "border-red-300 ring-2 ring-red-100" : "border-slate-200"
              } px-4 py-3 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none`}
            />
            {errors.price && <p className="mt-1 text-xs font-medium text-red-600">{errors.price}</p>}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              <MessageSquare size={14} className="inline mr-1" />
              Your Message *
            </label>
            <textarea
              value={form.message}
              onChange={(e) => {
                setForm({ ...form, message: e.target.value });
                setErrors((p) => ({ ...p, message: "" }));
              }}
              placeholder="Describe your approach, experience, and why you're the best fit..."
              className={`w-full rounded-lg border ${
                errors.message ? "border-red-300 ring-2 ring-red-100" : "border-slate-200"
              } px-4 py-3 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none`}
              rows={3}
            />
            {errors.message && <p className="mt-1 text-xs font-medium text-red-600">{errors.message}</p>}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              <Clock size={14} className="inline mr-1" />
              Estimated Duration *
            </label>
            <input
              type="text"
              value={form.estimatedDuration}
              onChange={(e) => {
                setForm({ ...form, estimatedDuration: e.target.value });
                setErrors((p) => ({ ...p, estimatedDuration: "" }));
              }}
              placeholder="e.g., 3 days, 1 week"
              className={`w-full rounded-lg border ${
                errors.estimatedDuration ? "border-red-300 ring-2 ring-red-100" : "border-slate-200"
              } px-4 py-3 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none`}
            />
            {errors.estimatedDuration && (
              <p className="mt-1 text-xs font-medium text-red-600">{errors.estimatedDuration}</p>
            )}
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Availability Note (Optional)
            </label>
            <input
              type="text"
              value={form.availabilityNote || ""}
              onChange={(e) => setForm({ ...form, availabilityNote: e.target.value })}
              placeholder="e.g., Can start tomorrow"
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Submitting..." : <><Send size={14} /> Submit Quotation</>}
          </button>
        </form>
      </div>
    </div>
  );
}
