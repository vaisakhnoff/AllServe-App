import { z } from "zod";

export const toggleOnlineSchema = z.object({
  onlineStatus: z.enum(["online", "offline"]),
});

export type ToggleOnlineDto = z.infer<typeof toggleOnlineSchema>;
