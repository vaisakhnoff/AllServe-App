import { Response, NextFunction } from "express";
import { AuthRequest } from "../../shared/interfaces/AuthRequest";
import { sendSuccess } from "../../shared/utils/response";
import { StatusCodes } from "../../shared/constants/statusCodes";
import { IInvoiceService } from "../../interfaces/invoice/IInvoiceService";
import { createInvoiceSchema } from "../../dto/invoice/invoice.dto";

export class InvoiceController {
  constructor(private readonly service: IInvoiceService) {}

  async generate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = createInvoiceSchema.parse(req.body);
      const data = await this.service.generate(req.user!.id, dto);
      sendSuccess(res, data, "Invoice generated", StatusCodes.CREATED);
    } catch (err) { next(err); }
  }

  async payOnline(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.service.payOnline(req.params.id as string, req.user!.id);
      sendSuccess(res, data, "Payment recorded");
    } catch (err) { next(err); }
  }

  async markCash(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.service.markCash(req.params.id as string, req.user!.id);
      sendSuccess(res, data, "Cash payment recorded");
    } catch (err) { next(err); }
  }

  async getByOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.service.getByOrderId(req.params.orderId as string);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }
}
