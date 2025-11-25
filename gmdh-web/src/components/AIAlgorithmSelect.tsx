"use client";

import { useState, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useTranslations } from "next-intl";
import Markdown from "react-markdown";

interface AIAlgorithmSelectProps {
  data: number[][];
  headers: string[];
  targetColumn: number;
  locale: string;
  onComplete: () => void;
}

export function AIAlgorithmSelect({
  data,
  headers,
  targetColumn,
  locale,
  onComplete,
}: AIAlgorithmSelectProps) {
  const t = useTranslations("algorithm");
  const tCommon = useTranslations("common");
  const [analyzed, setAnalyzed] = useState(false);

  const features = headers.filter((_, idx) => idx !== targetColumn);

  const transport = useMemo(
    () => new DefaultChatTransport({
      api: "/api/ai/algorithm-select",
      body: {
        dataStats: { rows: data.length, columns: headers.length },
        target: headers[targetColumn],
        features,
        locale,
      },
    }),
    [data, headers, targetColumn, features, locale]
  );

  const { messages, status, error, sendMessage } = useChat({ transport });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (status === "ready" && messages.length > 0) {
      setAnalyzed(true);
    }
  }, [status, messages.length]);

  const handleAnalyze = () => {
    sendMessage({ text: "recommend algorithm" });
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

      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("target")}: <span className="font-semibold">{headers[targetColumn]}</span>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("features")}: {features.length} {t("columns")}
        </p>
      </div>

      {!analyzed && !isLoading && messages.length === 0 && (
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          {t("getRecommendation")}
        </button>
      )}

      {isLoading && (
        <div className="text-purple-600 animate-pulse">{tCommon("analyzing")}</div>
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
                className="p-4 bg-purple-50 dark:bg-gray-700 rounded-lg mb-4 prose dark:prose-invert prose-sm max-w-none"
              >
                <Markdown>{getMessageText(message)}</Markdown>
              </div>
            ))}
        </div>
      )}

      {analyzed && (
        <button
          onClick={onComplete}
          className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
          {t("continue")} →
        </button>
      )}
    </div>
  );
}
