import React, { useState, useEffect } from "react";
import { I18nFolderState, TranslationRow } from "../../extension/types";
import { TableRow } from "./TableRow";

interface MatrixTableProps {
  folderState: I18nFolderState | null;
  rows: TranslationRow[];
  onCellChange: (key: string, langCode: string, value: string) => void;
  onDeleteKey: (key: string) => void;
  onRenameKey: (oldKey: string, newKey: string) => void;
}

export const MatrixTable: React.FC<MatrixTableProps> = ({
  folderState,
  rows,
  onCellChange,
  onDeleteKey,
  onRenameKey,
}) => {
  const [keyColWidth, setKeyColWidth] = useState(() => {
    try {
      const saved = localStorage.getItem("lozi_key_col_width");
      return saved ? Math.max(180, Math.min(600, Number(saved))) : 280;
    } catch {
      return 280;
    }
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = keyColWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(180, Math.min(600, startWidth + delta));
      setKeyColWidth(newWidth);
      try {
        localStorage.setItem("lozi_key_col_width", String(newWidth));
      } catch {
        // ignore
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  if (!folderState || folderState.languages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-70">
        <span className="text-4xl mb-3">🌐</span>
        <p className="text-base font-semibold">No i18n JSON files detected</p>
        <p className="text-sm text-base-content/60 mt-1">
          Add your first language file (e.g. <code>en.json</code>) using the
          button above.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto min-w-0 min-h-0">
      <table className="table table-pin-rows min-w-full w-max border-collapse">
        <thead>
          <tr className="bg-base-200 text-xs border-b border-base-100">
            <th
              style={{
                width: `${keyColWidth}px`,
                minWidth: `${keyColWidth}px`,
                maxWidth: `${keyColWidth}px`,
              }}
              className="relative group/th bg-base-200 sticky left-0 top-0 z-30 text-left font-semibold border-r border-base-200 select-none"
            >
              <div className="flex items-center justify-between pr-2">
                <span className="truncate">Translation Key</span>
              </div>
              {/* Drag to resize handle */}
              <div
                onMouseDown={handleMouseDown}
                title="Drag to resize column"
                className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/60 active:bg-primary z-40 transition-colors"
              />
            </th>
            {folderState.languages.map((lang, index) => (
              <th
                key={lang.code}
                className="min-w-[220px] text-left font-semibold bg-base-200 sticky top-0 z-20 last:pr-4"
              >
                <span className="mr-1">{lang.flag}</span>
                <span>{lang.label}</span>
                <span className="text-base-content/50 font-mono text-[10px] ml-1">
                  ({lang.filename})
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={folderState.languages.length + 1}
                className="text-center py-12 text-base-content/50"
              >
                No translation keys match your filter.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.key}
                row={row}
                languages={folderState.languages}
                keyColWidth={keyColWidth}
                onCellChange={onCellChange}
                onDeleteKey={onDeleteKey}
                onRenameKey={onRenameKey}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
