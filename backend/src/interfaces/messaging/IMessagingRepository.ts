import { IConversation, IMessage } from "../../models/messaging.model";
import { SenderRole } from "../../dto/messaging/messaging.dto";

export interface ConversationListResult {
  items: IConversation[];
  total: number;
}

export interface IConversationRepository {
  findByParticipants(userId: string, providerId: string): Promise<IConversation | null>;
  create(data: Partial<IConversation>): Promise<IConversation>;
  findById(id: string): Promise<IConversation | null>;
  findByUser(userId: string): Promise<IConversation[]>;
  findByUserWithPagination(userId: string, search?: string, page?: number, limit?: number): Promise<ConversationListResult>;
  findByProvider(providerId: string): Promise<IConversation[]>;
  findByProviderWithPagination(providerId: string, search?: string, page?: number, limit?: number): Promise<ConversationListResult>;
  updateLastMessage(id: string, content: string, senderRole: SenderRole): Promise<IConversation | null>;
  resetUnreadCount(id: string, role: SenderRole): Promise<void>;
  sumUnreadByUser(userId: string): Promise<number>;
  sumUnreadByProvider(providerId: string): Promise<number>;
}

export interface IMessageRepository {
  create(data: Partial<IMessage>): Promise<IMessage>;
  findByConversation(conversationId: string, page: number, limit: number): Promise<IMessage[]>;
  markReadByRecipient(conversationId: string, recipientId: string): Promise<void>;
}
