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

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {data.length} {t("samples")} × {headers.length} {t("features")}
        </span>
        {onTargetSelect && (
          <span className="text-xs text-gray-500">
            {t("selectTarget")}
          </span>
        )}
      </div>

      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  onClick={() => onTargetSelect?.(idx)}
                  className={`px-4 py-3 text-left font-medium border-b dark:border-gray-700 ${
                    onTargetSelect ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" : ""
                  } ${
                    targetColumn === idx
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                      : ""
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {header}
                    {targetColumn === idx && (
                      <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">
                        target
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 5).map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b dark:border-gray-700 last:border-b-0">
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
      </div>
      {data.length > 5 && (
        <p className="text-xs text-gray-500 mt-2">
          {t("showingRows", { count: 5, total: data.length })}
        </p>
      )}
    </div>
  );
}
