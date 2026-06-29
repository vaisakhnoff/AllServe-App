"use client";

import { useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { ORDER_ACTION_CONFIG } from "./OrderStatusConfig";
import toast from "react-hot-toast";

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  actionKey: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  isDangerous?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  title,
  message,
  actionKey,
  onConfirm,
  onCancel,
  isLoading = false,
  isDangerous = false,
}: ConfirmationDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const action = ORDER_ACTION_CONFIG[actionKey];

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm();
      toast.success(action?.successMessage || "Action completed");
      onCancel(); // Close after success
    } catch (err) {
      toast.error(action?.errorMessage || "Action failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                isDangerous ? "bg-red-100" : "bg-amber-100"
              }`}
            >
              <AlertCircle size={20} className={isDangerous ? "text-red-600" : "text-amber-600"} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{title}</h2>
              <p className="mt-0.5 text-sm text-slate-600">{message}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Message */}
        {action?.confirmation && (
          <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            {action.confirmation}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50 ${
              isDangerous
                ? "bg-red-600 hover:bg-red-700"
                : action?.variant === "success"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isLoading ? "Processing..." : action?.label || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
