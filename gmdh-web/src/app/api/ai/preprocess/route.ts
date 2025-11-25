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
  const { data, headers, locale = "en" } = await req.json();

  const stats = computeStats(data, headers);
  const langInstruction = langInstructions[locale] || langInstructions.en;

  const result = streamText({
    model: gateway("openai/gpt-5-mini"),
    system: `You are a data preprocessing expert. Analyze the dataset and suggest preprocessing steps for GMDH analysis. Keep responses concise and actionable. ${langInstruction}`,
    messages: [
      {
        role: "user",
        content: `Dataset stats:
- Columns: ${headers.join(", ")}
- Rows: ${data.length}
- Stats: ${JSON.stringify(stats, null, 2)}

Suggest preprocessing steps for this dataset before running GMDH. Consider:
1. Missing values
2. Outliers
3. Normalization/scaling
4. Feature engineering

Be concise and specific to this data.`,
      },
    ],
  });

  return result.toUIMessageStreamResponse();
}

interface ColumnStats {
  count?: number;
  missing: number;
  valid?: number;
  min?: number;
  max?: number;
  mean?: string;
  std?: string;
  median?: number;
}

function computeStats(data: number[][], headers: string[]) {
  const stats: Record<string, ColumnStats> = {};

  for (let col = 0; col < headers.length; col++) {
    const values = data.map((row) => row[col]).filter((v) => !isNaN(v));

    if (values.length === 0) {
      stats[headers[col]] = { missing: data.length, valid: 0 };
      continue;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    const std = Math.sqrt(variance);

    stats[headers[col]] = {
      count: values.length,
      missing: data.length - values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: mean.toFixed(3),
      std: std.toFixed(3),
      median: sorted[Math.floor(sorted.length / 2)],
    };
  }

  return stats;
}
