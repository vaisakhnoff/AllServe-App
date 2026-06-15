import { ICategory } from "../../models/category.model";
import { CategoryDto, CategoryQuery, PaginatedCategoryResponse } from "../../dto/category/category.dto";

export interface ICategoryService {
  createCategory(data: CategoryDto): Promise<ICategory>;
  getCategories(query?: CategoryQuery): Promise<PaginatedCategoryResponse>;
  updateCategory(id: string, data: CategoryDto): Promise<ICategory | null>;
  deleteCategory(id: string): Promise<void>;
}