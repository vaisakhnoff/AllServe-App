import { IService } from "../models/service.model";

// Handles both raw ObjectId refs and populated document refs
type PopulatedRef = {
  _id?: unknown;
  name?: string;
  email?: string;
  phone?: string;
  businessName?: string;
  icon?: string;
  headshot?: string;
  rating?: number;
};

export const mapService = (service: IService) => {
  const providerId = service.providerId as unknown as PopulatedRef | string;
  const categoryId = service.categoryId as unknown as PopulatedRef | string;

  return {
    id: service._id,
    providerId:
      providerId && typeof providerId === "object"
        ? {
            id: (providerId as PopulatedRef)._id,
            name: (providerId as PopulatedRef).name,
            email: (providerId as PopulatedRef).email,
            phone: (providerId as PopulatedRef).phone,
            businessName: (providerId as PopulatedRef).businessName,
          }
        : providerId,
    category:
      categoryId && typeof categoryId === "object"
        ? { id: (categoryId as PopulatedRef)._id, name: (categoryId as PopulatedRef).name, icon: (categoryId as PopulatedRef).icon }
        : categoryId
        ? { id: categoryId }
        : null,
    name: service.name,
    description: service.description,
    price: service.price,
    duration: service.duration,
    images: service.images ?? [],
    serviceArea: service.serviceArea ?? null,
    location: service.location ?? null,
    availabilityStatus: service.availabilityStatus,
    tags: service.tags ?? [],
    subCategory: service.subCategory ?? null,
    status: service.status,
    isBlocked: service.isBlocked ?? false,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
};
