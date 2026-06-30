import { ICategoryService } from "../../interfaces/category/ICategoryService";
import { IProviderService } from "../../interfaces/provider/IProviderService";
import { HomeData, IHomeService } from "../../interfaces/home/IHomeService";

export class HomeService implements IHomeService {
  constructor(
    private readonly categoryService: ICategoryService,
    private readonly providerService: IProviderService
  ) {}

  async getHomeData(): Promise<HomeData> {
    const [categories, topProviders] = await Promise.all([
      this.categoryService.getCategories(),
      this.providerService.getPublicProviders({}, 8),
    ]);
    return { categories, topProviders };
  }
}
