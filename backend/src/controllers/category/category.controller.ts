import { Request, Response, NextFunction } from "express";
import { ICategoryService } from "../../interfaces/category/ICategoryService";
import { categoryQuerySchema, categorySchema } from "../../dto/category/category.dto";
import { sendSuccess } from "../../shared/utils/response";

export class CategoryController {
  constructor(private readonly service: ICategoryService) {}

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = categorySchema.parse(req.body);
      const data = await this.service.createCategory(dto);
      sendSuccess(res, data, "Category created successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = categoryQuerySchema.parse(req.query);
      const data = await this.service.getCategories(query);
      sendSuccess(res, data, "Categories fetched successfully");
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = categorySchema.parse(req.body);
      const data = await this.service.updateCategory(req.params.id as string, dto);
      sendSuccess(res, data, "Category updated successfully");
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await this.service.deleteCategory(req.params.id as string);
      sendSuccess(res, null, "Category deleted successfully");
    } catch (err) {
      next(err);
    }
  }
}
