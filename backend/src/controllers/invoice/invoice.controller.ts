import { Response, NextFunction } from "express";
import { AuthRequest } from "../../shared/interfaces/AuthRequest";
import { sendSuccess } from "../../shared/utils/response";
import { StatusCodes } from "../../shared/constants/statusCodes";
import { IInvoiceService } from "../../interfaces/invoice/IInvoiceService";
import { createInvoiceSchema } from "../../dto/invoice/invoice.dto";
import { QuotationModel } from "../../models/quotation.model";

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

  /**
   * GET /invoices/prefill/:orderId
   * Returns the pre-filled invoice data from the accepted quotation.
   * For direct orders returns null (provider fills manually).
   * Frontend uses this to show locked amounts before generating an invoice.
   */
  async getPrefill(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params as { orderId: string };

      // Find the accepted quotation for this order
      const quotation = await QuotationModel.findOne({ orderId, status: "accepted" }).lean();
      if (!quotation) {
        // Direct orders — no pre-fill needed
        sendSuccess(res, null, "No quotation pre-fill (direct order)");
        return;
      }

      const rev = quotation.currentRevision;
      sendSuccess(res, {
        fromQuotation: true,
        quotationId: quotation._id,
        labourCharge: rev.labourCharge,
        materialCost: rev.materialCost,
        additionalCharges: rev.additionalCharges,
        estimatedDurationDays: rev.estimatedDurationDays,
        notes: rev.notes,
        termsAndConditions: rev.termsAndConditions,
        totalAmount: quotation.totalAmount,
      }, "Invoice pre-fill data");
    } catch (err) { next(err); }
  }
}
