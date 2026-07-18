import { google } from "@ai-sdk/google";
import { generateText, stepCountIs } from "ai";
import fs from "fs/promises";
import { buildAiTools } from "./toolDefinitions";
import { resolveProjectPath } from "./pathUtils";

export async function runAgent(projectId: string, userPrompt: string): Promise<string> {
    const sandboxRoot = resolveProjectPath(projectId, ".");
    await fs.mkdir(sandboxRoot, { recursive: true });

    const system = `You are a coding assistant working inside an EXISTING project sandbox for project "${projectId}".

CRITICAL RULES:
- This sandbox likely already contains a React application (or another framework). NEVER assume it's empty or plain HTML.
- ALWAYS call list_files on "." first, then explore relevant subfolders (e.g. "src", "src/pages", "src/components") before creating or writing anything.
- ALWAYS read package.json first if it exists, to detect the exact framework, libraries, and conventions in use (React, Vite, Next.js, TypeScript, CSS framework, etc.).
- If a components/pages folder structure already exists, follow the SAME structure and naming conventions for any new file. Do not invent a new structure.
- NEVER create a raw .html file for a UI request if the project is a React (or other framework) app — create the correct component file instead (e.g. .jsx or .tsx) and wire it into the existing routing/App file if one exists.
- Only fall back to plain HTML/CSS/JS if list_files and package.json genuinely show no framework is present.
- Always read a file before editing it if you're unsure of its current content.
- Briefly summarize what you changed and where at the end.`;

    const result = await generateText({
        model: google("gemini-2.5-flash"),
        system,
        prompt: userPrompt,
        tools: buildAiTools(projectId),
        stopWhen: stepCountIs(20), // slightly higher since exploration now takes more steps
    });

    return result.text;
}