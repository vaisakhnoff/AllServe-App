import { ICategoryRepository } from "../interfaces/category/ICategoryRepository";
import { ICategoryService } from "../interfaces/category/ICategoryService";
import { CategoryDto, CategoryQuery, PaginatedCategoryResponse } from "../dto/category/category.dto";
import { escapeRegex } from "../shared/utils/search";
import { Messages } from "../shared/constants/messages";
import { mapCategory } from "../mappers/category.mapper";
import { NotFoundError, ConflictError } from "../shared/errors/HttpErrors";

export class CategoryService implements ICategoryService {
  constructor(private readonly repo: ICategoryRepository) {}

  async createCategory(data: CategoryDto) {
    const existing = await this.repo.findAll({
      name: { $regex: `^${escapeRegex(data.name)}$`, $options: "i" },
    });
    if (existing.length > 0) {
      throw new ConflictError(`Category "${data.name}" already exists`);
    }
    return this.repo.create(data);
  }

  async getCategories(query: CategoryQuery = { page: 1, limit: 20 }): Promise<PaginatedCategoryResponse> {
    const filter = query.search
      ? { name: { $regex: escapeRegex(query.search), $options: "i" } }
      : {};
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (this.repo as any).findWithPagination(filter, page, limit);
    
    return {
      items: result.items.map(mapCategory),
      total: result.total,
      page,
      limit,
    };
  }

  async updateCategory(id: string, data: CategoryDto) {
    const existing = await this.repo.findAll({
      name: { $regex: `^${escapeRegex(data.name)}$`, $options: "i" },
    });
    const duplicate = existing.find((c) => String(c._id) !== id);
    if (duplicate) {
      throw new ConflictError(`Category "${data.name}" already exists`);
    }
    const updated = await this.repo.update(id, data);
    if (!updated) throw new NotFoundError(Messages.CATEGORY_NOT_FOUND);
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    const deleted = await this.repo.deleteCategory(id);
    if (!deleted) throw new NotFoundError(Messages.CATEGORY_NOT_FOUND);
  }
}
