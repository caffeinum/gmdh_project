"use client";

import { useState } from "react";
import { useChat } from "ai/react";

interface AIAlgorithmSelectProps {
  data: number[][];
  headers: string[];
  targetColumn: number;
  onComplete: () => void;
}

export function AIAlgorithmSelect({
  data,
  headers,
  targetColumn,
  onComplete,
}: AIAlgorithmSelectProps) {
  const [analyzed, setAnalyzed] = useState(false);

  const features = headers.filter((_, idx) => idx !== targetColumn);

  const { messages, isLoading, error, reload } = useChat({
    api: "/api/ai/algorithm-select",
    body: {
      dataStats: {
        rows: data.length,
        columns: headers.length,
      },
      target: headers[targetColumn],
      features,
    },
    onFinish: () => {
      setAnalyzed(true);
    },
  });

  const handleAnalyze = () => {
    reload();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">
        3. ai algorithm selection
      </h2>

      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          target: <span className="font-semibold">{headers[targetColumn]}</span>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          features: {features.length} columns
        </p>
      </div>

      {!analyzed && (
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          {isLoading ? "analyzing..." : "get ai recommendation"}
        </button>
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
                className="p-4 bg-purple-50 dark:bg-gray-700 rounded-lg mb-4"
              >
                <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            ))}
        </div>
      )}

      {analyzed && (
        <button
          onClick={onComplete}
          className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
          continue to run analysis →
        </button>
      )}
    </div>
  );
}
