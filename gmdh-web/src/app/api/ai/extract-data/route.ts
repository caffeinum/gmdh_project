import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, stepCountIs } from "ai";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const runtime = "nodejs";
export const maxDuration = 60;

function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop();
  const mimeTypes: Record<string, string> = {
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xls: "application/vnd.ms-excel",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    pdf: "application/pdf",
  };
  return mimeTypes[ext || ""] || "application/octet-stream";
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const locale = (formData.get("locale") as string) || "en";

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const langInstructions: Record<string, string> = {
    en: "Respond in English.",
    ru: "Отвечай на русском языке.",
    uk: "Відповідай українською мовою.",
  };

  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const base64Data = fileBuffer.toString("base64");
    const mimeType = getMimeType(file.name);

    const result = await generateText({
      model: anthropic("claude-sonnet-4-5-20250929"),
      providerOptions: {
        anthropic: {
          container: {
            skills: [
              { type: "anthropic" as const, skillId: "xlsx" },
              { type: "anthropic" as const, skillId: "docx" },
              { type: "anthropic" as const, skillId: "pdf" },
            ],
          },
        },
      },
      tools: {
        code_execution: anthropic.tools.codeExecution_20250825(),
      },
      stopWhen: stepCountIs(10),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Convert the attached file to a clean CSV format for numerical analysis.

Instructions:
1. Read the uploaded file (filename: ${file.name})
2. Find the main data table with numeric values
3. Extract headers and all rows
4. Output the CSV content directly to stdout using cat or print
5. After outputting CSV, print a brief summary on stderr: number of rows, columns, and column names

${langInstructions[locale] || langInstructions.en}

Use Python with pandas, openpyxl, or python-docx as needed.
IMPORTANT: Output ONLY the raw CSV content to stdout, nothing else.`,
            },
            {
              type: "file",
              data: base64Data,
              mediaType: mimeType,
            },
          ],
        },
      ],
    });

    // Extract CSV from the response
    let csvContent = "";
    let summary = "";

    // Check for code execution results in the steps
    for (const step of result.steps || []) {
      for (const toolResult of step.toolResults || []) {
        if (toolResult.toolName === "code_execution") {
          const execResult = toolResult as unknown as {
            result?: {
              type?: string;
              stdout?: string;
              stderr?: string;
            };
          };
          if (execResult?.result?.stdout) {
            csvContent = execResult.result.stdout;
          }
          if (execResult?.result?.stderr) {
            summary = execResult.result.stderr;
          }
        }
      }
    }

    // Also check the final text response for summary
    if (result.text && !summary) {
      summary = result.text;
    }

    if (csvContent) {
      return Response.json({
        csv: csvContent.trim(),
        summary: summary.trim(),
      });
    }

    return Response.json(
      { error: "Failed to extract CSV data", summary: result.text },
      { status: 500 }
    );
  } catch (error) {
    console.error("Extract data error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
