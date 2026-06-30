import { Response, NextFunction } from "express";
import { AuthRequest } from "../../shared/interfaces/AuthRequest";
import { sendSuccess } from "../../shared/utils/response";
import { StatusCodes } from "../../shared/constants/statusCodes";
import { IDirectRequestService, IInspectionRequestService, ICustomRequestService, ICustomOrderLifecycleService, IServiceOrderQueryService } from "../../interfaces/service-order/IServiceOrderService";
import {
  createDirectInstantSchema,
  createDirectScheduledSchema,
  createInspectionSchema,
  createCustomSchema,
  customerChoiceSchema,
  orderQuerySchema,
  cancelOrderSchema,
} from "../../dto/service-order/serviceOrder.dto";

export class ServiceOrderController {
  constructor(
    private readonly directService: IDirectRequestService,
    private readonly inspectionService: IInspectionRequestService,
    private readonly customService: ICustomRequestService,
    private readonly customOrderLifecycleService: ICustomOrderLifecycleService,
    private readonly queryService: IServiceOrderQueryService
  ) { }

  // ── Direct Instant ──────────────────────────────────────────────────────────
  async createDirectInstant(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = createDirectInstantSchema.parse(req.body);
      const data = await this.directService.createInstantRequest(req.user!.id, dto);
      sendSuccess(res, data, "Instant request created", StatusCodes.CREATED);
    } catch (err) { next(err); }
  }

  // ── Direct Scheduled ────────────────────────────────────────────────────────
  async createDirectScheduled(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = createDirectScheduledSchema.parse(req.body);
      const data = await this.directService.createScheduledRequest(req.user!.id, dto);
      sendSuccess(res, data, "Scheduled request created", StatusCodes.CREATED);
    } catch (err) { next(err); }
  }

  // ── Accept / Reject ─────────────────────────────────────────────────────────
  async acceptOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.directService.acceptRequest(req.params.id as string, req.user!.id);
      sendSuccess(res, data, "Order accepted");
    } catch (err) { next(err); }
  }

  async rejectOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.directService.rejectRequest(req.params.id as string, req.user!.id);
      sendSuccess(res, data, "Order rejected");
    } catch (err) { next(err); }
  }

  // ── Customer Choice ─────────────────────────────────────────────────────────
  async customerChoice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = customerChoiceSchema.parse(req.body);
      const data = await this.directService.handleCustomerChoice(req.params.id as string, req.user!.id, dto);
      sendSuccess(res, data, "Choice applied");
    } catch (err) { next(err); }
  }

  // ── Inspection ──────────────────────────────────────────────────────────────
  async createInspection(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = createInspectionSchema.parse(req.body);
      const data = await this.inspectionService.createRequest(req.user!.id, dto);
      sendSuccess(res, data, "Inspection request created", StatusCodes.CREATED);
    } catch (err) { next(err); }
  }

  // ── Inspection Lifecycle ────────────────────────────────────────────────────
  async acceptInspection(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.inspectionService.acceptInspection(req.params.id as string, req.user!.id);
      sendSuccess(res, data, "Inspection accepted");
    } catch (err) { next(err); }
  }

  async rejectInspection(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.inspectionService.rejectInspection(req.params.id as string, req.user!.id);
      sendSuccess(res, data, "Inspection rejected");
    } catch (err) { next(err); }
  }

  async markInspectionDone(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.inspectionService.markInspectionDone(req.params.id as string, req.user!.id);
      sendSuccess(res, data, "Inspection marked as done");
    } catch (err) { next(err); }
  }

  async dropByProvider(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const reason = req.body?.reason || "No reason provided";
      const data = await this.inspectionService.dropByProvider(req.params.id as string, req.user!.id, reason);
      sendSuccess(res, data, "Order dropped");
    } catch (err) { next(err); }
  }

  async dropByCustomer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const reason = req.body?.reason || "No reason provided";
      const data = await this.inspectionService.dropByCustomer(req.params.id as string, req.user!.id, reason);
      sendSuccess(res, data, "Order dropped");
    } catch (err) { next(err); }
  }

  async inspectionStartWork(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.inspectionService.startWork(req.params.id as string, req.user!.id);
      sendSuccess(res, data, "Work started");
    } catch (err) { next(err); }
  }

  async inspectionCompleteWork(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.inspectionService.completeWork(req.params.id as string, req.user!.id);
      sendSuccess(res, data, "Work completed");
    } catch (err) { next(err); }
  }

  // ── Custom ──────────────────────────────────────────────────────────────────
  async createCustom(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = createCustomSchema.parse(req.body);
      const data = await this.customService.createRequest(req.user!.id, dto);
      sendSuccess(res, data, "Custom request created", StatusCodes.CREATED);
    } catch (err) { next(err); }
  }

  async acceptCustomOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.customOrderLifecycleService.acceptCustom(req.params.id as string, req.user!.id);
      sendSuccess(res, data, "Custom order accepted");
    } catch (err) { next(err); }
  }

  async rejectCustomOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.customOrderLifecycleService.rejectCustom(req.params.id as string, req.user!.id);
      sendSuccess(res, data, "Custom order rejected");
    } catch (err) { next(err); }
  }

  // ── Query ───────────────────────────────────────────────────────────────────
  async getMyOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = orderQuerySchema.parse(req.query);
      const data = await this.queryService.getCustomerOrders(req.user!.id, query);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async getProviderOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = orderQuerySchema.parse(req.query);
      const data = await this.queryService.getProviderOrders(req.user!.id, query);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async getOrderById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.queryService.getOrderById(req.params.id as string, req.user!.id);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async cancelOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { reason } = cancelOrderSchema.parse(req.body);
      const data = await this.queryService.cancelOrder(req.params.id as string, req.user!.id, reason);
      sendSuccess(res, data, "Order cancelled");
    } catch (err) { next(err); }
  }

  async dropCustomByProvider(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const reason = req.body?.reason || "No reason provided";
      const data = await this.customOrderLifecycleService.dropByProvider(req.params.id as string, req.user!.id, reason);
      sendSuccess(res, data, "Order dropped");
    } catch (err) { next(err); }
  }

  async dropCustomByCustomer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const reason = req.body?.reason || "No reason provided";
      const data = await this.customOrderLifecycleService.dropByCustomer(req.params.id as string, req.user!.id, reason);
      sendSuccess(res, data, "Order cancelled");
    } catch (err) { next(err); }
  }

  // ── Direct Order Lifecycle ──────────────────────────────────────────────────
  async directStartWork(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.directService.startWork(req.params.id as string, req.user!.id);
      sendSuccess(res, data, "Work started");
    } catch (err) { next(err); }
  }

  async directCompleteWork(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.directService.completeWork(req.params.id as string, req.user!.id);
      sendSuccess(res, data, "Work completed");
    } catch (err) { next(err); }
  }

  // ── Custom Order Lifecycle ──────────────────────────────────────────────────
  async customStartWork(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.customOrderLifecycleService.startWork(req.params.id as string, req.user!.id);
      sendSuccess(res, data, "Work started");
    } catch (err) { next(err); }
  }

  async customCompleteWork(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.customOrderLifecycleService.completeWork(req.params.id as string, req.user!.id);
      sendSuccess(res, data, "Work completed");
    } catch (err) { next(err); }
  }
}
