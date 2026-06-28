// ── Delivery Model & Sub-Mode ─────────────────────────────────────────────────
export type OrderDeliveryModel = "direct" | "inspection_required" | "custom";
export type DirectSubMode = "instant" | "scheduled";

// ── Status Enums ──────────────────────────────────────────────────────────────
export type DirectStatus =
  | "awaiting_provider_response"
  | "accepted"
  | "in_progress"
  | "work_completed"
  | "rejected_by_provider"
  | "provider_unresponsive"
  | "awaiting_payment"
  | "completed"
  | "cancelled_with_refund"
  | "cancelled";


export type InspectionStatus =
  | "awaiting_provider_response"
  | "inspection_accepted"
  | "inspection_completed"
  | "quotation_submitted"
  | "quotation_accepted"
  | "dropped_by_provider"
  | "dropped_by_customer"
  | "in_progress"
  | "work_completed"
  | "awaiting_payment"
  | "completed"
  | "cancelled";

export type CustomStatus =
  | "broadcast_open"
  | "receiving_quotations"
  | "quotation_accepted"
  | "awaiting_advance"
  | "in_progress"
  | "awaiting_final_payment"
  | "completed"
  | "expired"
  | "cancelled";

export type ServiceOrderStatus = DirectStatus | InspectionStatus | CustomStatus;

export type PlatformFeeStatus = "pending" | "paid" | "refunded";
export type CustomerChoice = "reroute" | "refund";

// ── Address ───────────────────────────────────────────────────────────────────
export interface OrderAddress {
  street?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

// ── Status History ────────────────────────────────────────────────────────────
export interface StatusHistoryEntry {
  status: string;
  at: string;
  note?: string;
  actor?: string;
}

// ── Provider Ref ──────────────────────────────────────────────────────────────
export interface OrderProviderRef {
  _id: string;
  name: string;
  businessName?: string;
  email?: string;
  phone?: string;
}

// ── Customer Ref ──────────────────────────────────────────────────────────────
export interface OrderCustomerRef {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
}

// ── Service Ref ───────────────────────────────────────────────────────────────
export interface OrderServiceRef {
  _id: string;
  name: string;
  price?: number;
  duration?: number;
  deliveryModel?: string;
}

// ── Category Ref ──────────────────────────────────────────────────────────────
export interface OrderCategoryRef {
  _id: string;
  name: string;
  icon?: string;
}

// ── Main ServiceOrder Type ────────────────────────────────────────────────────
export interface ServiceOrder {
  _id: string;
  orderId: string;
  customerId: string | OrderCustomerRef;
  providerId?: string | OrderProviderRef;
  serviceId?: string | OrderServiceRef;
  categoryId: string | OrderCategoryRef;

  deliveryModel: OrderDeliveryModel;
  subMode?: DirectSubMode;

  status: ServiceOrderStatus;
  statusHistory: StatusHistoryEntry[];

  title?: string;
  description: string;
  images: string[];

  address: OrderAddress;
  exactLocation?: { type: "Point"; coordinates: [number, number] };

  preferredDate?: string;
  preferredTime?: string;

  responseDeadline?: string;
  respondedAt?: string;

  platformFee: number;
  platformFeeStatus: PlatformFeeStatus;

  budget?: number;
  budgetType?: "fixed" | "flexible" | "quote_needed";
  quoteCount: number;
  selectedQuotationId?: string;

  invoiceId?: string;
  reviewId?: string;

  expiresAt?: string;

  customerChoice?: CustomerChoice;
  reroutedFromOrderId?: string;

  createdAt: string;
  updatedAt: string;
}

// ── Quotation Types ───────────────────────────────────────────────────────────
export type QuotationStatus =
  | "submitted"
  | "accepted"
  | "rejected"
  | "modification_requested"
  | "withdrawn"
  | "rejected_by_selection";

export interface QuotationRevision {
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
  submittedAt: string;
}

export interface Quotation {
  _id: string;
  orderId: string;
  providerId: string | OrderProviderRef;
  status: QuotationStatus;
  currentRevision: QuotationRevision;
  revisionHistory: QuotationRevision[];
  modificationComment?: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

// ── Invoice Types ─────────────────────────────────────────────────────────────
export type InvoicePaymentStatus = "pending" | "paid_online" | "paid_cash";

export interface LineItemNotes {
  labour?: string;
  material?: string;
  additional?: string;
  discount?: string;
}

export interface Invoice {
  _id: string;
  orderId: string;
  providerId: string | OrderProviderRef;
  customerId: string | OrderCustomerRef;
  labourCharge: number;
  materialCost: number;
  additionalCharges: number;
  discount: number;
  total: number;
  lineItemNotes?: LineItemNotes;
  overallRemark?: string;
  paymentStatus: InvoicePaymentStatus;
  settledAt?: string;
  settledBy?: "customer" | "provider";
  settlementMethod?: "online" | "cash";
  platformCommission: number;
  createdAt: string;
  updatedAt: string;
}

// ── DTOs for API Calls ────────────────────────────────────────────────────────
export interface CreateDirectInstantDto {
  serviceId: string;
  providerId: string;
  description: string;
  address: OrderAddress;
  exactLocation?: { type: "Point"; coordinates: [number, number] };
  images?: string[];
}

export interface CreateDirectScheduledDto {
  serviceId: string;
  providerId: string;
  description: string;
  preferredDate: string;
  preferredTime: string;
  address: OrderAddress;
  exactLocation?: { type: "Point"; coordinates: [number, number] };
  images?: string[];
}

export interface CreateInspectionRequestDto {
  serviceId: string;
  providerId: string;
  description: string;
  address: OrderAddress;
  exactLocation?: { type: "Point"; coordinates: [number, number] };
  images?: string[];
}

export interface CreateCustomRequestDto {
  categoryId: string;
  providerId?: string;
  serviceId?: string;
  title: string;
  description: string;
  budget?: number;
  budgetType?: "fixed" | "flexible" | "quote_needed";
  address: OrderAddress;
  exactLocation?: { type: "Point"; coordinates: [number, number] };
  images?: string[];
}

export interface CustomerChoiceDto {
  choice: "reroute" | "refund";
  newProviderId?: string;
}

export interface CreateQuotationDto {
  orderId: string;
  labourCharge: number;
  materialCost?: number;
  additionalCharges?: number;
  estimatedDurationDays: number;
  advanceRequired?: boolean;
  advanceAmount?: number;
  notes?: string;
  termsAndConditions?: string;
  attachments?: string[];
}

export interface ReviseQuotationDto {
  labourCharge: number;
  materialCost?: number;
  additionalCharges?: number;
  estimatedDurationDays: number;
  advanceRequired?: boolean;
  advanceAmount?: number;
  notes?: string;
  termsAndConditions?: string;
  attachments?: string[];
}

export interface CreateInvoiceDto {
  orderId: string;
  labourCharge: number;
  materialCost?: number;
  additionalCharges?: number;
  discount?: number;
  lineItemNotes?: LineItemNotes;
  overallRemark?: string;
}

// ── Query Types ───────────────────────────────────────────────────────────────
export interface OrderListQuery {
  deliveryModel?: OrderDeliveryModel;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedOrders {
  items: ServiceOrder[];
  total: number;
  page: number;
  limit: number;
}
