"use client";

import { useState, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useTranslations } from "next-intl";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AIPreprocessingProps {
  data: number[][];
  headers: string[];
  locale: string;
  onComplete?: () => void;
  compact?: boolean;
}

export function AIPreprocessing({
  data,
  headers,
  locale,
  onComplete,
  compact = false,
}: AIPreprocessingProps) {
  const t = useTranslations("preprocessing");
  const tCommon = useTranslations("common");
  const [analyzed, setAnalyzed] = useState(false);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/ai/preprocess", body: { data, headers, locale } }),
    [data, headers, locale]
  );

  const { messages, status, error, sendMessage } = useChat({ transport });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (status === "ready" && messages.length > 0) {
      setAnalyzed(true);
    }
  }, [status, messages.length]);

  const handleAnalyze = () => {
    sendMessage({ text: "analyze this dataset" });
  };

  const getMessageText = (message: typeof messages[0]) => {
    return message.parts
      ?.filter((p) => p.type === "text")
      .map((p) => (p as { type: "text"; text: string }).text)
      .join("") || "";
  };

  const content = (
    <>
      {!compact && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t("description")}
        </p>
      )}

      {!analyzed && !isLoading && messages.length === 0 && (
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {t("analyze")}
        </button>
      )}

      {isLoading && (
        <div className="text-blue-600 animate-pulse text-sm">{tCommon("analyzing")}</div>
      )}

      {error && (
        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-sm">
          {tCommon("error")}: {error.message}
        </div>
      )}

      {messages.length > 0 && (
        <div className={compact ? "" : "mt-4"}>
          {messages
            .filter((m) => m.role === "assistant")
            .map((message, i) => (
              <div
                key={i}
                className={`prose dark:prose-invert prose-sm max-w-none ${compact ? "" : "p-3 bg-blue-50 dark:bg-gray-700 rounded-lg mb-2"}`}
              >
                <Markdown remarkPlugins={[remarkGfm]}>{getMessageText(message)}</Markdown>
              </div>
            ))}
        </div>
      )}

      {analyzed && onComplete && (
        <button
          onClick={onComplete}
          className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {t("continue")} →
        </button>
      )}
    </>
  );

  if (compact) {
    return <div>{content}</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">{t("title")}</h2>
      {content}
    </div>
  );
}
