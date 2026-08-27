import React, { useState } from 'react';
import { Copy, Trash2, Edit2, Check } from 'lucide-react';
import { LanguageFile, TranslationRow } from '../../extension/types';
import { useVsCodeApi } from '../hooks/useVsCodeApi';

interface TableRowProps {
  row: TranslationRow;
  languages: LanguageFile[];
  keyColWidth: number;
  onCellChange: (key: string, langCode: string, value: string) => void;
  onDeleteKey: (key: string) => void;
  onRenameKey: (oldKey: string, newKey: string) => void;
}

export const TableRow: React.FC<TableRowProps> = ({
  row,
  languages,
  keyColWidth,
  onCellChange,
  onDeleteKey,
  onRenameKey,
}) => {
  const vscode = useVsCodeApi();
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [tempKey, setTempKey] = useState(row.key);

  const handleCopy = () => {
    vscode.postMessage({
      type: 'COPY_TO_CLIPBOARD',
      payload: { text: row.key },
    });
  };

  const handleCommitRename = () => {
    if (tempKey.trim() && tempKey !== row.key) {
      onRenameKey(row.key, tempKey.trim());
    }
    setIsEditingKey(false);
  };

  return (
    <tr className="hover:bg-base-200/50 group border-b border-base-200">
      {/* Key Column */}
      <td
        style={{
          width: `${keyColWidth}px`,
          minWidth: `${keyColWidth}px`,
          maxWidth: `${keyColWidth}px`,
        }}
        className="p-2 align-top font-mono text-xs text-primary bg-base-300 sticky left-0 z-10 border-r border-base-200 overflow-hidden"
      >
        <div className="flex items-center justify-between gap-1 w-full min-w-0">
          {isEditingKey ? (
            <div className="flex items-center gap-1 w-full min-w-0">
              <input
                type="text"
                className="input input-xs input-bordered w-full font-mono bg-base-100 min-w-0"
                value={tempKey}
                onChange={e => setTempKey(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCommitRename();
                  if (e.key === 'Escape') setIsEditingKey(false);
                }}
                autoFocus
              />
              <button
                className="btn btn-xs btn-square btn-ghost text-success shrink-0"
                onClick={handleCommitRename}
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <>
              <span
                className="truncate select-text min-w-0 flex-1"
                title={row.key}
              >
                {row.key}
              </span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0 ml-1">
                <button
                  className="btn btn-ghost btn-xs btn-square"
                  onClick={handleCopy}
                  title="Copy Key"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  className="btn btn-ghost btn-xs btn-square"
                  onClick={() => {
                    setTempKey(row.key);
                    setIsEditingKey(true);
                  }}
                  title="Rename Key"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  className="btn btn-ghost btn-xs btn-square text-error"
                  onClick={() => onDeleteKey(row.key)}
                  title="Delete Key"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </>
          )}
        </div>
      </td>

      {/* Language Cells */}
      {languages.map((lang, index) => {
        const val = row.values[lang.code] || '';
        const isMissing = !val.trim();

        return (
          <td
            key={lang.code}
            className="p-1 min-w-[220px] align-top last:pr-4"
          >
            <textarea
              rows={1}
              value={val}
              onChange={e => onCellChange(row.key, lang.code, e.target.value)}
              placeholder={isMissing ? `[Missing in ${lang.code}]` : ''}
              className={`textarea textarea-xs w-full bg-base-100 leading-tight resize-y font-sans transition-colors ${
                isMissing
                  ? 'border-dashed border-error/50 placeholder:text-error/40'
                  : 'border-base-300 focus:border-primary'
              }`}
            />
          </td>
        );
      })}
    </tr>
  );
};
