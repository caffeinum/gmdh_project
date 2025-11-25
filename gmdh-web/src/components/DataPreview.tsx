"use client";

import { useTranslations } from "next-intl";

interface DataPreviewProps {
  data: number[][];
  headers: string[];
  targetColumn: number | null;
  onTargetSelect?: (col: number) => void;
}

export function DataPreview({
  data,
  headers,
  targetColumn,
  onTargetSelect,
}: DataPreviewProps) {
  const t = useTranslations("dataPreview");
  const isSelectable = !!onTargetSelect;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">
        {isSelectable ? t("selectTarget") : t("title")}
      </h2>

      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {data.length} {t("samples")} × {headers.length} {t("features")}
        </p>
      </div>

      {isSelectable && (
        <div className="mb-4 flex flex-wrap gap-2">
          {headers.map((header, idx) => (
            <button
              key={idx}
              onClick={() => onTargetSelect(idx)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                targetColumn === idx
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {header}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b dark:border-gray-700">
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-2 text-left font-medium ${
                    targetColumn === idx
                      ? "bg-blue-100 dark:bg-blue-900"
                      : ""
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 5).map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b dark:border-gray-700">
                {row.map((val, colIdx) => (
                  <td
                    key={colIdx}
                    className={`px-4 py-2 ${
                      targetColumn === colIdx
                        ? "bg-blue-50 dark:bg-blue-950"
                        : ""
                    } ${isNaN(val) ? "text-gray-400" : ""}`}
                  >
                    {isNaN(val) ? "—" : val.toFixed(3)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 5 && (
          <p className="text-xs text-gray-500 mt-2">
            {t("showingRows", { count: 5, total: data.length })}
          </p>
        )}
      </div>
    </div>
  );
}
