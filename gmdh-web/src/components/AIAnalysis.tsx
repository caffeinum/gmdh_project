"use client";

import { useChat } from "ai/react";
import type { GMDHResults } from "./GMDHRunner";

interface AIAnalysisProps {
  results: GMDHResults;
  targetName: string;
  features: string[];
}

export function AIAnalysis({ results, targetName, features }: AIAnalysisProps) {
  const { messages, isLoading, error, reload } = useChat({
    api: "/api/ai/analyze",
    body: {
      results,
      targetName,
      features,
    },
  });

  const handleAnalyze = () => {
    reload();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">ai results analysis</h2>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        let ai interpret your gmdh results and provide insights
      </p>

      <button
        onClick={handleAnalyze}
        disabled={isLoading}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
      >
        {isLoading ? "analyzing..." : "analyze results with ai"}
      </button>

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
                className="p-4 bg-indigo-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
