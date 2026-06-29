/**
 * Centralized configuration for order status displays, actions, and messaging
 * Used across bookings and requests pages for consistency
 */

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Play,
  CheckSquare,
  Pause,
  Trash2,
  Eye,
  MessageSquare,
  DollarSign,
  LucideIcon,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────
// STATUS CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────

export type OrderPhase = "awaiting" | "active" | "completed" | "cancelled" | "payment";

export interface StatusConfig {
  label: string;
  description: string;
  phase: OrderPhase;
  icon: LucideIcon;
  dot: string;
  bg: string;
  border: string;
  badge: string;
  actions: string[]; // action keys provider can take
  nextStatus?: string; // what status comes next
  warning?: string; // show warning if applicable
}

export const ORDER_STATUS_CONFIG: Record<string, StatusConfig> = {
  // Direct Orders
  awaiting_provider_response: {
    label: "Awaiting Response",
    description: "Customer is waiting for your response",
    phase: "awaiting",
    icon: Clock,
    dot: "bg-yellow-500",
    bg: "bg-yellow-50 text-yellow-700 border-yellow-200",
    border: "border-yellow-200",
    badge: "border-yellow-200 bg-yellow-50 text-yellow-700",
    actions: ["accept", "reject", "message"],
    nextStatus: "accepted",
    warning: "Respond within 30 minutes to avoid auto-rejection",
  },

  accepted: {
    label: "Accepted",
    description: "Order accepted, waiting to start work",
    phase: "awaiting",
    icon: CheckCircle2,
    dot: "bg-blue-500",
    bg: "bg-blue-50 text-blue-700 border-blue-200",
    border: "border-blue-200",
    badge: "border-blue-200 bg-blue-50 text-blue-700",
    actions: ["start_work", "cancel", "message"],
    nextStatus: "in_progress",
  },

  in_progress: {
    label: "Work In Progress",
    description: "You are currently working on this order",
    phase: "active",
    icon: Play,
    dot: "bg-blue-600",
    bg: "bg-blue-100 text-blue-800 border-blue-300",
    border: "border-blue-300",
    badge: "border-blue-300 bg-blue-100 text-blue-800",
    actions: ["complete_work", "message"],
    nextStatus: "work_completed",
    warning: "Make sure to mark as complete when finished",
  },

  work_completed: {
    label: "Work Completed",
    description: "Work is done, awaiting payment",
    phase: "payment",
    icon: CheckSquare,
    dot: "bg-green-500",
    bg: "bg-green-50 text-green-700 border-green-200",
    border: "border-green-200",
    badge: "border-green-200 bg-green-50 text-green-700",
    actions: ["create_invoice", "message"],
    nextStatus: "completed",
  },

  completed: {
    label: "Completed",
    description: "Order completed and payment received",
    phase: "completed",
    icon: CheckCircle2,
    dot: "bg-emerald-600",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    border: "border-emerald-200",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    actions: ["view_invoice", "message"],
  },

  rejected_by_provider: {
    label: "Rejected",
    description: "You rejected this order",
    phase: "cancelled",
    icon: XCircle,
    dot: "bg-red-500",
    bg: "bg-red-50 text-red-700 border-red-200",
    border: "border-red-200",
    badge: "border-red-200 bg-red-50 text-red-700",
    actions: [],
  },

  cancelled: {
    label: "Cancelled",
    description: "This order has been cancelled",
    phase: "cancelled",
    icon: XCircle,
    dot: "bg-slate-500",
    bg: "bg-slate-50 text-slate-700 border-slate-200",
    border: "border-slate-200",
    badge: "border-slate-200 bg-slate-50 text-slate-700",
    actions: [],
  },

  // Inspection Orders
  inspection_accepted: {
    label: "Inspection Scheduled",
    description: "Schedule your inspection visit",
    phase: "active",
    icon: Eye,
    dot: "bg-purple-500",
    bg: "bg-purple-50 text-purple-700 border-purple-200",
    border: "border-purple-200",
    badge: "border-purple-200 bg-purple-50 text-purple-700",
    actions: ["complete_inspection", "cancel"],
    nextStatus: "inspection_completed",
  },

  inspection_completed: {
    label: "Inspection Done",
    description: "Submit your quotation for this work",
    phase: "active",
    icon: CheckSquare,
    dot: "bg-purple-600",
    bg: "bg-purple-100 text-purple-800 border-purple-300",
    border: "border-purple-300",
    badge: "border-purple-300 bg-purple-100 text-purple-800",
    actions: ["submit_quotation", "cancel"],
    nextStatus: "quotation_submitted",
  },

  quotation_accepted: {
    label: "Quote Accepted",
    description: "Customer accepted your quote. Ready to start work",
    phase: "awaiting",
    icon: CheckCircle2,
    dot: "bg-indigo-500",
    bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    border: "border-indigo-200",
    badge: "border-indigo-200 bg-indigo-50 text-indigo-700",
    actions: ["start_work", "cancel", "message"],
    nextStatus: "in_progress",
    warning: "Customer has approved your quote. Start work when ready",
  },

  // Custom/Service Request Orders
  quotation_accepted_custom: {
    label: "Quote Accepted",
    description: "Customer accepted your quote from service request",
    phase: "awaiting",
    icon: CheckCircle2,
    dot: "bg-orange-500",
    bg: "bg-orange-50 text-orange-700 border-orange-200",
    border: "border-orange-200",
    badge: "border-orange-200 bg-orange-50 text-orange-700",
    actions: ["start_work", "cancel", "message"],
    nextStatus: "in_progress",
  },
};

