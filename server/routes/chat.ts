import { Router } from "express";
import {
  createUIMessageStream,
  pipeUIMessageStreamToResponse,
} from "ai";
import { mastra } from "../agents/index.js";

const router = Router();

router.post("/", async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  const agent = mastra.getAgent("coordinator");

  const threadId = `day-${new Date().toISOString().split("T")[0]}`;
  const resourceId = "topside-user";

  try {
    const result = await agent.stream(messages, {
      memory: {
        thread: threadId,
        resource: resourceId,
      },
    });

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        let currentTextId: string | null = null;

        for await (const chunk of result.fullStream) {
          switch (chunk.type) {
            case "text-start":
              currentTextId = chunk.payload.id;
              writer.write({
                type: "text-start",
                id: chunk.payload.id,
              });
              break;

            case "text-delta":
              writer.write({
                type: "text-delta",
                id: chunk.payload.id,
                delta: chunk.payload.text,
              });
              break;

            case "text-end":
              writer.write({
                type: "text-end",
                id: chunk.payload.id,
              });
              currentTextId = null;
              break;

            case "tool-call":
              writer.write({
                type: "tool-input-available",
                toolCallId: chunk.payload.toolCallId,
                toolName: chunk.payload.toolName,
                input: chunk.payload.args ?? {},
              });
              break;

            case "tool-result":
              writer.write({
                type: "tool-output-available",
                toolCallId: chunk.payload.toolCallId,
                output: chunk.payload.result,
              });
              break;

            case "step-start":
              writer.write({ type: "start-step" });
              break;

            case "step-finish":
              writer.write({ type: "finish-step" });
              break;

            case "error":
              writer.write({
                type: "error",
                errorText:
                  chunk.payload.error instanceof Error
                    ? chunk.payload.error.message
                    : String(chunk.payload.error),
              });
              break;
          }
        }
      },
    });

    pipeUIMessageStreamToResponse({ stream, response: res });
  } catch (err) {
    console.error("Chat stream error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to stream response" });
    }
  }
});

export default router;
