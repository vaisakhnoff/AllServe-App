/**
 * Delivery Model Utilities (Frontend)
 *
 * Helper functions for driving UI differences based on a service's deliveryModel.
 * Function names use "ServiceType" prefix for backward compat with existing components.
 */

import type { DeliveryModel, PricingModel } from "@/types/service.types";

/** @deprecated Use DeliveryModel type directly */
type ServiceType = DeliveryModel;

// ── Booking-flow guards ──────────────────────────────────────────────────────

/** True for services that can be booked via schedule-based time windows. */
export function canBookThroughSlots(deliveryModel: ServiceType): boolean {
  return deliveryModel === "direct" || deliveryModel === "inspection_required";
}

/** True for services that go through the custom request / broadcast flow. */
export function requiresServiceRequest(deliveryModel: ServiceType): boolean {
  return deliveryModel === "custom";
}

/** True for services where the provider must visit/inspect before pricing. */
export function requiresInspection(deliveryModel: ServiceType): boolean {
  return deliveryModel === "inspection_required";
}

// ── User-facing labels ───────────────────────────────────────────────────────

/** Short label shown on delivery-model badges. */
export function getServiceTypeLabel(deliveryModel: ServiceType): string {
  switch (deliveryModel) {
    case "direct":
      return "Direct Service";
    case "inspection_required":
      return "Inspection Required";
    case "custom":
      return "Custom Quote";
  }
}

/** Emoji prefix for each delivery model – used in forms and cards. */
export function getServiceTypeEmoji(deliveryModel: ServiceType): string {
  switch (deliveryModel) {
    case "direct":
      return "⚡";
    case "inspection_required":
      return "🏠";
    case "custom":
      return "🎨";
  }
}

/** Full description of the booking flow for the service-detail info panel. */
export function getBookingFlowDescription(deliveryModel: ServiceType): string {
  switch (deliveryModel) {
    case "direct":
      return "Request this service instantly or schedule for a preferred date and time. The provider accepts, visits, and completes the work. Payment via invoice after completion.";
    case "inspection_required":
      return "Book an inspection visit. The provider will assess the job and send you a detailed quotation. Work begins only after you approve the estimate.";
    case "custom":
      return "Post your requirements as a service request. Multiple providers will send you competitive quotes. Choose the best offer and proceed with milestone-based payments.";
  }
}

/** Short payment-model description for the service-detail sidebar. */
export function getPaymentFlowDescription(deliveryModel: ServiceType): string {
  switch (deliveryModel) {
    case "direct":
      return "Provider generates invoice after work completion. Pay online or by cash.";
    case "inspection_required":
      return "Pay after receiving and approving the provider's quotation. Advance payment may be required.";
    case "custom":
      return "Payment terms agreed with the provider. Typically advance + final balance after completion.";
  }
}

/** CTA button text for the primary booking action. */
export function getBookingCTA(deliveryModel: ServiceType): string {
  switch (deliveryModel) {
    case "direct":
      return "Request Service";
    case "inspection_required":
      return "Schedule Inspection";
    case "custom":
      return "Request Quote";
  }
}

/** Slot-section heading shown on the service-detail page. */
export function getSlotSectionTitle(deliveryModel: ServiceType): string {
  switch (deliveryModel) {
    case "direct":
      return "Available Time Windows";
    case "inspection_required":
      return "Schedule Inspection Visit";
    case "custom":
      return "Post a Service Request";
  }
}

// ── Price formatting ─────────────────────────────────────────────────────────

/**
 * Returns a formatted price string appropriate for the pricing model.
 */
export function getDisplayPrice(
  price: number,
  pricingModel: PricingModel,
  priceUnit?: string | null
): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

  switch (pricingModel) {
    case "fixed":
      return `₹${fmt(price)}`;
    case "per_unit":
      return `₹${fmt(price)}/${priceUnit ?? "unit"}`;
    case "hourly":
      return `₹${fmt(price)}/hr`;
    case "starting_from":
      return `From ₹${fmt(price)}`;
    case "quote_based":
      return price > 0 ? `Est. ₹${fmt(price)}` : "Get quotes";
  }
}

/**
 * Returns a secondary price-detail line shown below the main price.
 * Returns null when no extra context is needed.
 */
export function getPriceSubline(
  pricingModel: PricingModel,
  duration: number,
  estimatedProjectDays?: number | null
): string | null {
  switch (pricingModel) {
    case "per_unit":
      return "Price varies by area / quantity";
    case "hourly":
      return `${duration} min typical session`;
    case "starting_from":
      return estimatedProjectDays
        ? `Est. ${estimatedProjectDays} day${estimatedProjectDays > 1 ? "s" : ""} project`
        : "Final price after inspection";
    case "quote_based":
      return "Final price negotiated with provider";
    default:
      return null;
  }
}

// ── Tailwind colour helpers ──────────────────────────────────────────────────

/**
 * Returns Tailwind classes for the delivery-model badge.
 */
export function getServiceTypeBadgeClass(deliveryModel: ServiceType): string {
  switch (deliveryModel) {
    case "direct":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "inspection_required":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "custom":
      return "bg-purple-50 text-purple-700 border border-purple-200";
  }
}

// ── Pricing-model helpers for forms ─────────────────────────────────────────

export interface PricingModelOption {
  value: PricingModel;
  label: string;
  hint: string;
}

/**
 * Returns the set of pricing-model options appropriate for a given delivery model.
 * Used to populate the dropdown in the service-creation form.
 */
export function getPricingModelsForServiceType(
  deliveryModel: ServiceType
): PricingModelOption[] {
  switch (deliveryModel) {
    case "direct":
      return [
        { value: "fixed", label: "Fixed Price", hint: "e.g. ₹500 flat rate" },
        { value: "hourly", label: "Hourly Rate", hint: "e.g. ₹300 per hour" },
      ];
    case "inspection_required":
      return [
        { value: "per_unit", label: "Per Unit", hint: "e.g. ₹15 per sq.ft" },
        { value: "starting_from", label: "Starting From", hint: "e.g. Starting from ₹5,000" },
        { value: "hourly", label: "Hourly Rate", hint: "e.g. ₹500 per hour" },
      ];
    case "custom":
      return [
        { value: "quote_based", label: "Quote Based", hint: "Price determined by bidding" },
        { value: "starting_from", label: "Starting From", hint: "Provide a baseline estimate" },
      ];
  }
}

// ── Minimum advance booking time ─────────────────────────────────────────────

/** Returns minimum hours before a service can be booked. */
export function getMinAdvanceBookingHours(deliveryModel: ServiceType): number {
  switch (deliveryModel) {
    case "direct":
      return 2;
    case "inspection_required":
      return 24;
    case "custom":
      return 48;
  }
}
