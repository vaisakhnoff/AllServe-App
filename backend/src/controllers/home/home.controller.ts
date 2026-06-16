import { Request, Response, NextFunction } from "express";
import { IHomeService } from "../../interfaces/home/IHomeService";
import { sendSuccess } from "../../shared/utils/response";
import { Messages } from "../../shared/constants/messages";

export class HomeController {
  constructor(private readonly service: IHomeService) { }

  async getHome(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.service.getHomeData();
      sendSuccess(res, data, Messages.HOME_DATA_FETCHED);
    } catch (err) {
      next(err);
    }
  }
}
