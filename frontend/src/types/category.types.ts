export interface Subcategory {
  name: string;
  image?: string;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
  icon?: string;
  subcategories?: Subcategory[];
  createdAt: string;
}

export interface CategoryDto {
  name: string;
  description?: string;
  icon?: string;
  subcategories?: Subcategory[];
}
