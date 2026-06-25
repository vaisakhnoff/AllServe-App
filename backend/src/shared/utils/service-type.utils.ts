/**
 * Service Type Utilities
 * Helper functions for working with different service types and their booking flows
 */

import { ServiceType } from "../../models/service.model";

/**
 * Check if a service requires an inspection visit before final pricing
 */
export function requiresInspection(serviceType: ServiceType): boolean {
  return serviceType === "visit_first";
}

/**
 * Check if a service supports instant booking (with immediate payment)
 */
export function supportsInstantBooking(serviceType: ServiceType): boolean {
  return serviceType === "instant";
}

/**
 * Check if a service uses the bidding/quote flow
 */
export function usesBiddingFlow(serviceType: ServiceType): boolean {
  return serviceType === "custom";
}

/**
 * Get the recommended booking flow description for a service type
 */
export function getBookingFlowDescription(serviceType: ServiceType): string {
  switch (serviceType) {
    case "instant":
      return "Book instantly by selecting an available time slot and making payment";
    
    case "visit_first":
      return "Book a free inspection visit. Provider will assess and send you a detailed quote. Work begins after you approve the estimate.";
    
    case "custom":
      return "Post your requirements as a service request. Multiple providers will send you quotes. Choose the best offer and proceed.";
    
    default:
      return "Book this service";
  }
}

/**
 * Get the payment flow description for a service type
 */
export function getPaymentFlowDescription(serviceType: ServiceType): string {
  switch (serviceType) {
    case "instant":
      return "Pay the full amount upfront when booking";
    
    case "visit_first":
      return "Pay after receiving and approving the provider's estimate. May include deposit or milestone payments.";
    
    case "custom":
      return "Payment terms negotiated with the provider. Typically includes milestone-based payments.";
    
    default:
      return "Payment required";
  }
}

/**
 * Validate if a service's pricing model is appropriate for its service type
 */
export function isValidPricingModelForServiceType(
  serviceType: ServiceType,
  pricingModel: string
): { valid: boolean; message?: string } {
  const validCombinations: Record<ServiceType, string[]> = {
    instant: ["fixed", "hourly"],
    visit_first: ["per_unit", "starting_from", "hourly"],
    custom: ["quote_based", "starting_from"],
  };

  const validModels = validCombinations[serviceType];
  
  if (!validModels.includes(pricingModel)) {
    return {
      valid: false,
      message: `Pricing model '${pricingModel}' is not recommended for service type '${serviceType}'. Recommended: ${validModels.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Calculate buffer time based on service type and duration
 * Returns buffer time in minutes
 */
export function calculateBufferTime(
  serviceType: ServiceType,
  duration: number,
  categoryBufferMinutes: number = 15
): number {
  switch (serviceType) {
    case "instant":
      // For instant services, use category default or calculate based on duration
      return Math.max(categoryBufferMinutes, Math.ceil(duration * 0.15)); // 15% of duration or category default
    
    case "visit_first":
      // Inspection visits typically need minimal buffer
      return 10;
    
    case "custom":
      // Custom services don't use traditional slots, so buffer is not applicable
      return 0;
    
    default:
      return categoryBufferMinutes;
  }
}

/**
 * Get display price text based on pricing model
 */
export function getDisplayPrice(price: number, pricingModel: string, priceUnit?: string): string {
  switch (pricingModel) {
    case "fixed":
      return `₹${price.toFixed(2)}`;
    
    case "per_unit":
      return `₹${price.toFixed(2)}/${priceUnit || "unit"}`;
    
    case "hourly":
      return `₹${price.toFixed(2)}/hour`;
    
    case "starting_from":
      return `Starting from ₹${price.toFixed(2)}`;
    
    case "quote_based":
      return price > 0 ? `Estimated: ₹${price.toFixed(2)}` : "Get quotes";
    
    default:
      return `₹${price.toFixed(2)}`;
  }
}

/**
 * Check if a service can be booked through traditional slot booking
 */
export function canBookThroughSlots(serviceType: ServiceType): boolean {
  return serviceType === "instant" || serviceType === "visit_first";
}

/**
 * Check if a service requires the service request flow
 */
export function requiresServiceRequest(serviceType: ServiceType): boolean {
  return serviceType === "custom";
}

/**
 * Get the minimum advance booking time in hours for a service type
 */
export function getMinimumAdvanceBookingHours(serviceType: ServiceType): number {
  switch (serviceType) {
    case "instant":
      return 2; // Can book 2 hours in advance
    
    case "visit_first":
      return 24; // Need at least 24 hours for inspection scheduling
    
    case "custom":
      return 48; // Need at least 48 hours for quote collection
    
    default:
      return 24;
  }
}
