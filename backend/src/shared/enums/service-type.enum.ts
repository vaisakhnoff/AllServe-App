/**
 * Service Type Classification Enums
 * These enums define the different types of services and their pricing models
 */

export enum ServiceType {
  /** 
   * Instant services: Fixed duration, price known upfront, immediate booking
   * Examples: Haircut, basic plumbing fix, house cleaning (standard room)
   * Booking flow: User picks slot → pays → done
   */
  INSTANT = "instant",
  
  /** 
   * Visit first services: Provider must visit/inspect before final pricing
   * Examples: House painting, renovation, deep cleaning (entire house)
   * Booking flow: User books FREE inspection → provider visits → provider sends quote → user approves → work begins
   */
  VISIT_FIRST = "visit_first",
  
  /** 
   * Custom services: Fully negotiated scope via bidding
   * Examples: PC build from scratch, interior design, complex projects
   * Booking flow: User posts request → providers bid → user picks quote → milestone payments
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
 * Recommended pricing models for each service type:
 * 
 * INSTANT services:
 *   - FIXED: Most common (e.g., ₹500 for haircut)
 *   - HOURLY: For time-based services (e.g., ₹300/hour for tutoring)
 * 
 * VISIT_FIRST services:
 *   - PER_UNIT: For measurable services (e.g., ₹15/sq.ft for painting)
 *   - STARTING_FROM: When exact pricing needs inspection (e.g., "Starting from ₹5,000")
 * 
 * CUSTOM services:
 *   - QUOTE_BASED: Price determined through bidding
 *   - STARTING_FROM: Can provide baseline estimate
 */
