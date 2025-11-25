import { createGateway } from "@ai-sdk/gateway";
import { streamText } from "ai";

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

export const runtime = "edge";

export async function POST(req: Request) {
  const { data, headers } = await req.json();

  const stats = computeStats(data, headers);

  const result = streamText({
    model: gateway("openai/gpt-5-mini"),
    system: `you are a data preprocessing expert. analyze the dataset and suggest preprocessing steps for gmdh analysis. keep responses concise and actionable.`,
    messages: [
      {
        role: "user",
        content: `dataset stats:
- columns: ${headers.join(", ")}
- rows: ${data.length}
- stats: ${JSON.stringify(stats, null, 2)}

suggest preprocessing steps for this dataset before running gmdh. consider:
1. missing values
2. outliers
3. normalization/scaling
4. feature engineering

be concise and specific to this data.`,
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
