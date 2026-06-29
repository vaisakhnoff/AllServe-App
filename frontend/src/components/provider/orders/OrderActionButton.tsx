"use client";

import { useState } from "react";
import { ORDER_ACTION_CONFIG } from "./OrderStatusConfig";
import { ConfirmationDialog } from "./ConfirmationDialog";

interface OrderActionButtonProps {
  actionKey: string;
  orderId: string;
  onAction: (actionKey: string, orderId: string) => Promise<void>;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "danger";
}

const variantStyles = {
  primary:
    "bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white",
  secondary:
    "bg-slate-100 hover:bg-slate-200 disabled:bg-slate-100 text-slate-700",
  danger: "bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-[12px] font-semibold",
  md: "px-4 py-2 text-[13px] font-bold",
  lg: "px-6 py-3 text-[14px] font-bold",
};

export function OrderActionButton({
  actionKey,
  orderId,
  onAction,
  disabled = false,
  fullWidth = false,
  size = "md",
  variant,
}: OrderActionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const action = ORDER_ACTION_CONFIG[actionKey];

  if (!action) return null;

  // Determine variant based on action type if not explicitly provided
  const effectiveVariant =
    variant ||
    (actionKey.includes("cancel") || actionKey.includes("reject")
      ? "danger"
      : "primary");

  const ActionIcon = action.icon;

  const handleClick = async () => {
    if (action.confirmation) {
      setShowConfirm(true);
    } else {
      await executeAction();
    }
  };

  const executeAction = async () => {
    setIsLoading(true);
    try {
      await onAction(actionKey, orderId);
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled || isLoading}
        title={action.description}
        className={`
          inline-flex items-center gap-2 rounded-lg transition-all
          ${sizeStyles[size]}
          ${variantStyles[effectiveVariant]}
          ${fullWidth ? "w-full justify-center" : ""}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        <ActionIcon size={size === "sm" ? 14 : size === "md" ? 16 : 18} />
        {isLoading ? "Processing..." : action.label}
      </button>

      <ConfirmationDialog
        isOpen={showConfirm}
        title={action.label}
        message={action.description}
        actionKey={actionKey}
        onConfirm={executeAction}
        onCancel={() => setShowConfirm(false)}
        isLoading={isLoading}
        isDangerous={effectiveVariant === "danger"}
      />
    </>
  );
}
