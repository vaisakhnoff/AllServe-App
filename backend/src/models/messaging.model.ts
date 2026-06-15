import mongoose, { Schema, Document } from "mongoose";

export interface IConversation extends Document {
  userId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  serviceId?: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  lastMessage?: string;
  lastMessageAt?: Date;
  userUnread: number;
  providerUnread: number;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    providerId: { type: Schema.Types.ObjectId, ref: "ProviderAccount", required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service" },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
    userUnread: { type: Number, default: 0 },
    providerUnread: { type: Number, default: 0 },
  },
  { timestamps: true }
);

conversationSchema.index({ userId: 1, providerId: 1 });
conversationSchema.index({ userId: 1, lastMessageAt: -1 });
conversationSchema.index({ providerId: 1, lastMessageAt: -1 });

export const ConversationModel = mongoose.model<IConversation>("Conversation", conversationSchema);

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: string;
  senderRole: "user" | "provider";
  content: string;
  isRead: boolean;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderId: { type: String, required: true },
    senderRole: { type: String, enum: ["user", "provider"], required: true },
    content: { type: String, required: true, maxlength: 2000 },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

export const MessageModel = mongoose.model<IMessage>("Message", messageSchema);
