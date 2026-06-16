import { z } from "zod";
import { RejectionReasonCode } from "../../shared/enums/rejection-reason.enum";

export const adminQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["active", "blocked", "pending", "approved", "rejected"]).optional(),
});

export const rejectProviderSchema = z.object({
  reasonCode: z.nativeEnum(RejectionReasonCode, {
    message: "Invalid rejection reason code",
  }),
  adminRemarks: z.string().optional(),
});

export type AdminQueryDto = z.infer<typeof adminQuerySchema>;
export type RejectProviderDto = z.infer<typeof rejectProviderSchema>;
