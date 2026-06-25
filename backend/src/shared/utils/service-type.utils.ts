/**
 * Delivery Model Utilities
 * Helper functions for working with different delivery models and their booking flows
 */

import { DeliveryModel } from "../../models/service.model";

/**
 * Check if a service requires an inspection visit before final pricing
 */
export function requiresInspection(deliveryModel: DeliveryModel): boolean {
  return deliveryModel === "inspection_required";
}

/**
 * Check if a service supports direct booking (instant or scheduled)
 */
export function supportsDirectBooking(deliveryModel: DeliveryModel): boolean {
  return deliveryModel === "direct";
}

/**
 * Check if a service uses the bidding/quote flow
 */
export function usesBiddingFlow(deliveryModel: DeliveryModel): boolean {
  return deliveryModel === "custom";
}

/**
 * Get the recommended booking flow description for a delivery model
 */
export function getBookingFlowDescription(deliveryModel: DeliveryModel): string {
  switch (deliveryModel) {
    case "direct":
      return "Request service instantly or schedule for a preferred date. Provider accepts and visits to complete the work.";
    
    case "inspection_required":
      return "Book an inspection visit. Provider will assess and send you a detailed quotation. Work begins after you approve the estimate.";
    
    case "custom":
      return "Post your requirements as a service request. Multiple providers will send you quotes. Choose the best offer and proceed.";
    
    default:
      return "Book this service";
  }
}

/**
 * Get the payment flow description for a delivery model
 */
export function getPaymentFlowDescription(deliveryModel: DeliveryModel): string {
  switch (deliveryModel) {
    case "direct":
      return "Provider generates an invoice after completing the work. Pay online or by cash.";
    
    case "inspection_required":
      return "Pay after receiving and approving the provider's quotation. May include advance payment before work begins.";
    
    case "custom":
      return "Payment terms agreed with the provider. Typically includes advance payment and final balance after completion.";
    
    default:
      return "Payment required";
  }
}

/**
 * Validate if a service's pricing model is appropriate for its delivery model
 */
export function isValidPricingModelForDeliveryModel(
  deliveryModel: DeliveryModel,
  pricingModel: string
): { valid: boolean; message?: string } {
  const validCombinations: Record<DeliveryModel, string[]> = {
    direct: ["fixed", "hourly"],
    inspection_required: ["per_unit", "starting_from", "hourly"],
    custom: ["quote_based", "starting_from"],
  };

  const validModels = validCombinations[deliveryModel];
  
  if (!validModels.includes(pricingModel)) {
    return {
      valid: false,
      message: `Pricing model '${pricingModel}' is not recommended for delivery model '${deliveryModel}'. Recommended: ${validModels.join(", ")}`,
    };
  }

  return { valid: true };
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
 * Check if a service can be booked through schedule-based time windows
 */
export function canBookThroughSchedule(deliveryModel: DeliveryModel): boolean {
  return deliveryModel === "direct" || deliveryModel === "inspection_required";
}

/**
 * Check if a service requires the custom request/broadcast flow
 */
export function requiresCustomRequest(deliveryModel: DeliveryModel): boolean {
  return deliveryModel === "custom";
}

/**
 * Get the minimum advance booking time in hours for a delivery model
 */
export function getMinimumAdvanceBookingHours(deliveryModel: DeliveryModel): number {
  switch (deliveryModel) {
    case "direct":
      return 2; // Can book 2 hours in advance
    
    case "inspection_required":
      return 24; // Need at least 24 hours for inspection scheduling
    
    case "custom":
      return 48; // Need at least 48 hours for quote collection
    
    default:
      return 24;
  }
}
