import { Request, Response } from "express";
import { runAgent } from "../ai/agent.service";

export async function handleAgentChat(
  req: Request,
  res: Response
) {
  const { projectId } = req.body;
  const { prompt } = req.body;

  if (!projectId) {
    return res.status(400).json({
      error: "projectId is required",
    });
  }

  if (!prompt) {
    return res.status(400).json({
      error: "prompt is required",
    });
  }

  try {
    const reply = await runAgent(projectId, prompt);

    return res.json({ reply });
  } catch (err: any) {
    console.error("Agent error:", err);

    return res.status(500).json({
      error: err.message,
    });
  }
}