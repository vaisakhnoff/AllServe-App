import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../shared/interfaces/AuthRequest";
import { sendSuccess } from "../../shared/utils/response";
import { ISlotService } from "../../interfaces/slot/ISlotService";
import { createSlotSchema, updateSlotSchema, bulkCreateSchema, recurringSlotSchema, blockRangeSchema } from "../../dto/slot/slot.dto";

export class SlotController {
  constructor(private readonly service: ISlotService) {}

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = createSlotSchema.parse(req.body);
      const data = await this.service.createSlot(req.user!.id, dto);
      sendSuccess(res, data, "Slot created successfully", 201);
    } catch (err) { next(err); }
  }

  async bulkCreate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = bulkCreateSchema.parse(req.body);
      const data = await this.service.bulkCreate(req.user!.id, dto);
      sendSuccess(res, data, "Bulk slots created", 201);
    } catch (err) { next(err); }
  }

  async createRecurring(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = recurringSlotSchema.parse(req.body);
      const data = await this.service.createRecurring(req.user!.id, dto);
      sendSuccess(res, data, "Recurring slots created", 201);
    } catch (err) { next(err); }
  }

  async blockRange(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = blockRangeSchema.parse(req.body);
      const data = await this.service.blockDateRange(req.user!.id, dto);
      sendSuccess(res, data, "Date range blocked");
    } catch (err) { next(err); }
  }

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.service.getSlotStats(req.user!.id);
      sendSuccess(res, data, "Stats fetched");
    } catch (err) { next(err); }
  }

  async getMySlots(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const date = req.query.date as string | undefined;
      const data = await this.service.getProviderSlots(req.user!.id, date);
      sendSuccess(res, data, "Slots fetched successfully");
    } catch (err) { next(err); }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = updateSlotSchema.parse(req.body);
      const data = await this.service.updateSlot(req.user!.id, req.params.id as string, dto);
      sendSuccess(res, data, "Slot updated successfully");
    } catch (err) { next(err); }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await this.service.deleteSlot(req.user!.id, req.params.id as string);
      sendSuccess(res, null, "Slot deleted successfully");
    } catch (err) { next(err); }
  }

  async getAvailable(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = req.params.providerId as string;
      const date = req.query.date as string | undefined;
      const data = await this.service.getAvailableSlots(providerId, date);
      sendSuccess(res, data, "Available slots fetched successfully");
    } catch (err) { next(err); }
  }

  async lock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await this.service.lockSlot(req.params.id as string, req.user!.id);
      sendSuccess(res, data, "Slot locked successfully");
    } catch (err) { next(err); }
  }

  async unlock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await this.service.unlockSlot(req.params.id as string);
      sendSuccess(res, null, "Slot unlocked successfully");
    } catch (err) { next(err); }
  }

  async book(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const serviceId = typeof req.body?.serviceId === "string" ? req.body.serviceId : undefined;
      const data = await this.service.bookSlot(req.params.id as string, req.user!.id, serviceId);
      sendSuccess(res, data, "Slot booked successfully");
    } catch (err) { next(err); }
  }
}
