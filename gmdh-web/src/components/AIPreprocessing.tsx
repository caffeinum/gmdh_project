"use client";

import { useState, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Markdown from "react-markdown";

interface AIPreprocessingProps {
  data: number[][];
  headers: string[];
  onComplete: () => void;
}

export function AIPreprocessing({
  data,
  headers,
  onComplete,
}: AIPreprocessingProps) {
  const [analyzed, setAnalyzed] = useState(false);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/ai/preprocess", body: { data, headers } }),
    [data, headers]
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">
        2. ai data preprocessing
      </h2>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        let ai analyze your data and suggest preprocessing steps
      </p>

      {!analyzed && !isLoading && messages.length === 0 && (
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          analyze data
        </button>
      )}

      {isLoading && (
        <div className="text-blue-600 animate-pulse">analyzing...</div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
          error: {error.message}
        </div>
      )}

      {messages.length > 0 && (
        <div className="mt-4">
          {messages
            .filter((m) => m.role === "assistant")
            .map((message, i) => (
              <div
                key={i}
                className="p-4 bg-blue-50 dark:bg-gray-700 rounded-lg mb-4"
              >
                <Markdown className="prose dark:prose-invert prose-sm max-w-none">
                  {getMessageText(message)}
                </Markdown>
              </div>
            ))}
        </div>
      )}

      {analyzed && (
        <button
          onClick={onComplete}
          className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
          continue to algorithm selection →
        </button>
      )}
    </div>
  );
}
