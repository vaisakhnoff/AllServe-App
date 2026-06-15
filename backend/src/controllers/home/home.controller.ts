import { Request, Response, NextFunction } from "express";
import { IHomeService } from "../../interfaces/home/IHomeService";
import { sendSuccess } from "../../shared/utils/response";

export class HomeController {
  constructor(private readonly service: IHomeService) {}

  async getHome(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.service.getHomeData();
      sendSuccess(res, data, "Home data fetched successfully");
    } catch (err) {
      next(err);
    }
  }
}
