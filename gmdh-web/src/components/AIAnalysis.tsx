"use client";

import { useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useTranslations } from "next-intl";
import Markdown from "react-markdown";
import type { GMDHResults } from "./GMDHRunner";

interface AIAnalysisProps {
  results: GMDHResults;
  targetName: string;
  features: string[];
  locale: string;
}

export function AIAnalysis({ results, targetName, features, locale }: AIAnalysisProps) {
  const t = useTranslations("analysis");
  const tCommon = useTranslations("common");

  const transport = useMemo(
    () => new DefaultChatTransport({
      api: "/api/ai/analyze",
      body: { results, targetName, features, locale },
    }),
    [results, targetName, features, locale]
  );

  const { messages, status, error, sendMessage } = useChat({ transport });

  const isLoading = status === "streaming" || status === "submitted";

  const handleAnalyze = () => {
    sendMessage({ text: "analyze these results" });
  };

  const getMessageText = (message: typeof messages[0]) => {
    return message.parts
      ?.filter((p) => p.type === "text")
      .map((p) => (p as { type: "text"; text: string }).text)
      .join("") || "";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">{t("title")}</h2>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {t("description")}
      </p>

      {messages.length === 0 && !isLoading && (
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          {t("analyze")}
        </button>
      )}

      {isLoading && (
        <div className="text-indigo-600 animate-pulse">{tCommon("analyzing")}</div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
          {tCommon("error")}: {error.message}
        </div>
      )}

      {messages.length > 0 && (
        <div className="mt-4">
          {messages
            .filter((m) => m.role === "assistant")
            .map((message, i) => (
              <div
                key={i}
                className="p-4 bg-indigo-50 dark:bg-gray-700 rounded-lg prose dark:prose-invert prose-sm max-w-none"
              >
                <Markdown>{getMessageText(message)}</Markdown>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
