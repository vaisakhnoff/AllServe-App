# Tasks: Service Flow Redesign

## Task 1: Provider Status Fields (Online/Offline + Available/Busy)
- [x] Add `onlineStatus: "online" | "offline"` field to `ProviderAccount` model (default "offline")
- [x] Add `engagementStatus: "available" | "busy"` field to `ProviderAccount` model (default "available")
- [x] Add `lastOnlineAt` and `lastStatusChangeAt` Date fields
- [x] Create provider status DTO (`toggleOnlineSchema`, `statusResponseSchema`)
- [x] Create `IProviderStatusService` interface with `toggleOnline()`, `getStatus()`, `setBusy()`, `setAvailable()`
- [x] Implement `ProviderStatusService`
- [x] Create provider status controller with `PATCH /provider-status/online` and `GET /provider-status`
- [x] Register route in provider router
- [ ] Update frontend `provider.types.ts` with new status fields

## Task 2: Provider Schedule Model & APIs
- [x] Create `ProviderSchedule` model (`backend/src/models/providerSchedule.model.ts`)
- [x] Fields: `providerId`, `weeklyHours[]` (day, isWorkingDay, startTime, endTime, breakStart, breakEnd), `bufferMinutes`, `defaultServiceDuration`, `advanceBookingDays`
- [x] Create schedule DTO with Zod validation (`backend/src/dto/provider-schedule/providerSchedule.dto.ts`)
- [x] Create `IProviderScheduleRepository` interface
- [x] Create `ProviderScheduleRepository` implementation
- [x] Create `IProviderScheduleService` interface
- [x] Implement `ProviderScheduleService` with `getSchedule()`, `upsertSchedule()`
- [x] Create `ProviderScheduleController` with `GET /provider-schedule` and `PUT /provider-schedule`
- [x] Register in DI container and provider router

## Task 3: Provider Leave Model & APIs
- [x] Create `ProviderLeave` model (`backend/src/models/providerLeave.model.ts`)
- [x] Fields: `providerId`, `date`, `reason`, `isFullDay`, `startTime`, `endTime`, `hasBookings`, `status`
- [x] Create leave DTO with Zod validation
- [x] Create `IProviderLeaveRepository` interface and implementation
- [x] Create `IProviderLeaveService` interface
- [x] Implement `ProviderLeaveService` with `addLeave()`, `cancelLeave()`, `getLeaves()`, `checkConflicts()`
- [x] Create `ProviderLeaveController` with `GET /provider-leave`, `POST /provider-leave`, `DELETE /provider-leave/:date`
- [x] Register in DI container and provider router

## Task 4: Available Window Computation Service
- [x] Create `IAvailabilityService` interface with `getAvailableWindows(providerId, date, serviceDuration)`
- [x] Implement `AvailabilityService`:
  - Load provider schedule for given day-of-week
  - Check if it's a working day
  - Check leave for the date
  - Generate time blocks (exclude breaks, partial leaves)
  - Load existing accepted/in-progress orders for that provider+date
  - Subtract occupied windows (preferredTime + duration + buffer)
  - Return available `[{startTime, endTime}]` windows
- [x] Create public endpoint `GET /provider-schedule/:id/available-windows?date=YYYY-MM-DD&serviceId=xxx`
- [x] Create DTO for query params and response shape
- [x] Register in DI and router

## Task 5: Service Model — Rename serviceType to deliveryModel
- [x] Rename `serviceType` field to `deliveryModel` in `Service` model
- [x] Change enum values: `"instant"→"direct"`, `"visit_first"→"inspection_required"`, `"custom"→"custom"`
- [x] Update `service.dto.ts` (both create and update schemas)
- [x] Update `service.mapper.ts`
- [x] Update `frontend/src/types/service.types.ts` — `ServiceType` → `DeliveryModel`
- [x] Update `ServiceFormModal.tsx` dropdown options
- [x] Update `publicServiceQuerySchema` filter
- [x] Update `Category` model's `defaultServiceType` → `defaultDeliveryModel`
- [x] Update all references across controllers, services, repositories

## Task 6: ServiceOrder Model (Unified Order)
- [x] Create `ServiceOrder` model (`backend/src/models/serviceOrder.model.ts`)
- [x] Define all status enums per delivery model (DirectStatus, InspectionStatus, CustomStatus)
- [x] Fields: orderId, customerId, providerId, serviceId, categoryId, deliveryModel, subMode, status, statusHistory, description, images, address, exactLocation, preferredDate, preferredTime, responseDeadline, respondedAt, platformFee, platformFeeStatus, budget, budgetType, quoteCount, selectedQuotationId, invoiceId, reviewId, expiresAt, customerChoice, reroutedFromOrderId
- [x] Add indexes: customerId+status, providerId+status, deliveryModel+status, expiresAt (TTL-like), responseDeadline
- [x] Create DTOs for each creation endpoint (createDirectInstantSchema, createDirectScheduledSchema, createInspectionSchema, createCustomSchema)

## Task 7: Direct Request Service (Instant + Scheduled)
- [x] Create `IDirectRequestService` interface
- [x] Implement `DirectRequestService`:
  - `createInstantRequest(customerId, dto)`: validate provider online+available, create order with 30-min deadline
  - `createScheduledRequest(customerId, dto)`: validate preferred time is in available window, create order
  - `acceptRequest(orderId, providerId)`: transition to "accepted", set provider busy (instant only)
  - `rejectRequest(orderId, providerId)`: transition to "rejected_by_provider", trigger customer choice
  - `handleCustomerChoice(orderId, choice, newProviderId?)`: reroute or refund
