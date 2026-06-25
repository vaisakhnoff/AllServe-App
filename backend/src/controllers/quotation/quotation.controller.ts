import { Response, NextFunction } from "express";
import { AuthRequest } from "../../shared/interfaces/AuthRequest";
import { sendSuccess } from "../../shared/utils/response";
import { StatusCodes } from "../../shared/constants/statusCodes";
import { IQuotationService } from "../../interfaces/quotation/IQuotationService";
import { createQuotationSchema, reviseQuotationSchema, modificationRequestSchema } from "../../dto/quotation/quotation.dto";

export class QuotationController {
  constructor(private readonly service: IQuotationService) {}

  async submit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = createQuotationSchema.parse(req.body);
      const data = await this.service.submit(req.user!.id, dto);
      sendSuccess(res, data, "Quotation submitted", StatusCodes.CREATED);
    } catch (err) { next(err); }
  }

  async accept(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.service.accept(req.params.id as string, req.user!.id);
      sendSuccess(res, data, "Quotation accepted");
    } catch (err) { next(err); }
  }

  async reject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.service.reject(req.params.id as string, req.user!.id);
      sendSuccess(res, data, "Quotation rejected");
    } catch (err) { next(err); }
  }

  async requestModification(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = modificationRequestSchema.parse(req.body);
      const data = await this.service.requestModification(req.params.id as string, req.user!.id, dto);
      sendSuccess(res, data, "Modification requested");
    } catch (err) { next(err); }
  }

  async revise(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = reviseQuotationSchema.parse(req.body);
      const data = await this.service.revise(req.params.id as string, req.user!.id, dto);
      sendSuccess(res, data, "Quotation revised");
    } catch (err) { next(err); }
  }

  async getForOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.service.getForOrder(req.params.orderId as string);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async getMyQuotations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const data = await this.service.getProviderQuotations(req.user!.id, Number(page) || 1, Number(limit) || 20);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }
}
