import { BaseRepository } from "./base.repository";
import { ICategoryRepository } from "../interfaces/category/ICategoryRepository";
import { CategoryModel, ICategory } from "../models/category.model";
import { CategoryDto } from "../dto/category/category.dto";

export interface CategoryListResult {
  items: ICategory[];
  total: number;
}

export class CategoryRepository
  extends BaseRepository<ICategory>
  implements ICategoryRepository
{
  constructor() {
    super(CategoryModel);
  }

  async create(data: CategoryDto): Promise<ICategory> {
    return CategoryModel.create(data) as Promise<ICategory>;
  }

  async findAll(filter: Record<string, unknown> = {}): Promise<ICategory[]> {
    return this.model.find(filter).sort({ name: 1 }).exec();
  }

  async findWithPagination(
    filter: Record<string, unknown> = {},
    page = 1,
    limit = 20
  ): Promise<CategoryListResult> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ name: 1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter),
    ]);
    return { items, total };
  }

  async update(id: string, data: CategoryDto): Promise<ICategory | null> {
    return this.model.findByIdAndUpdate(id, data, { returnDocument: 'after' }).exec();
  }

  async deleteCategory(id: string): Promise<ICategory | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
