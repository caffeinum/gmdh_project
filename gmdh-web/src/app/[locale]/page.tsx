"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Papa from "papaparse";
import Markdown from "react-markdown";
import { GMDHRunner, type GMDHResults } from "~/components/GMDHRunner";
import { DataPreview } from "~/components/DataPreview";
import { AIPreprocessing } from "~/components/AIPreprocessing";
import { AIAlgorithmSelect } from "~/components/AIAlgorithmSelect";
import { AIAnalysis } from "~/components/AIAnalysis";
import { LanguageSwitcher } from "~/components/LanguageSwitcher";

type Step = "upload" | "extracting" | "preprocess" | "select-target" | "algorithm" | "run" | "results";

const SUPPORTED_EXTENSIONS = [".csv", ".xlsx", ".xls", ".docx", ".pdf"];

export default function Home() {
  const t = useTranslations();
  const locale = useLocale();
  const [data, setData] = useState<number[][] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [step, setStep] = useState<Step>("upload");
  const [results, setResults] = useState<GMDHResults | null>(null);
  const [extractionSummary, setExtractionSummary] = useState<string>("");

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
          setStep("preprocess");
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
    setStep("extracting");
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
      setStep("upload");
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

  const handleTargetSelect = (col: number | null) => {
    setTargetColumn(col);
    if (col !== null) {
      setStep("algorithm");
    }
  };

  const handleResults = (newResults: GMDHResults) => {
    setResults(newResults);
    setStep("results");
  };

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{t("home.title")}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t("home.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <a
              href={`/${locale}/agent`}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg"
            >
              {t("home.codingAgent")} →
            </a>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{t("upload.title")}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t("upload.supported")}: CSV, Excel (.xlsx, .xls), Word (.docx), PDF
        </p>
        <div className="flex gap-4 items-center mb-4">
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.docx,.pdf"
            onChange={handleFileUpload}
            disabled={step === "extracting"}
            className="flex-1 text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 dark:bg-gray-700 dark:border-gray-600 p-2 disabled:opacity-50"
          />
          <span className="text-gray-500">{t("upload.or")}</span>
          <button
            onClick={loadSampleDataset}
            disabled={step === "extracting"}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            {t("upload.loadSample")}
          </button>
        </div>

        {step === "extracting" && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-blue-600 dark:text-blue-400">
                {t("upload.extracting")}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {t("upload.extractingDesc")}
            </p>
          </div>
        )}

        {extractionSummary && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded text-sm prose prose-sm dark:prose-invert max-w-none">
            <Markdown>{extractionSummary}</Markdown>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
            {error}
          </div>
        )}
      </div>

      {data && headers.length > 0 && step !== "upload" && step !== "extracting" && (
        <DataPreview
          data={data}
          headers={headers}
          targetColumn={targetColumn}
          onTargetSelect={step === "select-target" ? handleTargetSelect : undefined}
        />
      )}

      {data && headers.length > 0 && step === "preprocess" && (
        <AIPreprocessing
          data={data}
          headers={headers}
          locale={locale}
          onComplete={() => setStep("select-target")}
        />
      )}

      {data && targetColumn !== null && step === "algorithm" && (
        <AIAlgorithmSelect
          data={data}
          headers={headers}
          targetColumn={targetColumn}
          locale={locale}
          onComplete={() => setStep("run")}
        />
      )}

      {data && targetColumn !== null && (step === "run" || step === "results") && (
        <GMDHRunner
          data={data}
          headers={headers}
          targetColumn={targetColumn}
          onResults={handleResults}
        />
      )}

      {results && targetColumn !== null && step === "results" && (
        <AIAnalysis
          results={results}
          targetName={headers[targetColumn]}
          features={headers.filter((_, idx) => idx !== targetColumn)}
          locale={locale}
        />
      )}
    </main>
  );
}
