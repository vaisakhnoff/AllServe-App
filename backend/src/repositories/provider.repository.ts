import { Types } from "mongoose";
import { BaseRepository } from "./base.repository";
import { IProviderRepository } from "../interfaces/provider/IProviderRepository";
import { ProviderAccountModel, IProviderAccount } from "../models/providerAccount.model";
import { ApplicationStatus } from "../shared/enums/application-status.enum";
import { escapeRegex } from "../shared/utils/search";

export class ProviderRepository
  extends BaseRepository<IProviderAccount>
  implements IProviderRepository
{
  constructor() {
    super(ProviderAccountModel);
  }

  // Override findById to include populated category
  async findById(id: string): Promise<IProviderAccount | null> {
    return this.model.findById(id).populate("categoryId", "name icon").exec();
  }

  async updateAccount(
    id: string,
    data: Partial<IProviderAccount>
  ): Promise<IProviderAccount | null> {
    return this.model
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .populate("categoryId", "name icon")
      .exec();
  }

  async findApprovedProviders(
    filter: Partial<Record<string, unknown>> = {},
    limit?: number
  ): Promise<IProviderAccount[]> {
    const query = this.model
      .find({ ...filter, applicationStatus: ApplicationStatus.APPROVED })
      .populate("categoryId", "name icon")
      .sort({ rating: -1, createdAt: -1 });
    if (limit) query.limit(limit);
    return query.lean() as Promise<IProviderAccount[]>;
  }

  async findApprovedProviderById(id: string): Promise<IProviderAccount | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model
      .findOne({ _id: id, applicationStatus: ApplicationStatus.APPROVED })
      .populate("categoryId", "name icon")
      .lean() as Promise<IProviderAccount | null>;
  }

  async findNearbyProviders(
    lng: number,
    lat: number,
    maxDistanceMeters: number,
    categoryId?: string,
    search?: string,
    limit?: number
  ): Promise<IProviderAccount[]> {
    const filter: Record<string, unknown> = {
      applicationStatus: ApplicationStatus.APPROVED,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: maxDistanceMeters,
        },
      },
    };

    if (categoryId && Types.ObjectId.isValid(categoryId)) {
      filter.categoryId = new Types.ObjectId(categoryId);
    }

    if (search) {
      const searchRegex = { $regex: escapeRegex(search), $options: "i" };
      filter.$or = [
        { name: searchRegex },
        { businessName: searchRegex },
        { "services.name": searchRegex },
        { city: searchRegex },
        { district: searchRegex },
        { state: searchRegex },
        { pincode: searchRegex },
        { fullAddress: searchRegex },
        { serviceArea: searchRegex },
        { serviceAreas: searchRegex },
      ];
    }

    return this.model
      .find(filter)
      .populate("categoryId", "name icon")
      .limit(limit ?? 50)
      .lean() as Promise<IProviderAccount[]>;
  }

  async getLocationSuggestions(q: string, limit = 10): Promise<string[]> {
    const regex = new RegExp("^" + escapeRegex(q), "i");
    const approved = { applicationStatus: ApplicationStatus.APPROVED };

    const [cities, districts, states, pincodes] = await Promise.all([
      this.model.distinct("city", { ...approved, city: regex }),
      this.model.distinct("district", { ...approved, district: regex }),
      this.model.distinct("state", { ...approved, state: regex }),
      this.model.distinct("pincode", { ...approved, pincode: regex }),
    ]);

    return [...new Set([...cities, ...districts, ...states, ...pincodes])]
      .filter(Boolean)
      .slice(0, limit) as string[];
  }
}
