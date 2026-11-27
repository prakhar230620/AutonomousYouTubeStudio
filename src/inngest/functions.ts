import OpenAI from "openai";
import { inngest } from "./client";
import { videoRequested } from "./events";
import { getStudioDb } from "@/lib/studio/supabase-admin";

export const processVideoRequest = inngest.createFunction(
  {
    id: "studio-process-video-request",
    retries: 2,
    triggers: [videoRequested],
  },
  async ({ event, step }) => {
    const { jobId, topic, language, channelContext, targetDurationMinutes } = event.data;

    const script = await step.run("generate-video-script", async () => {
      const apiKey = process.env.OPENAI_API_KEY;
      const model = process.env.OPENAI_SCRIPT_MODEL;
      if (!apiKey || !model) {
        throw new Error("Script generation is not configured. Set OPENAI_API_KEY and OPENAI_SCRIPT_MODEL.");
      }

      const openai = new OpenAI({ apiKey });
      const response = await openai.responses.create({
        model,
        instructions:
          "You are a professional educational YouTube scriptwriter. Write accurate, engaging narration. Never invent facts, statistics, or citations. Use clear spoken language, natural transitions, an opening hook, and a concise conclusion. Return only the finished narration script; do not include camera directions or markdown tables.",
        input: [
          `Topic: ${topic}`,
          `Language: ${language}`,
          `Target duration: ${targetDurationMinutes} minutes`,
          channelContext ? `Channel context: ${channelContext}` : "",
          language === "hi-IN"
            ? "Write in natural Indian Hindi in Devanagari, with commonly understood English technical terms where natural. Keep sentences easy to narrate aloud."
            : "Use natural Indian English with a clear, conversational teaching style.",
        ].filter(Boolean).join("\n"),
      });

      const output = response.output_text?.trim();
      if (!output) throw new Error("The script model returned an empty response.");
      return output;
    });

    await step.run("save-script-and-pause-at-voiceover-gate", async () => {
      const db = getStudioDb();
      const { error } = await db
        .from("studio_video_jobs")
        .update({
          script,
          status: "needs_human_review",
          progress: 15,
          last_error:
            "Script generated. Voiceover automation is paused until the existing Vercel Connect/MessagePack API contract is verified.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      if (error) throw new Error(`Could not save generated script: ${error.message}`);
    });

    return {
      jobId,
      status: "needs_human_review",
      completedStage: "scripting",
      nextStage: "voiceover",
    };
  },
);
