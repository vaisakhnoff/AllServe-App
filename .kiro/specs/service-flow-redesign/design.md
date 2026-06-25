# Design: Service Flow Redesign

## Overview

Restructure AllServe from a single slot-based booking flow into three distinct delivery models (Direct, Inspection_Required, Custom), each with its own request lifecycle, provider availability system, and payment flow. Replace the rigid slot system with a provider-defined schedule (working hours, breaks, buffer, leave) that dynamically computes available time windows.

---

## Architecture Decisions

### AD-1: Replace Slot Model with Provider Schedule Model
**Current:** Providers manually create individual `Slot` documents per day/time. Users pick a slot to book.
**New:** Providers define a recurring weekly schedule (working hours, lunch break, buffer time) plus leave days. The system computes available windows on-the-fly from schedule minus existing bookings.
**Rationale:** Eliminates the need for providers to manually create hundreds of slots. More flexible, real-world approach.

### AD-2: Unified Service Request Model
**Current:** Three separate models — `Booking` (instant), `ServiceRequest` (custom), no inspection model.
**New:** A single `ServiceOrder` model serves all three delivery models with a `deliveryModel` discriminator and `subMode` for Direct requests. Status enums are model-specific but stored in one collection.
**Rationale:** Simplifies querying (user's "my orders"), reporting, and prevents logic duplication. Status FSM varies by delivery model but the record shape is unified.

### AD-3: Provider Status as Separate Embedded Fields
**Current:** No provider online/offline or available/busy tracking.
**New:** Add `onlineStatus` ("online"/"offline") and `engagementStatus` ("available"/"busy") directly on `ProviderAccount`.
**Rationale:** Simple, queryable, no extra collection. Status changes are infrequent (toggle-level).

### AD-4: Quotation as a First-Class Model
**Current:** `ProviderQuote` is tightly coupled to `ServiceRequest` for the custom flow only.
**New:** Rename/evolve into `Quotation` model that serves both Inspection_Required and Custom flows. Supports revisions, itemised breakdown, advance amount, and modification requests.
**Rationale:** Both Inspection and Custom flows need structured quotations with revision history.

### AD-5: Invoice as a Separate Model
**Current:** No invoice model exists.
**New:** `Invoice` model with labour, material, additional charges, discount, total, payment status, settlement method.
**Rationale:** Required by requirements 11-12. Decouples invoice generation from order status.

---

## Data Models

### 1. ProviderAccount — New Fields

```typescript
// Added to existing IProviderAccount interface
onlineStatus: "online" | "offline";           // Provider-controlled visibility
engagementStatus: "available" | "busy";       // System-managed engagement
lastOnlineAt?: Date;
lastStatusChangeAt?: Date;
```

### 2. ProviderSchedule (New Model)

```typescript
interface IProviderSchedule {
  providerId: ObjectId;                        // ref ProviderAccount
  weeklyHours: {
    day: 0 | 1 | 2 | 3 | 4 | 5 | 6;         // 0=Sunday, 6=Saturday
    isWorkingDay: boolean;
    startTime: string;                         // "09:00"
    endTime: string;                           // "18:00"
    breakStart?: string;                       // "13:00"
    breakEnd?: string;                         // "14:00"
  }[];
  bufferMinutes: number;                       // Gap between appointments (default 15)
  defaultServiceDuration: number;              // Minutes, fallback if service has no duration
  advanceBookingDays: number;                  // How far ahead customers can book (default 30)
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. ProviderLeave (New Model)

```typescript
interface IProviderLeave {
  providerId: ObjectId;
  date: string;                                // "YYYY-MM-DD"
  reason?: string;
  isFullDay: boolean;
  startTime?: string;                          // For partial-day leave
  endTime?: string;
  hasBookings: boolean;                        // System-set: true if bookings exist on this date
  status: "active" | "cancelled";             // Provider can cancel leave
  createdAt: Date;
}
```

### 4. ServiceOrder (New Model — replaces Booking + ServiceRequest for new flow)

```typescript
type DeliveryModel = "direct" | "inspection_required" | "custom";
type DirectSubMode = "instant" | "scheduled";

type DirectStatus =
  | "awaiting_provider_response"
  | "accepted"
  | "rejected_by_provider"
  | "provider_unresponsive"
  | "awaiting_payment"
  | "completed"
  | "cancelled_with_refund"
  | "cancelled";

type InspectionStatus =
  | "inspection_pending"
  | "quotation_submitted"
  | "quotation_accepted"
  | "awaiting_advance"
  | "in_progress"
  | "awaiting_final_payment"
  | "completed"
  | "cancelled";

type CustomStatus =
  | "broadcast_open"
  | "receiving_quotations"
  | "quotation_accepted"
  | "awaiting_advance"
  | "in_progress"
  | "awaiting_final_payment"
  | "completed"
  | "expired"
  | "cancelled";

interface IServiceOrder {
  // ── Identity ──
  orderId: string;                             // Human-readable: "ORD-XXXXXX"
  customerId: ObjectId;                        // ref User
  providerId?: ObjectId;                       // ref ProviderAccount (set on creation for Direct/Inspection; set on quote acceptance for Custom)
  serviceId?: ObjectId;                        // ref Service (for Direct/Inspection)
  categoryId: ObjectId;                        // ref Category

  // ── Classification ──
  deliveryModel: DeliveryModel;
  subMode?: DirectSubMode;                     // Only for deliveryModel "direct"

  // ── Status ──
  status: DirectStatus | InspectionStatus | CustomStatus;
  statusHistory: { status: string; at: Date; note?: string; actor?: string }[];

  // ── Request Details ──
  title?: string;                              // Custom requests
  description: string;
  images: string[];
  
  // ── Location ──
  address: { street?: string; city: string; state: string; zip: string; country: string };
  exactLocation?: { type: "Point"; coordinates: [number, number] };

  // ── Scheduling (Direct Scheduled only) ──
  preferredDate?: string;                      // "YYYY-MM-DD"
  preferredTime?: string;                      // "HH:mm"

  // ── Timer (Instant only) ──
  responseDeadline?: Date;                     // createdAt + 30min
  respondedAt?: Date;

  // ── Financial ──
  platformFee: number;                         // Booking fee or Inspection fee
  platformFeeStatus: "pending" | "paid" | "refunded";
  
  // ── Custom-specific ──
  budget?: number;
  budgetType?: "fixed" | "flexible" | "quote_needed";
  quoteCount: number;
  selectedQuotationId?: ObjectId;

  // ── Linked Records ──
  invoiceId?: ObjectId;                        // ref Invoice
  reviewId?: ObjectId;                         // ref Review
  
  // ── Expiry ──
  expiresAt?: Date;                            // For Custom requests (7 days)

  // ── Customer Choice (post-rejection/timeout) ──
  customerChoice?: "reroute" | "refund";
  reroutedFromOrderId?: ObjectId;              // If this order was created via reroute

  createdAt: Date;
  updatedAt: Date;
}
```

### 5. Quotation (Evolved from ProviderQuote)

```typescript
type QuotationStatus = "submitted" | "accepted" | "rejected" | "modification_requested" | "withdrawn" | "rejected_by_selection";

interface IQuotationRevision {
  revisionNumber: number;
  labourCharge: number;
  materialCost: number;
  additionalCharges: number;
  estimatedDurationDays: number;
  advanceRequired: boolean;
  advanceAmount: number;
  notes?: string;
  termsAndConditions?: string;
  attachments: string[];
  submittedAt: Date;
}

interface IQuotation {
  orderId: ObjectId;                           // ref ServiceOrder
  providerId: ObjectId;                        // ref ProviderAccount
  status: QuotationStatus;
  currentRevision: IQuotationRevision;
  revisionHistory: IQuotationRevision[];
  modificationComment?: string;                // Customer's modification request text
  totalAmount: number;                         // Computed: labour + material + additional
  createdAt: Date;
  updatedAt: Date;
}
```

### 6. Invoice (New Model)

```typescript
type InvoicePaymentStatus = "pending" | "paid_online" | "paid_cash";

interface IInvoice {
  orderId: ObjectId;                           // ref ServiceOrder
  providerId: ObjectId;
  customerId: ObjectId;
  labourCharge: number;
  materialCost: number;
  additionalCharges: number;
  discount: number;
  total: number;                               // labour + material + additional - discount
  lineItemNotes?: {
    labour?: string;
    material?: string;
    additional?: string;
    discount?: string;
  };
  overallRemark?: string;
  paymentStatus: InvoicePaymentStatus;
  settledAt?: Date;
  settledBy?: "customer" | "provider";         // Who triggered settlement
  settlementMethod?: "online" | "cash";
  platformCommission: number;                  // Computed from category rate
  createdAt: Date;
  updatedAt: Date;
}
```

### 7. Service Model — Field Rename

```typescript
// Change serviceType enum values:
// "instant" → "direct"
// "visit_first" → "inspection_required"
// "custom" → "custom" (unchanged)
deliveryModel: "direct" | "inspection_required" | "custom";
```

---

## API Design

### Provider Schedule APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/provider/schedule` | Get provider's current schedule |
| PUT | `/provider/schedule` | Set/update weekly schedule |
| GET | `/provider/leave` | List leave days |
| POST | `/provider/leave` | Add leave day(s) |
| DELETE | `/provider/leave/:date` | Cancel a leave day |
| GET | `/provider/:id/available-windows?date=&serviceId=` | Compute available time windows for a date |

### Provider Status APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/provider/status/online` | Toggle online/offline |
| GET | `/provider/status` | Get current online + engagement status |

### Service Order APIs (Direct)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders/direct/instant` | Create instant request |
| POST | `/orders/direct/scheduled` | Create scheduled request |
| PATCH | `/orders/:id/accept` | Provider accepts |
| PATCH | `/orders/:id/reject` | Provider rejects |
| PATCH | `/orders/:id/customer-choice` | Customer selects reroute or refund |

### Service Order APIs (Inspection)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders/inspection` | Create inspection request |

### Service Order APIs (Custom)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders/custom` | Create custom/broadcast request |

### Quotation APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/quotations` | Provider submits quotation |
| PATCH | `/quotations/:id/accept` | Customer accepts |
| PATCH | `/quotations/:id/reject` | Customer rejects |
| PATCH | `/quotations/:id/request-modification` | Customer requests changes |
| PUT | `/quotations/:id/revise` | Provider re-submits revised quotation |

### Invoice APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/invoices` | Provider generates invoice for an order |
| PATCH | `/invoices/:id/pay-online` | Customer pays online |
| PATCH | `/invoices/:id/mark-cash` | Provider marks as paid by cash |

### Shared Order APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | List orders (customer or provider, filtered) |
| GET | `/orders/:id` | Get order detail |
| PATCH | `/orders/:id/cancel` | Cancel an order |

---

## Available Window Computation Logic

```
function getAvailableWindows(providerId, date, serviceDuration):
  1. Load ProviderSchedule for providerId
  2. Find the weeklyHours entry for the day-of-week of `date`
  3. If !isWorkingDay → return []
  4. Check ProviderLeave for this date → if full-day leave, return []
  5. Generate time blocks from startTime to endTime:
     - Exclude breakStart→breakEnd
     - Exclude partial leave startTime→endTime (if applicable)
  6. Load existing ServiceOrders for this provider on this date with status in ["accepted", "in_progress"]
     - Each occupies preferredTime → preferredTime + service.duration + buffer
  7. Subtract occupied blocks from available blocks
  8. Split remaining blocks into windows of size serviceDuration
  9. Return available windows as [{startTime, endTime}]
```

---

## Status Flow Diagrams

### Direct (Instant)
```
created → awaiting_provider_response → [accept] → accepted → [invoice] → awaiting_payment → [pay] → completed
                                     → [reject] → rejected_by_provider → [customer choice]
                                     → [30min timeout] → provider_unresponsive → [customer choice]
```

### Direct (Scheduled)
```
created → awaiting_provider_response → [accept] → accepted → [invoice] → awaiting_payment → [pay] → completed
                                     → [reject] → rejected_by_provider → [customer choice]
```

### Inspection Required
```
created → inspection_pending → [quotation uploaded] → quotation_submitted → [accept] → quotation_accepted
  → [advance if needed] → awaiting_advance → [paid] → in_progress → [invoice] → awaiting_final_payment → [pay] → completed
```

### Custom
```
created → broadcast_open → [quotes arrive] → receiving_quotations → [accept one] → quotation_accepted
  → [advance if needed] → awaiting_advance → [paid] → in_progress → [invoice] → awaiting_final_payment → [pay] → completed
  → [7 days, no acceptance] → expired
```

---

## Migration Strategy

1. Rename `serviceType` field to `deliveryModel` on Service model: `instant→direct`, `visit_first→inspection_required`, `custom→custom`
2. Map existing `Booking` records → `ServiceOrder` with `deliveryModel: "direct"`, `subMode: "scheduled"`
3. Map existing `ServiceRequest` with `budgetType: "quote_needed"` → `ServiceOrder` with `deliveryModel: "custom"`
4. Map existing `ProviderQuote` → `Quotation` (linked to migrated custom orders)
5. Keep old models read-only for historical access during transition period
6. Run as idempotent script with summary report

---

## Scope Boundaries (This Implementation)

**In scope (service flow only):**
- ProviderSchedule, ProviderLeave models + APIs
- Provider online/offline + available/busy status
- ServiceOrder model + APIs for all 3 delivery models
- Quotation model + APIs
- Invoice model + APIs
- Service model rename (serviceType → deliveryModel)
- Available window computation
- 30-minute timer logic (cron or TTL-based)
- Customer choice flow (reroute / refund)

**Out of scope (future work):**
- Payment gateway integration (Payment_Module)
- Push notification delivery (Notification_Module)
- Review/rating system (Review_Module)
- Real-time WebSocket events
- Frontend UI implementation
- Data migration script execution
