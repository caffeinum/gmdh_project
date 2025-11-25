"use client";

import { useState, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useTranslations, useLocale } from "next-intl";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LanguageSwitcher } from "~/components/LanguageSwitcher";

export default function AgentPage() {
  const t = useTranslations("agent");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [input, setInput] = useState("");

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/ai/agent", body: { locale } }),
    [locale]
  );
  const { messages, sendMessage, status } = useChat({ transport });

  const isLoading = status === "streaming" || status === "submitted";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold">{t("title")}</h1>
          <LanguageSwitcher />
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          {t("subtitle")}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto">
          {messages.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-4">{t("empty.title")}</p>
              <div className="text-sm space-y-2">
                <p>• {t("empty.analyze")}</p>
                <p>• {t("empty.preprocess")}</p>
                <p>• {t("empty.implement")}</p>
                <p>• {t("empty.debug")}</p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-4 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-50 dark:bg-blue-900/20 ml-8"
                  : "bg-gray-50 dark:bg-gray-700 mr-8"
              }`}
            >
              <div className="font-semibold text-sm mb-1 text-gray-600 dark:text-gray-400">
                {message.role === "user" ? t("you") : t("assistant")}
              </div>
              <div className="prose dark:prose-invert prose-sm max-w-none">
                <Markdown remarkPlugins={[remarkGfm]}>
                  {message.parts
                    ?.filter((p) => p.type === "text")
                    .map((p) => (p as { type: "text"; text: string }).text)
                    .join("") || ""}
                </Markdown>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="text-center text-gray-500">
              <div className="inline-block animate-pulse">{t("thinking")}</div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("placeholder")}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {tCommon("send")}
          </button>
        </form>
      </div>

      <div className="text-center">
        <a
          href={`/${locale}`}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← {t("backToAnalysis")}
        </a>
      </div>
    </main>
  );
}
