import { Request, Response, NextFunction } from "express";
import { ICategoryService } from "../../interfaces/category/ICategoryService";
import { categoryQuerySchema, categorySchema } from "../../dto/category/category.dto";
import { sendSuccess } from "../../shared/utils/response";
import { Messages } from "../../shared/constants/messages";
import { StatusCodes } from "../../shared/constants/statusCodes";

export class CategoryController {
  constructor(private readonly service: ICategoryService) { }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = categorySchema.parse(req.body);
      const data = await this.service.createCategory(dto);
      sendSuccess(res, data, Messages.CATEGORY_CREATED, StatusCodes.CREATED);
    } catch (err) {
      next(err);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = categoryQuerySchema.parse(req.query);
      const data = await this.service.getCategories(query);
      sendSuccess(res, data, Messages.CATEGORIES_FETCHED);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = categorySchema.parse(req.body);
      const data = await this.service.updateCategory(req.params.id as string, dto);
      sendSuccess(res, data, Messages.CATEGORY_UPDATED);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await this.service.deleteCategory(req.params.id as string);
      sendSuccess(res, null, Messages.CATEGORY_DELETED);
    } catch (err) {
      next(err);
    }
  }
}
