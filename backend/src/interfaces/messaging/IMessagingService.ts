import { IConversation, IMessage } from "../../models/messaging.model";
import { SenderRole } from "../../dto/messaging/messaging.dto";

export interface IMessagingService {
  getOrCreateConversation(
    userId: string,
    providerId: string,
    serviceId?: string,
    bookingId?: string
  ): Promise<IConversation>;

  getUserConversations(userId: string): Promise<IConversation[]>;

  getProviderConversations(providerId: string): Promise<IConversation[]>;

  getMessages(
    conversationId: string,
    requesterId: string,
    page?: number,
    limit?: number
  ): Promise<IMessage[]>;

  sendMessage(
    conversationId: string,
    senderId: string,
    senderRole: SenderRole,
    content: string
  ): Promise<IMessage>;

  markRead(conversationId: string, userId: string, role: SenderRole): Promise<void>;

  getUnreadCount(userId: string, role: SenderRole): Promise<number>;
}
