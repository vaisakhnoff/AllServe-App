# Requirements: Service Flow Redesign

## Requirement 1: Service Delivery Model Classification
**User Story:** As an admin or provider, I want every service to declare its delivery model, so that the platform routes requests through the correct workflow.

### Acceptance Criteria
- [x] THE AllServe_Platform SHALL classify every service into exactly one of three delivery models: Direct, Inspection_Required, Custom.
- [x] WHEN a provider creates a service, THE AllServe_Platform SHALL require the provider to select a delivery model.
- [x] WHERE a service has delivery model Direct, THE Direct_Request_Module SHALL allow customers to submit either an Instant Request or a Scheduled Request.
- [x] WHERE a service has delivery model Inspection_Required, THE Inspection_Request_Module SHALL be the only request flow available.
- [x] WHERE a service has delivery model Custom, THE Custom_Request_Module SHALL be the only request flow available.
- [x] WHERE a category defines a default delivery model, THE AllServe_Platform SHALL pre-select that delivery model when a provider creates a new service.

## Requirement 2: Direct Service Request Lifecycle
**User Story:** As a customer, I want to request a Direct service either immediately or for a future date.

### Acceptance Criteria
- [x] Instant Request: customer selects provider, enters description + location, pays booking fee → status "awaiting_provider_response"
- [x] Scheduled Request: customer selects provider, preferred date + time → status "awaiting_provider_response"
- [x] Provider accepts → status "accepted"
- [x] Provider rejects → status "rejected_by_provider" → Customer Choice flow
- [x] Provider generates Final Invoice → status "awaiting_payment"
- [x] Payment completed → status "completed"
- [x] Preferred date/time is non-binding; no time slots reserved

## Requirement 3: Thirty-Minute Response Window for Instant Requests
### Acceptance Criteria
- [x] 30-minute timer starts on Instant Request creation
- [x] Timer expires without response → status "provider_unresponsive" → Customer Choice flow
- [x] Provider responds before timer → timer halted
- [x] Timer applies only to Instant Requests, not Scheduled

## Requirement 4: Customer Choice After Non-Response or Rejection
### Acceptance Criteria
- [x] Customer gets two options: "re-route to another provider" or "refund booking fee"
- [x] Re-route: new request created, booking fee transferred (no re-charge)
- [x] Refund: full booking fee refunded, status "cancelled_with_refund"
- [x] 24-hour auto-refund if no choice made

## Requirement 5: Provider Online/Offline Visibility Mode
### Acceptance Criteria
- [x] Binary visibility flag: "online" / "offline", initialised to "offline"
- [x] Online → included in candidate list for Instant Requests
- [x] Offline → excluded from candidate list; accepted requests still accessible

## Requirement 6: Provider Available/Busy Engagement Status
### Acceptance Criteria
- [x] Engagement flag: "available" / "busy", system-managed
- [x] Accept Instant Request → "busy"
- [x] Complete Instant Request → "available"
- [x] Busy → reject new Instant Requests; still allow Scheduled/Inspection/Custom

## Requirement 7: Inspection Required Service Lifecycle
### Acceptance Criteria
- [x] Customer submits inspection request (description, images, location) → status "inspection_pending"
- [x] Provider contacts customer directly for scheduling (no platform scheduling)
- [x] Provider uploads Quotation → status "quotation_submitted"
- [x] Customer accepts quotation → "quotation_accepted"
- [x] Advance payment if required → "awaiting_advance" → "in_progress"
- [x] Final invoice → "awaiting_final_payment" → "completed"

## Requirement 8: Custom Request Broadcast and Lifecycle
### Acceptance Criteria
- [x] Customer creates request (title, description, budget, images) → status "broadcast_open"
- [x] Broadcast to all matching providers in region within 5 seconds
- [x] Providers submit quotations
- [x] Customer accepts one quotation → all siblings rejected
- [x] Advance if required → "in_progress" → Final invoice → "completed"
- [x] 7-day default expiry

## Requirement 9: Quotation Lifecycle
### Acceptance Criteria
- [x] Quotation fields: labour, material, duration, notes, terms, advance amount
- [x] Customer can accept, reject, or request modifications
- [x] Provider can re-submit after modification request
- [x] Immutable revision history

## Requirement 10: Platform Fees and Advance Payments
- [x] Direct → Booking Fee collected before request creation
- [x] Inspection → Inspection Fee collected before request creation
- [x] Custom → No fee at creation
- [x] Advance Payment collected when quotation accepted (if amount > 0)

## Requirement 11: Provider Final Invoice Generation
- [x] Invoice fields: labour, material, additional charges, discount
- [x] Total = labour + material + additional - discount

## Requirement 12: Online and Cash Payment Settlement
- [x] Online payment → "paid_online" → "completed"
- [x] Provider marks "Paid by Cash" → "paid_cash" → "completed"

## Requirement 13: Refund Handling
- [x] Auto-cancel/rejection → refund booking fee if customer chooses
- [x] Cancel before quotation → refund inspection fee
- [x] Category-specific cancellation policies

## Requirement 14: Rating, Review, and Feedback
- [x] One review per completed request (rating 1-5, text, feedback)

## Requirement 15: Real-Time Notifications and Timers
- [x] Status transitions → real-time events within 5 seconds
- [x] Countdown events for 30-min timer

## Requirement 16: Roles and Permissions
- [x] Customers create requests; Providers accept/invoice; Admins manage

## Requirement 17: Migration from Existing Data Model
- [x] "instant" → Direct, "visit_first" → Inspection_Required, "custom" → Custom
- [x] Idempotent migration, no data loss

## Requirement 18: Provider Schedule & Availability (Scheduled Services)
**User Story:** As a provider offering Direct services, I want to define my working hours, breaks, buffer times, and leave days so that customers can only book available time windows.

### Acceptance Criteria
- [x] Provider can set weekly working hours (e.g., Mon-Fri 9:00-18:00, Sat 9:00-14:00)
- [x] Provider can set lunch break time (e.g., 13:00-14:00)
- [x] Provider can set buffer time between appointments (e.g., 15 minutes)
- [x] Provider can mark specific dates as leave days (in advance for the month)
- [x] System computes available time windows from schedule minus breaks, buffer, leave, and existing bookings
- [x] Customer sees only available time windows when booking a Scheduled Request (no blind booking)
- [x] Once a customer books a time window, provider cannot take leave for that date unless they cancel/reject the booking
- [x] Provider must accept or reject a Scheduled Request (same as Instant but without the 30-min hard timer)
- [x] Leave management: provider can set leave in advance; if bookings exist for that date, provider must cancel them first
