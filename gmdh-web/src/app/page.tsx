"use client";

import { useState } from "react";
import Papa from "papaparse";
import { GMDHRunner, type GMDHResults } from "~/components/GMDHRunner";
import { DataPreview } from "~/components/DataPreview";
import { AIPreprocessing } from "~/components/AIPreprocessing";
import { AIAlgorithmSelect } from "~/components/AIAlgorithmSelect";
import { AIAnalysis } from "~/components/AIAnalysis";

type Step = "upload" | "preprocess" | "select-target" | "algorithm" | "run" | "results";

export default function Home() {
  const [data, setData] = useState<number[][] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [step, setStep] = useState<Step>("upload");
  const [results, setResults] = useState<GMDHResults | null>(null);

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      complete: (results) => {
        try {
          const rawData = results.data as string[][];
          if (rawData.length < 2) {
            setError("file must have at least header row and one data row");
            return;
          }

          // extract headers
          const header = rawData[0] || [];
          setHeaders(header);

          // parse numeric data
          const numericData: number[][] = [];
          for (let i = 1; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row || row.length === 0) continue;

            const numRow = row.map((val) => {
              const num = parseFloat(val);
              return isNaN(num) ? NaN : num;
            });

            if (numRow.some((v) => !isNaN(v))) {
              numericData.push(numRow);
            }
          }

          if (numericData.length === 0) {
            setError("no valid numeric data found");
            return;
          }

          setData(numericData);
          setError("");
          setTargetColumn(null);
          setStep("preprocess");
        } catch (err) {
          setError(`parsing error: ${err}`);
        }
      },
      error: (err) => {
        setError(`csv error: ${err.message}`);
      },
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    parseCSV(file);
  };

  const loadSampleDataset = async () => {
    try {
      const response = await fetch("/water_quality.csv");
      const text = await response.text();
      const blob = new Blob([text], { type: "text/csv" });
      const file = new File([blob], "water_quality.csv", { type: "text/csv" });
      parseCSV(file);
    } catch (err) {
      setError(`failed to load sample dataset: ${err}`);
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
            <h1 className="text-4xl font-bold mb-2">gmdh analysis with ai</h1>
            <p className="text-gray-600 dark:text-gray-400">
              ai-powered data preprocessing, algorithm selection, and results analysis
            </p>
          </div>
          <a
            href="/agent"
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg"
          >
            coding agent →
          </a>
        </div>
      </div>

      {/* step 1: upload */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">1. upload csv file</h2>
        <div className="flex gap-4 items-center mb-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="flex-1 text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 dark:bg-gray-700 dark:border-gray-600 p-2"
          />
          <span className="text-gray-500">or</span>
          <button
            onClick={loadSampleDataset}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            load sample dataset
          </button>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
            {error}
          </div>
        )}
      </div>

      {/* step 2: ai preprocessing */}
      {data && headers.length > 0 && step === "preprocess" && (
        <AIPreprocessing
          data={data}
          headers={headers}
          onComplete={() => setStep("select-target")}
        />
      )}

      {/* step 3: select target column */}
      {data && headers.length > 0 && (step === "select-target" || step === "algorithm" || step === "run" || step === "results") && (
        <DataPreview
          data={data}
          headers={headers}
          targetColumn={targetColumn}
          onTargetSelect={handleTargetSelect}
        />
      )}

      {/* step 4: ai algorithm selection */}
      {data && targetColumn !== null && step === "algorithm" && (
        <AIAlgorithmSelect
          data={data}
          headers={headers}
          targetColumn={targetColumn}
          onComplete={() => setStep("run")}
        />
      )}

      {/* step 5: run gmdh */}
      {data && targetColumn !== null && (step === "run" || step === "results") && (
        <GMDHRunner
          data={data}
          headers={headers}
          targetColumn={targetColumn}
          onResults={handleResults}
        />
      )}

      {/* step 6: ai analysis */}
      {results && targetColumn !== null && step === "results" && (
        <AIAnalysis
          results={results}
          targetName={headers[targetColumn]}
          features={headers.filter((_, idx) => idx !== targetColumn)}
        />
      )}
    </main>
  );
}
