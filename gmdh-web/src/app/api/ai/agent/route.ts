import { createGateway } from "@ai-sdk/gateway";
import { streamText } from "ai";

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

export const runtime = "edge";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: gateway("openai/gpt-4o"),
    system: `you are a coding agent specialized in data analysis and gmdh implementations. you help users write code, analyze data, and build features. be concise and provide working code examples.`,
    messages,
  });

  return result.toUIMessageStreamResponse();
}
