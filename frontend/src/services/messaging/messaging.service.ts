import api from "@/api";
import { ApiResponse } from "@/types/auth.types";
import { Conversation, Message } from "@/types/messaging.types";

export interface PaginatedConversationsResponse {
  items: Conversation[];
  total: number;
  page: number;
  limit: number;
}

export const messagingService = {
  getOrCreateConversation: (data: { providerId: string; serviceId?: string; bookingId?: string }) =>
    api.post<ApiResponse<Conversation>>("/messaging/conversations", data),

  getConversations: () =>
    api.get<ApiResponse<Conversation[]>>("/messaging/conversations"),

  getConversationsWithPagination: (search?: string, page = 1, limit = 20) =>
    api.get<ApiResponse<PaginatedConversationsResponse>>("/messaging/conversations", {
      params: { search, page, limit },
    }),

  getMessages: (conversationId: string, page = 1) =>
    api.get<ApiResponse<Message[]>>(`/messaging/conversations/${conversationId}/messages`, { params: { page } }),

  sendMessage: (conversationId: string, content: string) =>
    api.post<ApiResponse<Message>>(`/messaging/conversations/${conversationId}/messages`, { content }),

  markRead: (conversationId: string) =>
    api.patch<ApiResponse<null>>(`/messaging/conversations/${conversationId}/read`),

  getUnreadCount: () =>
    api.get<ApiResponse<{ count: number }>>("/messaging/unread"),
};
