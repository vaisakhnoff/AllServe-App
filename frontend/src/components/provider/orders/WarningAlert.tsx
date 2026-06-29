"use client";

import { AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react";

export type WarningType = "info" | "warning" | "error" | "success";

interface WarningAlertProps {
  type?: WarningType;
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

const typeConfig = {
  info: {
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-800",
    icon: "text-blue-600",
    Icon: Info,
  },
  warning: {
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-800",
    icon: "text-amber-600",
    Icon: AlertTriangle,
  },
  error: {
    bg: "bg-red-50 border-red-200",
    text: "text-red-800",
    icon: "text-red-600",
    Icon: AlertCircle,
  },
  success: {
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-800",
    icon: "text-emerald-600",
    Icon: CheckCircle,
  },
};

export function WarningAlert({
  type = "warning",
  title,
  message,
  dismissible = true,
  onDismiss,
  icon: customIcon,
}: WarningAlertProps) {
  const config = typeConfig[type];
  const DefaultIcon = config.Icon;

  return (
    <div className={`flex items-start gap-3 rounded-xl border ${config.bg} p-3.5`}>
      <div className="shrink-0 pt-0.5">
        {customIcon ? customIcon : <DefaultIcon size={18} className={config.icon} />}
      </div>
      <div className="flex-1 min-w-0">
        {title && <p className={`text-sm font-semibold ${config.text}`}>{title}</p>}
        <p className={`text-sm ${config.text} ${title ? "mt-0.5" : ""}`}>{message}</p>
      </div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-1"
        >
          ✕
        </button>
      )}
    </div>
  );
}
