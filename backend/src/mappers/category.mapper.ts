import { ICategory } from "../models/category.model";
import { CategoryResponseDto } from "../dto/category/category.dto";

export const mapCategory = (category: ICategory): CategoryResponseDto => ({
  _id: category._id,
  name: category.name,
  description: category.description,
  icon: category.icon,
  subcategories: category.subcategories ?? [],
});
