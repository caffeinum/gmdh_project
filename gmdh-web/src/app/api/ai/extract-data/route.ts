import Anthropic from "@anthropic-ai/sdk";
import type { Beta } from "@anthropic-ai/sdk/resources/beta/beta";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const runtime = "nodejs";
export const maxDuration = 60;

const langInstructions: Record<string, string> = {
  en: "Respond in English.",
  ru: "Отвечай на русском языке.",
  uk: "Відповідай українською мовою.",
};

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const locale = (formData.get("locale") as string) || "en";

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // upload file to anthropic files api
    const uploadedFile = await anthropic.beta.files.upload({
      file: new File([fileBuffer], file.name, { type: file.type }),
    });

    // use code execution to convert to csv
    const response = await anthropic.beta.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 16384,
      betas: ["code-execution-2025-08-25", "files-api-2025-04-14"],
      tools: [
        {
          type: "code_execution_20250825",
          name: "code_execution",
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Convert this file to a clean CSV format for numerical analysis.

Instructions:
1. Read the uploaded file (it could be xlsx, xls, docx, or other format)
2. Find the main data table with numeric values
3. Extract headers and all rows
4. Save as /tmp/output.csv with proper CSV formatting
5. Print summary: number of rows, columns, and column names

${langInstructions[locale] || langInstructions.en}

Use Python with pandas, openpyxl, or python-docx as needed.`,
            },
            {
              type: "container_upload",
              file_id: uploadedFile.id,
            },
          ],
        },
      ],
    });

    let summary = "";
    let csvFileId: string | null = null;

    // extract file_id from bash_code_execution_output blocks
    for (const block of response.content) {
      if (block.type === "text") {
        summary = block.text;
      }

      // check for output files
      if (block.type === "bash_code_execution_tool_result") {
        const resultBlock = block as Beta.Messages.BetaBashCodeExecutionToolResultBlock;

        // content can be result or error
        if (resultBlock.content.type === "bash_code_execution_result") {
          const result = resultBlock.content as Beta.Messages.BetaBashCodeExecutionResultBlock;
          // check for output files in content array
          if (result.content && result.content.length > 0) {
            for (const outputBlock of result.content) {
              if (outputBlock.type === "bash_code_execution_output" && outputBlock.file_id) {
                const metadata = await anthropic.beta.files.retrieveMetadata(outputBlock.file_id);
                if (metadata.filename?.endsWith(".csv")) {
                  csvFileId = outputBlock.file_id;
                  break;
                }
              }
            }
          }
        }
      }
    }

    // download csv file if found
    if (csvFileId) {
      const fileResponse = await anthropic.beta.files.download(csvFileId);
      const csvContent = await fileResponse.text();

      return Response.json({
        csv: csvContent.trim(),
        summary: summary.trim(),
      });
    }

    // fallback: try to get csv from container if no output file found
    const responseWithContainer = response as typeof response & { container?: { id: string } };
    if (responseWithContainer.container?.id) {
      const readResponse = await anthropic.beta.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 8192,
        betas: ["code-execution-2025-08-25"],
        container: responseWithContainer.container.id,
        tools: [
          {
            type: "code_execution_20250825",
            name: "code_execution",
          },
        ],
        messages: [
          {
            role: "user",
            content: "cat /tmp/output.csv",
          },
        ],
      });

      for (const block of readResponse.content) {
        if (block.type === "bash_code_execution_tool_result") {
          const resultBlock = block as Beta.Messages.BetaBashCodeExecutionToolResultBlock;
          if (resultBlock.content.type === "bash_code_execution_result") {
            const result = resultBlock.content as Beta.Messages.BetaBashCodeExecutionResultBlock;
            if (result.stdout) {
              return Response.json({
                csv: result.stdout.trim(),
                summary: summary.trim(),
              });
            }
          }
        }
      }
    }

    return Response.json(
      { error: "Failed to extract CSV data", summary },
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
