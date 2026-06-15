import { PaginatedCategoryResponse } from "../../dto/category/category.dto";
import { ProviderListItemDto } from "../../dto/provider/provider.dto";

export interface HomeData {
  categories: PaginatedCategoryResponse;
  topProviders: ProviderListItemDto[];
}

export interface IHomeService {
  getHomeData(): Promise<HomeData>;
}