- [x] Create `DirectRequestController` with endpoints:
  - `POST /orders/direct/instant`
  - `POST /orders/direct/scheduled`
  - `PATCH /orders/:id/accept`
  - `PATCH /orders/:id/reject`
  - `PATCH /orders/:id/customer-choice`
- [x] Register in DI and router

## Task 8: 30-Minute Timer for Instant Requests
- [x] Implement timer check mechanism (options: cron job every minute, or MongoDB TTL index + change stream)
- [x] On timeout: transition order to "provider_unresponsive", trigger customer choice flow
- [x] Store `responseDeadline` on order creation
- [x] Create a scheduled job or service that checks expired deadlines
- [x] Ensure timer is halted (field cleared or ignored) when provider responds

## Task 9: Inspection Request Service
- [x] Create `IInspectionRequestService` interface
- [x] Implement `InspectionRequestService`:
  - `createRequest(customerId, dto)`: create order with status "inspection_pending"
  - Status transitions managed by quotation acceptance and invoice generation
- [x] Create `InspectionRequestController` with `POST /orders/inspection`
- [x] Register in DI and router

## Task 10: Custom Request Service (Broadcast)
- [x] Create `ICustomRequestService` interface
- [x] Implement `CustomRequestService`:
  - `createRequest(customerId, dto)`: create order with status "broadcast_open", set 7-day expiry
  - `findCandidateProviders(categoryId, region)`: match providers by category + service area
  - Mark order as "receiving_quotations" when first quote arrives
- [x] Create `CustomRequestController` with `POST /orders/custom`
- [x] Implement expiry check (cron or TTL) to transition to "expired"
- [x] Register in DI and router

## Task 11: Quotation Model & Service
- [x] Create `Quotation` model (`backend/src/models/quotation.model.ts`)
- [x] Fields: orderId, providerId, status, currentRevision (labour, material, additional, duration, advance, notes, terms, attachments), revisionHistory[], modificationComment, totalAmount
- [x] Create Quotation DTOs (createQuotationSchema, reviseQuotationSchema, modificationRequestSchema)
- [x] Create `IQuotationRepository` interface and implementation
- [x] Create `IQuotationService` interface
- [x] Implement `QuotationService`:
  - `submit(providerId, dto)`: create quotation, increment order quoteCount
  - `accept(quotationId, customerId)`: mark accepted, reject siblings, transition order
  - `reject(quotationId, customerId)`: mark rejected
  - `requestModification(quotationId, customerId, comment)`: mark modification_requested
  - `revise(quotationId, providerId, dto)`: add new revision, reset to submitted
- [x] Create `QuotationController` with all quotation endpoints
- [x] Register in DI and router

## Task 12: Invoice Model & Service
- [x] Create `Invoice` model (`backend/src/models/invoice.model.ts`)
- [x] Fields: orderId, providerId, customerId, labourCharge, materialCost, additionalCharges, discount, total, lineItemNotes, overallRemark, paymentStatus, settledAt, settledBy, settlementMethod, platformCommission
- [x] Create Invoice DTOs (createInvoiceSchema, markCashSchema)
- [x] Create `IInvoiceRepository` interface and implementation
- [x] Create `IInvoiceService` interface
- [x] Implement `InvoiceService`:
  - `generate(providerId, dto)`: validate order status, compute total, create invoice, transition order to awaiting_payment
  - `payOnline(invoiceId, customerId)`: mark paid_online, transition order to completed
  - `markCash(invoiceId, providerId)`: mark paid_cash, transition order to completed
- [x] Create `InvoiceController` with `POST /invoices`, `PATCH /invoices/:id/pay-online`, `PATCH /invoices/:id/mark-cash`
- [x] Register in DI and router

## Task 13: Shared Order Query APIs
- [x] Create order query DTOs (customerOrderQuerySchema, providerOrderQuerySchema, adminOrderQuerySchema)
- [x] Create `IServiceOrderRepository` interface with `findByCustomer()`, `findByProvider()`, `findAll()`, `findById()`
- [x] Implement `ServiceOrderRepository`
- [x] Create `ServiceOrderController` with `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id/cancel`
- [x] Implement cancel logic per delivery model (refund rules differ)
- [x] Register in DI and router

## Task 14: DI Container & Route Registration
- [x] Update `di.ts` to register all new services and repositories
- [x] Create new route files or update existing:
  - `/routes/service-order/serviceOrder.routes.ts`
  - `/routes/quotation/quotation.routes.ts`
  - `/routes/invoice/invoice.routes.ts`
- [x] Mount all new routes in `app.ts`
- [x] Ensure auth middleware is applied correctly per role

## Task 15: Frontend Types Update
- [ ] Update `frontend/src/types/service.types.ts` with new `DeliveryModel` type
- [ ] Create `frontend/src/types/order.types.ts` with ServiceOrder, Quotation, Invoice types
- [ ] Create `frontend/src/types/providerSchedule.types.ts`
- [ ] Update any components referencing old `ServiceType`
