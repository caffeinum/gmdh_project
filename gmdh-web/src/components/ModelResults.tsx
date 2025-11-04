import { PolynomialModel, GMDHLayer } from "~/lib/gmdh";

interface ModelResultsProps {
  results: {
    combinatorial: PolynomialModel[];
    multirow: GMDHLayer[];
    trainSize: number;
    validSize: number;
  };
  headers: string[];
  targetName: string;
}

function ModelCard({
  model,
  headers,
  targetName,
  rank,
}: {
  model: PolynomialModel;
  headers: string[];
  targetName: string;
  rank?: number;
}) {
  const f1 = headers[model.feature1] || `f${model.feature1}`;
  const f2 = headers[model.feature2] || `f${model.feature2}`;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      {rank && (
        <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
          #{rank}
        </div>
      )}
      
      <div className="mb-3">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          features: {f1}, {f2}
        </div>
        <div className="text-xs font-mono bg-white dark:bg-gray-800 p-2 rounded overflow-x-auto">
          {targetName} = {model.coeffs[0].toFixed(4)} + {model.coeffs[1].toFixed(4)}·x₁ +{" "}
          {model.coeffs[2].toFixed(4)}·x₂ + {model.coeffs[3].toFixed(4)}·x₁² +{" "}
          {model.coeffs[4].toFixed(4)}·x₂² + {model.coeffs[5].toFixed(4)}·x₁·x₂
        </div>
      </div>

      <div className="flex gap-4 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">rmse:</span>{" "}
          <span className="font-semibold">{model.error.toFixed(4)}</span>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">r²:</span>{" "}
          <span className="font-semibold">{model.r2.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
}

export function ModelResults({ results, headers, targetName }: ModelResultsProps) {
  const bestMultirowModel =
    results.multirow[0]?.models[0] ||
    results.multirow[1]?.models[0] ||
    results.multirow[2]?.models[0];

  return (
    <div className="space-y-6">
      {/* summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">results summary</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">training samples</div>
            <div className="text-2xl font-bold">{results.trainSize}</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">validation samples</div>
            <div className="text-2xl font-bold">{results.validSize}</div>
          </div>
        </div>

        {bestMultirowModel && (
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
            <div className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
              best overall model (multi-row)
            </div>
            <div className="flex gap-6">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">rmse:</span>{" "}
                <span className="text-lg font-bold">{bestMultirowModel.error.toFixed(4)}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">r²:</span>{" "}
                <span className="text-lg font-bold">{bestMultirowModel.r2.toFixed(4)}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">variance explained:</span>{" "}
                <span className="text-lg font-bold">
                  {(bestMultirowModel.r2 * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* combinatorial results */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          combinatorial gmdh - top {results.combinatorial.length} models
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          exhaustive one-shot search through all feature pairs
        </p>
        
        <div className="grid gap-4 md:grid-cols-2">
          {results.combinatorial.slice(0, 6).map((model, idx) => (
            <ModelCard
              key={idx}
              model={model}
              headers={headers}
              targetName={targetName}
              rank={idx + 1}
            />
          ))}
        </div>
      </div>

      {/* multi-row results */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          multi-row gmdh - {results.multirow.length} layers
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          evolutionary layers breeding better features from winners
        </p>

        {results.multirow.map((layer, layerIdx) => (
          <div key={layerIdx} className="mb-6">
            <h3 className="text-lg font-semibold mb-3">
              layer {layer.layer} - top {layer.models.length} models
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              {layer.models.slice(0, 3).map((model, modelIdx) => (
                <ModelCard
                  key={modelIdx}
                  model={model}
                  headers={
                    layer.layer === 0
                      ? headers
                      : Array(model.feature1 + 1)
                          .fill(0)
                          .map((_, i) => `derived_${i}`)
                  }
                  targetName={targetName}
                  rank={modelIdx + 1}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* export */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">export results</h2>
        
        <button
          onClick={() => {
            const json = JSON.stringify(results, null, 2);
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "gmdh-results.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          download json
        </button>
      </div>
    </div>
  );
}
