/**
 * Delivery Model Classification Enums
 * These enums define the different delivery models for services and their pricing models
 */

export enum DeliveryModel {
  /** 
   * Direct services: Fixed duration, price known upfront, immediate or scheduled booking
   * Examples: Haircut, basic plumbing fix, house cleaning (standard room)
   * Booking flow: User selects provider → instant request or scheduled request → provider accepts
   */
  DIRECT = "direct",
  
  /** 
   * Inspection required services: Provider must visit/inspect before final pricing
   * Examples: House painting, renovation, deep cleaning (entire house)
   * Booking flow: User requests inspection → provider visits → provider sends quotation → user approves → work begins
   */
  INSPECTION_REQUIRED = "inspection_required",
  
  /** 
   * Custom services: Fully negotiated scope via bidding
   * Examples: PC build from scratch, interior design, complex projects
   * Booking flow: User posts request → providers bid → user picks quotation → advance payment → work begins
   */
  CUSTOM = "custom",
}

export enum PricingModel {
  /** Single fixed price (e.g., ₹500 for haircut) */
  FIXED = "fixed",
  
  /** Price per unit with unit specification (e.g., ₹15/sq.ft for painting) */
  PER_UNIT = "per_unit",
  
  /** Price per hour (e.g., ₹300/hour for consultation) */
  HOURLY = "hourly",
  
  /** Minimum price, actual price determined after inspection */
  STARTING_FROM = "starting_from",
  
  /** No upfront price, determined through bidding */
  QUOTE_BASED = "quote_based",
}

/**
 * Recommended pricing models for each delivery model:
 * 
 * DIRECT services:
 *   - FIXED: Most common (e.g., ₹500 for haircut)
 *   - HOURLY: For time-based services (e.g., ₹300/hour for tutoring)
 * 
 * INSPECTION_REQUIRED services:
 *   - PER_UNIT: For measurable services (e.g., ₹15/sq.ft for painting)
 *   - STARTING_FROM: When exact pricing needs inspection (e.g., "Starting from ₹5,000")
 * 
 * CUSTOM services:
 *   - QUOTE_BASED: Price determined through bidding
 *   - STARTING_FROM: Can provide baseline estimate
 */
