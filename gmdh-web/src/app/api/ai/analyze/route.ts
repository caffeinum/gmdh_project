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
  const { results, targetName, features, locale = "en" } = await req.json();
  const langInstruction = langInstructions[locale] || langInstructions.en;

  const result = streamText({
    model: gateway("openai/gpt-5-mini"),
    system: `You are a GMDH results analyst. Interpret model results and provide actionable insights. Be concise and focus on practical implications. ${langInstruction}`,
    messages: [
      {
        role: "user",
        content: `GMDH results for predicting ${targetName}:

Top models:
${JSON.stringify(results.combinatorial.slice(0, 5), null, 2)}

Training set: ${results.trainSize} samples
Validation set: ${results.validSize} samples

Features: ${features.join(", ")}

Analyze these results:
1. Model performance (R², error metrics)
2. Which feature pairs are most important
3. Potential overfitting or underfitting
4. Recommendations for improvement

Be specific and actionable.`,
      },
    ],
  });

  return result.toUIMessageStreamResponse();
}
