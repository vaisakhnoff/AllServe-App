import { IProviderAccount } from "../models/providerAccount.model";
import {
  CategoryRefDto,
  ProviderListItemDto,
  ProviderDetailsDto,
  ProviderApplicationResponseDto,
  ProviderProfileResponseDto,
} from "../dto/provider/provider.dto";

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
