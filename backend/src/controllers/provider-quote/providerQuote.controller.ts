import { Response, NextFunction } from "express";
import { AuthRequest } from "../../shared/interfaces/AuthRequest";
import { sendSuccess } from "../../shared/utils/response";
import { IProviderQuoteService } from "../../interfaces/provider-quote/IProviderQuoteService";
import { createProviderQuoteSchema, updateProviderQuoteSchema } from "../../dto/provider-quote/providerQuote.dto";
import { StatusCodes } from "../../shared/constants/statusCodes";

export class ProviderQuoteController {
  constructor(private service: IProviderQuoteService) {}

  async submit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = createProviderQuoteSchema.parse(req.body);
      const data = await this.service.submitQuote(req.user!.id, dto);
      sendSuccess(res, data, "Quote submitted", StatusCodes.CREATED);
    } catch (err) { next(err); }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = updateProviderQuoteSchema.parse(req.body);
      const data = await this.service.updateQuote(req.params.id as string, req.user!.id, dto);
      sendSuccess(res, data, "Quote updated");
    } catch (err) { next(err); }
  }

  async withdraw(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.service.withdrawQuote(req.params.id as string, req.user!.id);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async getForRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.service.getQuotesForRequest(req.params.requestId as string);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async getMyQuotes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const data = await this.service.getProviderQuotes(req.user!.id, Number(page) || 1, Number(limit) || 20);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async accept(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.service.acceptQuote(req.params.id as string, req.user!.id);
      sendSuccess(res, data, "Quote accepted, booking created");
    } catch (err) { next(err); }
  }

  async getProviderStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.service.getProviderStats(req.user!.id);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }
}
