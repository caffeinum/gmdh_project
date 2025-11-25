import { createGateway } from "@ai-sdk/gateway";
import { streamText } from "ai";

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

const langInstructions: Record<string, string> = {
  en: "Respond in English.",
  ru: "Отвечай на русском языке.",
  uk: "Відповідай українською мовою.",
};

export const runtime = "edge";

export async function POST(req: Request) {
  const { messages, locale = "en" } = await req.json();
  const langInstruction = langInstructions[locale] || langInstructions.en;

  const result = streamText({
    model: gateway("openai/gpt-5-mini"),
    system: `You are a coding agent specialized in data analysis and GMDH implementations. You help users write code, analyze data, and build features. Be concise and provide working code examples. ${langInstruction}`,
    messages,
  });

  return result.toUIMessageStreamResponse();
}
