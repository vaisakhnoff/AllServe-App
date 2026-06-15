import { z } from "zod";

const objectIdField = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const createConversationSchema = z.object({
  providerId: objectIdField,
  serviceId: objectIdField.optional(),
  bookingId: objectIdField.optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(2000, "Message is too long"),
});

export const messageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const conversationQuerySchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type CreateConversationDto = z.infer<typeof createConversationSchema>;
export type SendMessageDto = z.infer<typeof sendMessageSchema>;
export type MessageQuery = z.infer<typeof messageQuerySchema>;
export type ConversationQuery = z.infer<typeof conversationQuerySchema>;

// Sender role type used across messaging
export type SenderRole = "user" | "provider";
