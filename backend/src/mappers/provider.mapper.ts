import { IProviderAccount } from "../models/providerAccount.model";
import {
  CategoryRefDto,
  ProviderListItemDto,
  ProviderDetailsDto,
  ProviderApplicationResponseDto,
  ProviderProfileResponseDto,
  ProviderApplicationDto,
  UpdateProviderProfileDto,
} from "../dto/provider/provider.dto";
import { geocodeAddress, reverseGeocode } from "../shared/utils/geocoding";

// ── Helpers ───────────────────────────────────────────────────────────────────

export const getStartingPrice = (services?: { price?: number }[]): number | null => {
  const prices = services?.map((s) => s.price).filter((p): p is number => typeof p === "number");
  if (!prices?.length) return null;
  return Math.min(...prices);
};

export const resolveCategory = (categoryId: IProviderAccount["categoryId"]): CategoryRefDto | null => {
  if (!categoryId) return null;
  if (typeof categoryId === "object" && "_id" in categoryId) {
    const c = categoryId as unknown as { _id: unknown; name?: string; icon?: string };
    return { id: c._id, name: c.name, icon: c.icon };
  }
  return { id: categoryId };
};

// ── Location resolver ─────────────────────────────────────────────────────────

export async function resolveLocation(data: ProviderApplicationDto | UpdateProviderProfileDto) {
  const fields: Record<string, unknown> = {};
  if (data.latitude && data.longitude) {
    fields.location = { type: "Point", coordinates: [data.longitude, data.latitude] };
    if (!data.state || !data.city) {
      const geo = await reverseGeocode(data.latitude, data.longitude);
      if (geo) {
        fields.state = data.state || geo.state;
        fields.district = data.district || geo.district;
        fields.city = data.city || geo.city;
        fields.pincode = data.pincode || geo.pincode;
        fields.fullAddress = data.fullAddress || geo.fullAddress;
      }
    }
    if (data.state) fields.state = data.state;
    if (data.district) fields.district = data.district;
    if (data.city) fields.city = data.city;
    if (data.pincode) fields.pincode = data.pincode;
    if (data.fullAddress) fields.fullAddress = data.fullAddress;
  } else if (data.pincode || data.city || data.fullAddress) {
    const query = data.fullAddress || data.pincode || data.city || "";
    const geo = await geocodeAddress(query);
    if (geo) {
      fields.location = { type: "Point", coordinates: [geo.longitude, geo.latitude] };
      fields.state = data.state || geo.state;
      fields.district = data.district || geo.district;
      fields.city = data.city || geo.city;
      fields.pincode = data.pincode || geo.pincode;
      fields.fullAddress = data.fullAddress || geo.fullAddress;
    }
  }
  if (data.serviceRadius) fields.serviceRadius = data.serviceRadius;
  return fields;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

export const mapProviderListItem = (provider: IProviderAccount): ProviderListItemDto => ({
  id: provider._id,
  name: (provider.businessName ?? provider.name) as string,
  rating: provider.rating ?? 0,
  price: getStartingPrice(provider.services),
  profileImage: provider.headshot ?? null,
});

export const mapProviderDetails = (provider: IProviderAccount): ProviderDetailsDto => ({
  ...mapProviderListItem(provider),
  businessName: provider.businessName,
  category: resolveCategory(provider.categoryId),
  description: provider.description,
  serviceAreas: provider.serviceAreas ?? [],
  onlineStatus: provider.onlineStatus ?? "offline",
  engagementStatus: provider.engagementStatus ?? "available",
  services: (provider.services ?? []).map((s) => ({
    id: (s as unknown as Record<string, unknown>)._id,
    name: s.name,
    price: s.price,
    description: s.description,
  })),
});

export const mapApplication = (account: IProviderAccount): ProviderApplicationResponseDto => ({
  id: account._id,
  fullName: account.name,
  email: account.email,
  phone: account.phone,
  category: resolveCategory(account.categoryId),
  experience: account.experience,
  address: account.address,
  serviceArea: account.serviceArea,
  description: account.description,
  documentType: account.documentType,
  headshot: account.headshot,
  documents: account.documents ?? [],
  status: account.applicationStatus,
  rejectionReason: account.rejectionReason ?? null,
});

export const mapProviderProfile = (account: IProviderAccount): ProviderProfileResponseDto => ({
  _id: account._id,
  name: account.name,
  email: account.email,
  phone: account.phone,
  applicationStatus: account.applicationStatus,
  headshot: account.headshot || "",
  businessName: account.businessName || account.name,
  categoryId: resolveCategory(account.categoryId),
  experience: account.experience || "",
  serviceAreas: account.serviceAreas || [],
  description: account.description || "",
  services: account.services || [],
  earnings: account.earnings || 0,
  rating: account.rating || 0,
});
