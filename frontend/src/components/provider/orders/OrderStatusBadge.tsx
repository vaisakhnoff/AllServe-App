"use client";

import { ORDER_STATUS_CONFIG, DELIVERY_MODEL_BADGES } from "./OrderStatusConfig";
import { ServiceOrder } from "@/types/order.types";

interface OrderStatusBadgeProps {
  order: ServiceOrder;
  size?: "sm" | "md" | "lg";
  showDescription?: boolean;
}

export function OrderStatusBadge({
  order,
  size = "md",
  showDescription = false,
}: OrderStatusBadgeProps) {
  const statusCfg = ORDER_STATUS_CONFIG[order.status];
  const deliveryBadge =
    order.subMode === "instant"
      ? DELIVERY_MODEL_BADGES.direct_instant
      : order.subMode === "scheduled"
        ? DELIVERY_MODEL_BADGES.direct_scheduled
        : order.deliveryModel === "inspection_required"
          ? DELIVERY_MODEL_BADGES.inspection_required
          : DELIVERY_MODEL_BADGES.custom;

  if (!statusCfg) return null;

  const sizes = {
    sm: "px-2.5 py-1 text-[10px] font-bold",
    md: "px-3.5 py-1.5 text-[11px] font-bold",
    lg: "px-4 py-2 text-[12px] font-bold",
  };

  const StatusIcon = statusCfg.icon;
  const DeliveryEmoji = deliveryBadge.emoji;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Delivery Model Badge */}
      <span
        className={`inline-flex items-center gap-1 rounded-full border ${deliveryBadge.color} ${sizes[size]} transition-all`}
      >
        <span>{DeliveryEmoji}</span>
        {size !== "sm" && deliveryBadge.label}
      </span>

      {/* Status Badge */}
      <span
        className={`inline-flex items-center gap-1 rounded-full border ${statusCfg.badge} ${sizes[size]} transition-all`}
      >
        <StatusIcon size={size === "sm" ? 12 : size === "md" ? 14 : 16} />
        {size !== "sm" && statusCfg.label}
      </span>

      {/* Description (optional) */}
      {showDescription && size !== "sm" && (
        <p className="mt-1 text-[11px] text-slate-600">{statusCfg.description}</p>
      )}
    </div>
  );
}
