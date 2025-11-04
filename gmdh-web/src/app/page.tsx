"use client";

import { useState } from "react";
import Papa from "papaparse";
import { GMDHRunner } from "~/components/GMDHRunner";
import { DataPreview } from "~/components/DataPreview";

export default function Home() {
  const [data, setData] = useState<number[][] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState<number | null>(null);
  const [error, setError] = useState<string>("");

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

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">gmdh analysis</h1>
        <p className="text-gray-600 dark:text-gray-400">
          upload csv dataset and run group method of data handling
        </p>
      </div>

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

      {data && headers.length > 0 && (
        <>
          <DataPreview
            data={data}
            headers={headers}
            targetColumn={targetColumn}
            onTargetSelect={setTargetColumn}
          />

          {targetColumn !== null && (
            <GMDHRunner
              data={data}
              headers={headers}
              targetColumn={targetColumn}
            />
          )}
        </>
      )}
    </main>
  );
}
