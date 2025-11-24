"use client";

import { useState } from "react";
import { runGMDH, PolynomialModel, GMDHLayer } from "~/lib/gmdh";
import { ModelResults } from "./ModelResults";

export interface GMDHResults {
  combinatorial: PolynomialModel[];
  multirow: GMDHLayer[];
  trainSize: number;
  validSize: number;
}

interface GMDHRunnerProps {
  data: number[][];
  headers: string[];
  targetColumn: number;
  onResults?: (results: GMDHResults) => void;
}

export function GMDHRunner({ data, headers, targetColumn, onResults }: GMDHRunnerProps) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<GMDHResults | null>(null);
  const [error, setError] = useState<string>("");

  const handleRun = async () => {
    setRunning(true);
    setError("");
    setResults(null);

    try {
      // run in next tick to allow UI to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = runGMDH(data, targetColumn, 0.7);
      setResults(result);
      onResults?.(result);
    } catch (err) {
      setError(`error running gmdh: ${err}`);
    } finally {
      setRunning(false);
    }
  };

  const featureHeaders = headers.filter((_, idx) => idx !== targetColumn);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">3. run gmdh analysis</h2>

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            target: <span className="font-semibold">{headers[targetColumn]}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            features: {featureHeaders.length} columns
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={running}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          {running ? "running..." : "run analysis"}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
            {error}
          </div>
        )}
      </div>

      {results && (
        <ModelResults
          results={results}
          headers={featureHeaders}
          targetName={headers[targetColumn]}
        />
      )}
    </>
  );
}
