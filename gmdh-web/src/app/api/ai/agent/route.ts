import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge";

export async function POST(req: Request) {
  const { task, context } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    system: `you are a coding agent specialized in data analysis and gmdh implementations. you help users write code, analyze data, and build features. be concise and provide working code examples.`,
    messages: [
      {
        role: "user",
        content: `task: ${task}

context: ${JSON.stringify(context, null, 2)}

provide step-by-step guidance and code examples to complete this task.`,
      },
    ],
  });

  return result.toDataStreamResponse();
}
