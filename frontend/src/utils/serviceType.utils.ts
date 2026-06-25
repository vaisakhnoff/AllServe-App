/**
 * Service Type Utilities (Frontend)
 *
 * Mirror of the backend helpers — same logic, no network calls.
 * Import these wherever you need to drive UI differences based on serviceType.
 */

import type { ServiceType, PricingModel } from "@/types/service.types";

// ── Booking-flow guards ──────────────────────────────────────────────────────

/** True for services that can be booked via time-slot selection. */
export function canBookThroughSlots(serviceType: ServiceType): boolean {
  return serviceType === "instant" || serviceType === "visit_first";
}

/** True for services that go through the service-request / bidding flow. */
export function requiresServiceRequest(serviceType: ServiceType): boolean {
  return serviceType === "custom";
}

/** True for services where the provider must visit before pricing. */
export function requiresInspection(serviceType: ServiceType): boolean {
  return serviceType === "visit_first";
}

// ── User-facing labels ───────────────────────────────────────────────────────

/** Short label shown on service-type badges (e.g. "Instant Booking"). */
export function getServiceTypeLabel(serviceType: ServiceType): string {
  switch (serviceType) {
    case "instant":
      return "Instant Booking";
    case "visit_first":
      return "Inspection Required";
    case "custom":
      return "Custom Quote";
  }
}

/** Emoji prefix for each service type – used in forms and cards. */
export function getServiceTypeEmoji(serviceType: ServiceType): string {
  switch (serviceType) {
    case "instant":
      return "⚡";
    case "visit_first":
      return "🏠";
    case "custom":
      return "🎨";
  }
}

/** Full description of the booking flow for the service-detail info panel. */
export function getBookingFlowDescription(serviceType: ServiceType): string {
  switch (serviceType) {
    case "instant":
      return "Book instantly by selecting an available time slot and confirming your address. Payment is collected after service completion.";
    case "visit_first":
      return "Book a free inspection visit. The provider will assess the job and send you a detailed quote. Work begins only after you approve the estimate.";
    case "custom":
      return "Post your requirements as a service request. Multiple providers will send you competitive quotes. Choose the best offer and proceed with milestone-based payments.";
  }
}

/** Short payment-model description for the service-detail sidebar. */
export function getPaymentFlowDescription(serviceType: ServiceType): string {
  switch (serviceType) {
    case "instant":
      return "Full amount collected after service completion.";
    case "visit_first":
      return "Pay after receiving and approving the provider's estimate. A deposit may be required to confirm the booking.";
    case "custom":
      return "Payment terms agreed with the provider. Typically split into milestones (advance, mid-work, completion).";
  }
}

/** CTA button text for the primary booking action. */
export function getBookingCTA(serviceType: ServiceType): string {
  switch (serviceType) {
    case "instant":
      return "Book Now";
    case "visit_first":
      return "Schedule Inspection";
    case "custom":
      return "Request Quote";
  }
}

/** Slot-section heading shown on the service-detail page. */
export function getSlotSectionTitle(serviceType: ServiceType): string {
  switch (serviceType) {
    case "instant":
      return "Available Slots";
    case "visit_first":
      return "Schedule Inspection Visit";
    case "custom":
      return "Post a Service Request";
  }
}

// ── Price formatting ─────────────────────────────────────────────────────────

/**
 * Returns a formatted price string appropriate for the pricing model.
 *
 * Examples:
 *   fixed      → "₹500"
 *   per_unit   → "₹15/sq.ft"
 *   hourly     → "₹300/hr"
 *   starting_from → "From ₹5,000"
 *   quote_based   → "Get quotes" (or "Est. ₹50,000" when price > 0)
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
 * Returns Tailwind classes for the service-type badge.
 *
 * Usage: <span className={getServiceTypeBadgeClass(service.serviceType)}>...</span>
 */
export function getServiceTypeBadgeClass(serviceType: ServiceType): string {
  switch (serviceType) {
    case "instant":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "visit_first":
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
 * Returns the set of pricing-model options appropriate for a given service type.
 * Used to populate the dropdown in the service-creation form.
 */
export function getPricingModelsForServiceType(
  serviceType: ServiceType
): PricingModelOption[] {
  switch (serviceType) {
    case "instant":
      return [
        { value: "fixed", label: "Fixed Price", hint: "e.g. ₹500 flat rate" },
        { value: "hourly", label: "Hourly Rate", hint: "e.g. ₹300 per hour" },
      ];
    case "visit_first":
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
export function getMinAdvanceBookingHours(serviceType: ServiceType): number {
  switch (serviceType) {
    case "instant":
      return 2;
    case "visit_first":
      return 24;
    case "custom":
      return 48;
  }
}