// ─────────────────────────────────────────────────────────────────────────
// ACTION CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────

export interface ActionConfig {
  label: string;
  description: string;
  icon: LucideIcon;
  variant: "success" | "warning" | "danger" | "primary";
  confirmation: string; // confirmation message before action
  successMessage: string;
  errorMessage: string;
}

export const ORDER_ACTION_CONFIG: Record<string, ActionConfig> = {
  accept: {
    label: "Accept Order",
    description: "Confirm you can handle this order",
    icon: CheckCircle2,
    variant: "success",
    confirmation: "Are you sure you want to accept this order? You will be committed to completing it.",
    successMessage: "Order accepted successfully",
    errorMessage: "Failed to accept order",
  },

  reject: {
    label: "Reject Order",
    description: "Decline this order",
    icon: XCircle,
    variant: "danger",
    confirmation: "Are you sure? The customer will be notified and can choose another provider.",
    successMessage: "Order rejected",
    errorMessage: "Failed to reject order",
  },

  start_work: {
    label: "Start Work",
    description: "Begin working on this order",
    icon: Play,
    variant: "success",
    confirmation: "Mark this order as in progress? Your status will show as busy.",
    successMessage: "Work started successfully",
    errorMessage: "Failed to start work",
  },

  complete_work: {
    label: "Mark Complete",
    description: "Finish this order",
    icon: CheckSquare,
    variant: "success",
    confirmation: "Are you sure work is complete? This will move to payment phase.",
    successMessage: "Work marked as complete",
    errorMessage: "Failed to mark as complete",
  },

  complete_inspection: {
    label: "Inspection Done",
    description: "Complete the inspection visit",
    icon: CheckSquare,
    variant: "success",
    confirmation: "Mark inspection as complete? You can now submit your quotation.",
    successMessage: "Inspection marked as complete",
    errorMessage: "Failed to mark inspection as complete",
  },

  submit_quotation: {
    label: "Submit Quotation",
    description: "Send your price quote for this work",
    icon: MessageSquare,
    variant: "primary",
    confirmation: "Submit this quotation? Customer will review and decide.",
    successMessage: "Quotation submitted successfully",
    errorMessage: "Failed to submit quotation",
  },

  cancel: {
    label: "Cancel Order",
    description: "Cancel this order",
    icon: Trash2,
    variant: "danger",
    confirmation: "Are you sure? You will drop out of this order.",
    successMessage: "Order cancelled",
    errorMessage: "Failed to cancel order",
  },

  create_invoice: {
    label: "Create Invoice",
    description: "Generate invoice for payment",
    icon: DollarSign,
    variant: "primary",
    confirmation: "Create invoice for this completed work?",
    successMessage: "Invoice created successfully",
    errorMessage: "Failed to create invoice",
  },

  view_invoice: {
    label: "View Invoice",
    description: "View invoice details",
    icon: DollarSign,
    variant: "primary",
    confirmation: "",
    successMessage: "",
    errorMessage: "",
  },

  message: {
    label: "Message Customer",
    description: "Send a message to the customer",
    icon: MessageSquare,
    variant: "primary",
    confirmation: "",
    successMessage: "Message sent",
    errorMessage: "Failed to send message",
  },
};

