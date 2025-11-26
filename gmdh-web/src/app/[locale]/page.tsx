"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Papa from "papaparse";
import Markdown from "react-markdown";
import { Tabs, TabList, Tab, TabPanel } from "~/components/Tabs";
import { DataPreview } from "~/components/DataPreview";
import { AIPreprocessing } from "~/components/AIPreprocessing";
import { AIAlgorithmSelect } from "~/components/AIAlgorithmSelect";
import { AIAnalysis } from "~/components/AIAnalysis";
import { LanguageSwitcher } from "~/components/LanguageSwitcher";
import { runGMDH, type GMDHResults, type GMDHAlgorithm } from "~/lib/gmdh";
import { ModelResults } from "~/components/ModelResults";

const SUPPORTED_EXTENSIONS = [".csv", ".xlsx", ".xls", ".docx", ".pdf"];

export default function Home() {
  const t = useTranslations();
  const locale = useLocale();
  const [data, setData] = useState<number[][] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [extracting, setExtracting] = useState(false);
  const [extractionSummary, setExtractionSummary] = useState<string>("");
  const [results, setResults] = useState<GMDHResults | null>(null);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("data");
  const [algorithm, setAlgorithm] = useState<GMDHAlgorithm>("both");

  const processCSVData = (csvText: string) => {
    Papa.parse(csvText, {
      complete: (results) => {
        try {
          const rawData = results.data as string[][];
          if (rawData.length < 2) {
            setError("File must have at least header row and one data row");
            return;
          }

          const allHeaders = rawData[0] || [];
          const dataRows = rawData.slice(1).filter((row) => row && row.length > 0);

          const numericCols: number[] = [];
          for (let col = 0; col < allHeaders.length; col++) {
            let validCount = 0;
            for (const row of dataRows) {
              const val = row[col];
              if (val !== undefined && val !== "" && !isNaN(parseFloat(val))) {
                validCount++;
              }
            }
            if (validCount / dataRows.length > 0.8) {
              numericCols.push(col);
            }
          }

          if (numericCols.length === 0) {
            setError("No numeric columns found");
            return;
          }

          const filteredHeaders = numericCols.map((col) => allHeaders[col]);
          const numericData: number[][] = [];

          for (const row of dataRows) {
            const numRow = numericCols.map((col) => {
              const val = row[col];
              return val !== undefined && val !== "" ? parseFloat(val) : NaN;
            });
            if (numRow.every((v) => !isNaN(v))) {
              numericData.push(numRow);
            }
          }

          if (numericData.length === 0) {
            setError("No complete numeric rows found");
            return;
          }

          setHeaders(filteredHeaders);
          setData(numericData);
          setError("");
          setTargetColumn(null);
          setResults(null);
        } catch (err) {
          setError(`Parsing error: ${err}`);
        }
      },
      error: (err: Error) => {
        setError(`CSV error: ${err.message}`);
      },
    });
  };

  const parseCSV = (file: File) => {
    file.text().then(processCSVData);
  };

  const extractDataWithAI = async (file: File) => {
    setExtracting(true);
    setError("");
    setExtractionSummary("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("locale", locale);

      const response = await fetch("/api/ai/extract-data", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to extract data");
      }

      if (result.summary) {
        setExtractionSummary(result.summary);
      }

      if (result.csv) {
        processCSVData(result.csv);
      } else {
        throw new Error("No CSV data returned");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));

    if (ext === ".csv") {
      parseCSV(file);
    } else if (SUPPORTED_EXTENSIONS.includes(ext)) {
      extractDataWithAI(file);
    } else {
      setError(`Unsupported file type. Supported: ${SUPPORTED_EXTENSIONS.join(", ")}`);
    }
  };

  const loadSampleDataset = async () => {
    try {
      const response = await fetch("/water_quality.csv");
      const text = await response.text();
      processCSVData(text);
    } catch (err) {
      setError(`Failed to load sample dataset: ${err}`);
    }
  };

  const handleRunAnalysis = async () => {
    if (targetColumn === null || !data) return;

    setRunning(true);
    setResults(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const result = runGMDH(data, targetColumn, 0.7, algorithm);
      setResults(result);
    } catch (err) {
      setError(`Error running GMDH: ${err}`);
    } finally {
      setRunning(false);
    }
  };

  const featureHeaders = headers.filter((_, idx) => idx !== targetColumn);
  const canAnalyze = data && targetColumn !== null;

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("home.title")}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t("home.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <a
            href={`/${locale}/agent`}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {t("home.codingAgent")} →
          </a>
        </div>
      </div>

      <Tabs activeTab={activeTab} onTabChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabList>
            <Tab id="data">📊 {t("tabs.data")}</Tab>
            <Tab id="analysis" disabled={!canAnalyze}>
              🔬 {t("tabs.analysis")}
            </Tab>
          </TabList>

          {canAnalyze && activeTab === "data" && (
            <button
              onClick={() => setActiveTab("analysis")}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {t("tabs.analysis")} →
            </button>
          )}
        </div>

        <TabPanel id="data">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="mb-6">
              <div className="flex gap-4 items-center">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.docx,.pdf"
                  onChange={handleFileUpload}
                  disabled={extracting}
                  className="flex-1 text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 dark:bg-gray-700 dark:border-gray-600 p-2 disabled:opacity-50"
                />
                <span className="text-gray-400 text-sm">{t("upload.or")}</span>
                <button
                  onClick={loadSampleDataset}
                  disabled={extracting}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                >
                  {t("upload.loadSample")}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {t("upload.supported")}: CSV, Excel, Word, PDF
              </p>
            </div>

            {extracting && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-blue-600 dark:text-blue-400 text-sm">
                    {t("upload.extracting")}
                  </span>
                </div>
              </div>
            )}

            {extractionSummary && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg text-sm mb-4 prose prose-sm dark:prose-invert max-w-none">
                <Markdown>{extractionSummary}</Markdown>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg mb-4">
                {error}
              </div>
            )}

            {data && headers.length > 0 && (
              <>
                <DataPreview
                  data={data}
                  headers={headers}
                  targetColumn={targetColumn}
                  onTargetSelect={setTargetColumn}
                />

                {targetColumn === null ? (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <span className="text-sm text-yellow-800 dark:text-yellow-200">
                      ↑ {t("dataPreview.selectTarget")}
                    </span>
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-green-800 dark:text-green-200">
                      ✓ {t("algorithm.target")}: <strong>{headers[targetColumn]}</strong> ({featureHeaders.length} {t("algorithm.features")})
                    </span>
                    <button
                      onClick={() => setActiveTab("analysis")}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
                    >
                      {t("tabs.analysis")} →
                    </button>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <AIPreprocessing
                    data={data}
                    headers={headers}
                    locale={locale}
                    compact
                  />
                </div>
              </>
            )}
          </div>
        </TabPanel>

        <TabPanel id="analysis">
          {data && targetColumn !== null && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("algorithm.target")}: <span className="font-semibold text-gray-900 dark:text-white">{headers[targetColumn]}</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {featureHeaders.length} {t("algorithm.features")}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 text-sm">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="algorithm"
                        value="both"
                        checked={algorithm === "both"}
                        onChange={(e) => setAlgorithm(e.target.value as GMDHAlgorithm)}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{t("algorithm.both")}</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="algorithm"
                        value="combinatorial"
                        checked={algorithm === "combinatorial"}
                        onChange={(e) => setAlgorithm(e.target.value as GMDHAlgorithm)}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{t("algorithm.combinatorial")}</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="algorithm"
                        value="multirow"
                        checked={algorithm === "multirow"}
                        onChange={(e) => setAlgorithm(e.target.value as GMDHAlgorithm)}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{t("algorithm.multirow")}</span>
                    </label>
                  </div>
                  <button
                    onClick={handleRunAnalysis}
                    disabled={running}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                  >
                    {running ? t("runner.running") : t("runner.runAnalysis")}
                  </button>
                </div>
              </div>

              <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <AIAlgorithmSelect
                  data={data}
                  headers={headers}
                  targetColumn={targetColumn}
                  locale={locale}
                  compact
                />
              </div>

              {results && (
                <>
                  <ModelResults
                    results={results}
                    headers={featureHeaders}
                    targetName={headers[targetColumn]}
                  />

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <AIAnalysis
                      results={results}
                      targetName={headers[targetColumn]}
                      features={featureHeaders}
                      locale={locale}
                      compact
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </TabPanel>
      </Tabs>
    </main>
  );
}
