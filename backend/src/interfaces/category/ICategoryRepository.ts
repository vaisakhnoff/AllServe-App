import { ICategory } from "../../models/category.model";
import { CategoryDto } from "../../dto/category/category.dto";

export interface ICategoryRepository {
  create(data: CategoryDto): Promise<ICategory>;
  findAll(filter?: Record<string, unknown>): Promise<ICategory[]>;
  update(id: string, data: CategoryDto): Promise<ICategory | null>;
  deleteCategory(id: string): Promise<ICategory | null>;
}