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
  const { dataStats, target, features, locale = "en" } = await req.json();
  const langInstruction = langInstructions[locale] || langInstructions.en;

  const result = streamText({
    model: gateway("openai/gpt-5-mini"),
    system: `You are a GMDH algorithm expert. Recommend which GMDH variant to use based on dataset characteristics. Be concise and explain why. ${langInstruction}`,
    messages: [
      {
        role: "user",
        content: `Dataset info:
- Target variable: ${target}
- Features: ${features.length} (${features.join(", ")})
- Sample size: ${dataStats.rows}
- Data stats: ${JSON.stringify(dataStats, null, 2)}

Recommend which GMDH approach to use:
1. Combinatorial GMDH (quadratic pairs) - good for non-linear relationships
2. Linear multivariate GMDH - good for linear relationships, matches academic papers
3. Multi-layer GMDH - good for complex hierarchical patterns

Explain your recommendation and expected performance.`,
      },
    ],
  });

  return result.toUIMessageStreamResponse();
}
