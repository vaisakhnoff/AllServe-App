export type ServiceRequestStatus = "open" | "receiving_quotes" | "quote_selected" | "booking_created" | "completed" | "cancelled" | "expired";
export type BudgetType = "fixed" | "flexible" | "quote_needed";
export type UrgencyLevel = "low" | "medium" | "high" | "urgent";
export type ProviderQuoteStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export interface ServiceRequest {
  _id: string;
  userId: { _id: string; name: string; email?: string; profileImage?: string };
  categoryId: { _id: string; name: string };
  subCategory: string;
  title: string;
  description: string;
  budgetType: BudgetType;
  budgetMin?: number;
  budgetMax?: number;
  preferredDate?: string;
  preferredTime?: string;
  address: { street: string; city: string; state: string; zip: string; country: string };
  location?: { type: "Point"; coordinates: [number, number] };
  images: string[];
  urgency: UrgencyLevel;
  status: ServiceRequestStatus;
  quoteCount: number;
  selectedQuoteId?: string;
  selectedProviderId?: { _id: string; name: string; businessName?: string; headshot?: string; rating?: number };
  bookingId?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderQuote {
  _id: string;
  serviceRequestId: string | { _id: string; title: string; status: string; budgetType: string; budgetMin?: number; budgetMax?: number; address: { city: string }; urgency: string };
  providerId: { _id: string; name: string; businessName?: string; headshot?: string; rating?: number; city?: string; district?: string };
  price: number;
  message: string;
  estimatedDuration: string;
  availabilityNote?: string;
  status: ProviderQuoteStatus;
  respondedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceRequestDto {
  categoryId: string;
  subCategory: string;
  title: string;
  description: string;
  budgetType: BudgetType;
  budgetMin?: number;
  budgetMax?: number;
  preferredDate?: string;
  preferredTime?: string;
  address: { street: string; city: string; state: string; zip: string; country?: string };
  location?: { type: "Point"; coordinates: [number, number] };
  images?: string[];
  urgency?: UrgencyLevel;
}

export interface CreateProviderQuoteDto {
  serviceRequestId: string;
  price: number;
  message: string;
  estimatedDuration: string;
  availabilityNote?: string;
}

export interface ServiceRequestListResponse {
  items: ServiceRequest[];
  total: number;
  page: number;
  limit: number;
}

export interface ProviderQuoteListResponse {
  items: ProviderQuote[];
  total: number;
  page: number;
  limit: number;
}