// ─────────────────────────────────────────────────────────────────────────
// DELIVERY MODEL BADGES
// ─────────────────────────────────────────────────────────────────────────

export interface DeliveryModelBadge {
  label: string;
  emoji: string;
  color: string;
  description: string;
}

export const DELIVERY_MODEL_BADGES: Record<string, DeliveryModelBadge> = {
  direct_instant: {
    label: "Instant",
    emoji: "🚀",
    color: "bg-red-50 text-red-700 border-red-200",
    description: "Instant booking with fixed pricing",
  },
  direct_scheduled: {
    label: "Scheduled",
    emoji: "📅",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Scheduled for a future date",
  },
  inspection_required: {
    label: "Inspection",
    emoji: "🔍",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    description: "Inspection first, then quote",
  },
  custom: {
    label: "Service Request",
    emoji: "📋",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    description: "Custom service request from marketplace",
  },
};

// ─────────────────────────────────────────────────────────────────────────
// WARNING MESSAGES
// ─────────────────────────────────────────────────────────────────────────

export const WARNING_MESSAGES: Record<string, string> = {
  response_deadline: "⏰ Respond within 30 minutes to avoid auto-rejection",
  acceptance_commitment: "✓ Accepting this order commits you to completion",
  work_in_progress: "⚡ Your status is shown as busy while work is in progress",
  completion_before_invoice: "📝 Mark work as complete before creating invoice",
  no_cancel_in_progress: "❌ Cannot cancel once work has started",
  inspect_before_quote: "🔍 Complete inspection before submitting quotation",
};

// ─────────────────────────────────────────────────────────────────────────
// CONFIRMATION MESSAGES
// ─────────────────────────────────────────────────────────────────────────

export const CONFIRMATION_MESSAGES: Record<string, string> = {
  accept_order: "Accept this order and commit to completing it?",
  reject_order: "Reject this order? Customer will be notified.",
  start_work: "Start work on this order? Your status will show as busy.",
  complete_work: "Mark work as complete? This is final and moves to payment.",
  cancel_order: "Cancel this order? You will be removed from it.",
  submit_quotation: "Submit this quotation? Customer will review it.",
};

// ─────────────────────────────────────────────────────────────────────────
// SUCCESS/ERROR MESSAGES
// ─────────────────────────────────────────────────────────────────────────

export const SUCCESS_MESSAGES: Record<string, string> = {
  order_accepted: "✓ Order accepted successfully. Get ready to start work!",
  order_rejected: "✓ Order rejected. You remain available for other bookings.",
  work_started: "✓ Work started. Your status is now busy.",
  work_completed: "✓ Work completed. Move to payment or create invoice.",
  order_cancelled: "✓ Order cancelled. You are now available again.",
  quotation_submitted: "✓ Quotation submitted. Awaiting customer decision.",
  inspection_completed: "✓ Inspection complete. Ready to submit quotation.",
};

export const ERROR_MESSAGES: Record<string, string> = {
  order_not_found: "❌ Order not found. Please refresh and try again.",
  invalid_status_transition: "❌ Cannot perform this action in current order status.",
  already_responded: "❌ You have already responded to this order.",
  provider_busy: "❌ You are currently busy. Complete other work first.",
  quotation_exists: "❌ You have already submitted a quotation for this.",
  network_error: "❌ Network error. Please check your connection.",
};
