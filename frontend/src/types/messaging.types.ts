export interface Conversation {
  _id: string;
  userId: string | { _id: string; name: string; email: string; profileImage?: string };
  providerId: string | { _id: string; name: string; businessName?: string; headshot?: string };
  serviceId?: string | { _id: string; name: string; images: string[] };
  bookingId?: string | { _id: string; date: string; startTime: string; bookingStatus: string };
  lastMessage?: string;
  lastMessageAt?: string;
  userUnread: number;
  providerUnread: number;
  createdAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  senderRole: "user" | "provider";
  content: string;
  isRead: boolean;
  createdAt: string;
}
