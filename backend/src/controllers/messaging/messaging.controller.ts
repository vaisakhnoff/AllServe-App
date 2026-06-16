import { Response, NextFunction } from "express";
import { AuthRequest } from "../../shared/interfaces/AuthRequest";
import { sendSuccess } from "../../shared/utils/response";
import { Messages } from "../../shared/constants/messages";
import { StatusCodes } from "../../shared/constants/statusCodes";
import { IMessagingService } from "../../interfaces/messaging/IMessagingService";
import { Role } from "../../shared/enums/role.enum";
import {
  createConversationSchema,
  sendMessageSchema,
  messageQuerySchema,
  conversationQuerySchema,
  SenderRole,
} from "../../dto/messaging/messaging.dto";

export class MessagingController {
  constructor(private readonly service: IMessagingService) { }

  async getOrCreate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = createConversationSchema.parse(req.body);
      const userId = req.user!.role === Role.USER ? req.user!.id : req.body.userId;
      const provId = req.user!.role === Role.PROVIDER ? req.user!.id : dto.providerId;
      const conv = await this.service.getOrCreateConversation(userId, provId, dto.serviceId, dto.bookingId);
      sendSuccess(res, conv, Messages.CONVERSATION_READY);
    } catch (e) { next(e); }
  }

  async getConversations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = conversationQuerySchema.parse(req.query);
      const role = req.user!.role;
      const data = role === Role.PROVIDER
        ? await (this.service as unknown as { getProviderConversationsWithPagination: (...args: unknown[]) => unknown }).getProviderConversationsWithPagination(req.user!.id, query.search, query.page, query.limit)
        : await (this.service as unknown as { getUserConversationsWithPagination: (...args: unknown[]) => unknown }).getUserConversationsWithPagination(req.user!.id, query.search, query.page, query.limit);
      sendSuccess(res, data, Messages.CONVERSATIONS_FETCHED);
    } catch (e) { next(e); }
  }

  async getMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit } = messageQuerySchema.parse(req.query);
      const data = await this.service.getMessages(req.params.id as string, req.user!.id, page, limit);
      sendSuccess(res, data, Messages.MESSAGES_FETCHED);
    } catch (e) { next(e); }
  }

  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { content } = sendMessageSchema.parse(req.body);
      const senderRole: SenderRole = req.user!.role === Role.PROVIDER ? "provider" : "user";
      const msg = await this.service.sendMessage(req.params.id as string, req.user!.id, senderRole, content);
      sendSuccess(res, msg, Messages.MESSAGE_SENT, StatusCodes.CREATED);
    } catch (e) { next(e); }
  }

  async markRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const role: SenderRole = req.user!.role === Role.PROVIDER ? "provider" : "user";
      await this.service.markRead(req.params.id as string, req.user!.id, role);
      sendSuccess(res, null, Messages.MESSAGE_MARKED_READ);
    } catch (e) { next(e); }
  }

  async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const role: SenderRole = req.user!.role === Role.PROVIDER ? "provider" : "user";
      const count = await this.service.getUnreadCount(req.user!.id, role);
      sendSuccess(res, { count }, Messages.UNREAD_COUNT_FETCHED);
    } catch (e) { next(e); }
  }
}
