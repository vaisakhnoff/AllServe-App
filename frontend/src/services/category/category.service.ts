import api from "@/api";
import { API_ENDPOINTS } from "@/shared/routes";
import { ApiResponse } from "@/types/auth.types";
import { Category, CategoryDto } from "@/types/category.types";

export interface PaginatedCategoriesResponse {
  items: Category[];
  total: number;
  page: number;
  limit: number;
}

export const categoryService = {
  getAll: () =>
    api.get<ApiResponse<Category[]>>(API_ENDPOINTS.CATEGORIES),

  getWithPagination: (search?: string, page = 1, limit = 20) =>
    api.get<ApiResponse<PaginatedCategoriesResponse>>(API_ENDPOINTS.CATEGORIES, {
      params: { search, page, limit },
    }),

  create: (dto: CategoryDto) =>
    api.post<ApiResponse<Category>>(API_ENDPOINTS.CATEGORIES, dto),

  update: (id: string, dto: CategoryDto) =>
    api.put<ApiResponse<Category>>(API_ENDPOINTS.CATEGORY_BY_ID(id), dto),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(API_ENDPOINTS.CATEGORY_BY_ID(id)),
};
