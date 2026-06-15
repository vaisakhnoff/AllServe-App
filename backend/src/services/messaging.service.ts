import { IConversationRepository, IMessageRepository } from "../interfaces/messaging/IMessagingRepository";
import { IMessagingService } from "../interfaces/messaging/IMessagingService";
import { IConversation, IMessage } from "../models/messaging.model";
import { SenderRole } from "../dto/messaging/messaging.dto";
import { NotFoundError, ForbiddenError } from "../shared/errors/HttpErrors";

export interface PaginatedConversationResponse {
  items: IConversation[];
  total: number;
  page: number;
  limit: number;
}

export class MessagingService implements IMessagingService {
  constructor(
    private readonly conversationRepo: IConversationRepository,
    private readonly messageRepo: IMessageRepository
  ) {}

  async getOrCreateConversation(
    userId: string,
    providerId: string,
    serviceId?: string,
    bookingId?: string
  ): Promise<IConversation> {
    const existing = await this.conversationRepo.findByParticipants(userId, providerId);
    if (existing) return existing;
    return this.conversationRepo.create({ userId, providerId, serviceId, bookingId } as unknown as Partial<IConversation>);
  }

  async getUserConversations(userId: string): Promise<IConversation[]> {
    return this.conversationRepo.findByUser(userId);
  }

  async getUserConversationsWithPagination(
    userId: string,
    search?: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedConversationResponse> {
    const result = await this.conversationRepo.findByUserWithPagination(userId, search, page, limit);
    return {
      items: result.items,
      total: result.total,
      page,
      limit,
    };
  }

  async getProviderConversations(providerId: string): Promise<IConversation[]> {
    return this.conversationRepo.findByProvider(providerId);
  }

  async getProviderConversationsWithPagination(
    providerId: string,
    search?: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedConversationResponse> {
    const result = await this.conversationRepo.findByProviderWithPagination(providerId, search, page, limit);
    return {
      items: result.items,
      total: result.total,
      page,
      limit,
    };
  }

  async getMessages(
    conversationId: string,
    requesterId: string,
    page = 1,
    limit = 50
  ): Promise<IMessage[]> {
    const conv = await this.conversationRepo.findById(conversationId);
    if (!conv) throw new NotFoundError("Conversation not found");
    if (String(conv.userId) !== requesterId && String(conv.providerId) !== requesterId) {
      throw new ForbiddenError("Unauthorized");
    }
    return this.messageRepo.findByConversation(conversationId, page, limit);
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    senderRole: SenderRole,
    content: string
  ): Promise<IMessage> {
    const conv = await this.conversationRepo.findById(conversationId);
    if (!conv) throw new NotFoundError("Conversation not found");
    if (String(conv.userId) !== senderId && String(conv.providerId) !== senderId) {
      throw new ForbiddenError("Unauthorized");
    }
    const message = await this.messageRepo.create({ conversationId, senderId, senderRole, content } as unknown as Partial<IMessage>);
    await this.conversationRepo.updateLastMessage(conversationId, content, senderRole);
    return message;
  }

  async markRead(conversationId: string, userId: string, role: SenderRole): Promise<void> {
    const conv = await this.conversationRepo.findById(conversationId);
    if (!conv) return;
    await this.messageRepo.markReadByRecipient(conversationId, userId);
    await this.conversationRepo.resetUnreadCount(conversationId, role);
  }

  async getUnreadCount(userId: string, role: SenderRole): Promise<number> {
    return role === "user"
      ? this.conversationRepo.sumUnreadByUser(userId)
      : this.conversationRepo.sumUnreadByProvider(userId);
  }
}
