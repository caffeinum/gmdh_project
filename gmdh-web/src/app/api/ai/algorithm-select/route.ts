import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge";

export async function POST(req: Request) {
  const { dataStats, target, features } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: `you are a gmdh algorithm expert. recommend which gmdh variant to use based on dataset characteristics. be concise and explain why.`,
    messages: [
      {
        role: "user",
        content: `dataset info:
- target variable: ${target}
- features: ${features.length} (${features.join(", ")})
- sample size: ${dataStats.rows}
- data stats: ${JSON.stringify(dataStats, null, 2)}

recommend which gmdh approach to use:
1. combinatorial gmdh (quadratic pairs) - good for non-linear relationships
2. linear multivariate gmdh - good for linear relationships, matches academic papers
3. multi-layer gmdh - good for complex hierarchical patterns

explain your recommendation and expected performance.`,
      },
    ],
  });

  return result.toDataStreamResponse();
}
