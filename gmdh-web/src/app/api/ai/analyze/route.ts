import { createGateway } from "@ai-sdk/gateway";
import { streamText } from "ai";

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

export const runtime = "edge";

export async function POST(req: Request) {
  const { results, targetName, features } = await req.json();

  const result = streamText({
    model: gateway("openai/gpt-4o-mini"),
    system: `you are a gmdh results analyst. interpret model results and provide actionable insights. be concise and focus on practical implications.`,
    messages: [
      {
        role: "user",
        content: `gmdh results for predicting ${targetName}:

top models:
${JSON.stringify(results.combinatorial.slice(0, 5), null, 2)}

training set: ${results.trainSize} samples
validation set: ${results.validSize} samples

features: ${features.join(", ")}

analyze these results:
1. model performance (r2, error metrics)
2. which feature pairs are most important
3. potential overfitting or underfitting
4. recommendations for improvement

be specific and actionable.`,
      },
    ],
  });

  return result.toUIMessageStreamResponse();
}
