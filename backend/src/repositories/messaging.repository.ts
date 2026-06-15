import { ConversationModel, IConversation, MessageModel, IMessage } from "../models/messaging.model";
import {
  ConversationListResult,
  IConversationRepository,
  IMessageRepository,
} from "../interfaces/messaging/IMessagingRepository";

import { SenderRole } from "../dto/messaging/messaging.dto";

// ── Conversation Repository ───────────────────────────────────────────────────
// Note: messaging uses two separate models (Conversation + Message), so we
// do NOT extend BaseRepository here — we implement the interfaces directly.

export class ConversationRepository implements IConversationRepository {


  async findByParticipants(userId: string, providerId: string): Promise<IConversation | null> {
    return ConversationModel.findOne({ userId, providerId }).lean() as Promise<IConversation | null>;
  }

  async create(data: Partial<IConversation>): Promise<IConversation> {
    return ConversationModel.create(data) as Promise<IConversation>;
  }

  async findById(id: string): Promise<IConversation | null> {
    return ConversationModel.findById(id).lean() as Promise<IConversation | null>;
  }

  async findByUser(userId: string): Promise<IConversation[]> {
    return ConversationModel.find({ userId })
      .populate("providerId", "name businessName headshot")
      .populate("serviceId", "name images")
      .sort({ lastMessageAt: -1 })
      .lean() as Promise<IConversation[]>;
  }

  async findByUserWithPagination(
    userId: string,
    search?: string,
    page = 1,
    limit = 20
  ): Promise<ConversationListResult> {
    const filter: Record<string, unknown> = { userId };
    if (search) {
      filter.$or = [
        { "providerId.name": { $regex: search, $options: "i" } },
        { "providerId.businessName": { $regex: search, $options: "i" } },
        { lastMessage: { $regex: search, $options: "i" } },
      ];
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      ConversationModel.find(filter)
        .populate("providerId", "name businessName headshot")
        .populate("serviceId", "name images")
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() as Promise<IConversation[]>,
      ConversationModel.countDocuments(filter),
    ]);
    return { items, total };
  }

  async findByProvider(providerId: string): Promise<IConversation[]> {
    return ConversationModel.find({ providerId })
      .populate("userId", "name email profileImage")
      .populate("serviceId", "name images")
      .populate("bookingId", "date startTime bookingStatus")
      .sort({ lastMessageAt: -1 })
      .lean() as Promise<IConversation[]>;
  }

  async findByProviderWithPagination(
    providerId: string,
    search?: string,
    page = 1,
    limit = 20
  ): Promise<ConversationListResult> {
    const filter: Record<string, unknown> = { providerId };
    if (search) {
      filter.$or = [
        { "userId.name": { $regex: search, $options: "i" } },
        { "userId.email": { $regex: search, $options: "i" } },
        { lastMessage: { $regex: search, $options: "i" } },
      ];
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      ConversationModel.find(filter)
        .populate("userId", "name email profileImage")
        .populate("serviceId", "name images")
        .populate("bookingId", "date startTime bookingStatus")
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() as Promise<IConversation[]>,
      ConversationModel.countDocuments(filter),
    ]);
    return { items, total };
  }

  async updateLastMessage(
    id: string,
    content: string,
    senderRole: SenderRole
  ): Promise<IConversation | null> {
    const inc = senderRole === "user" ? { providerUnread: 1 } : { userUnread: 1 };
    return ConversationModel.findByIdAndUpdate(
      id,
      { lastMessage: content, lastMessageAt: new Date(), $inc: inc },
      { returnDocument: 'after' }
    ).lean() as Promise<IConversation | null>;
  }

  async resetUnreadCount(id: string, role: SenderRole): Promise<void> {
    const update = role === "user" ? { userUnread: 0 } : { providerUnread: 0 };
    await ConversationModel.findByIdAndUpdate(id, update);
  }

  async sumUnreadByUser(userId: string): Promise<number> {
    const result = await ConversationModel.aggregate([
      { $match: { userId: { $eq: userId } } },
      { $group: { _id: null, total: { $sum: "$userUnread" } } },
    ]);
    return result[0]?.total ?? 0;
  }

  async sumUnreadByProvider(providerId: string): Promise<number> {
    const result = await ConversationModel.aggregate([
      { $match: { providerId: { $eq: providerId } } },
      { $group: { _id: null, total: { $sum: "$providerUnread" } } },
    ]);
    return result[0]?.total ?? 0;
  }
}

// ── Message Repository ────────────────────────────────────────────────────────

export class MessageRepository implements IMessageRepository {
  async create(data: Partial<IMessage>): Promise<IMessage> {
    return MessageModel.create(data) as Promise<IMessage>;
  }

  async findByConversation(
    conversationId: string,
    page = 1,
    limit = 50
  ): Promise<IMessage[]> {
    const messages = await MessageModel.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    return messages.reverse() as IMessage[];
  }

  async markReadByRecipient(conversationId: string, recipientId: string): Promise<void> {
    await MessageModel.updateMany(
      { conversationId, senderId: { $ne: recipientId }, isRead: false },
      { isRead: true }
    );
  }
}
