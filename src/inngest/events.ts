import { eventType } from "inngest";
import { z } from "zod";

export const videoRequested = eventType("studio/video.requested", {
  schema: z.object({
    jobId: z.string().uuid(),
    topic: z.string().min(3).max(300),
    language: z.enum(["hi-IN", "en-IN", "en-US"]),
    channelContext: z.string().max(1200).optional(),
    targetDurationMinutes: z.number().int().min(1).max(60),
  }),
});
