import { useState, useEffect, useCallback } from 'react';
import {
  ExtensionToWebviewMessage,
  I18nFolderState,
  TranslationRow,
  WebviewToExtensionMessage,
} from '../../extension/types';
import { useVsCodeApi } from './useVsCodeApi';

export function useI18nStore() {
  const vscode = useVsCodeApi();
  const [folderState, setFolderState] = useState<I18nFolderState | null>(null);
  const [rows, setRows] = useState<TranslationRow[]>([]);
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'missing' | 'unsaved'>('all');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<ExtensionToWebviewMessage>) => {
      const msg = event.data;
      switch (msg.type) {
        case 'INIT_DATA':
          setFolderState(msg.payload);
          setRows(msg.payload.rows);
          setDirtyKeys(new Set());
          break;
        case 'SAVE_SUCCESS':
          setIsSaving(false);
          setDirtyKeys(new Set());
          break;
        case 'SAVE_ERROR':
          setIsSaving(false);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    vscode.postMessage({ type: 'READY' } as WebviewToExtensionMessage);

    return () => window.removeEventListener('message', handleMessage);
  }, [vscode]);

  const updateCellValue = useCallback((key: string, langCode: string, value: string) => {
    setRows(prevRows =>
      prevRows.map(row => {
        if (row.key === key) {
          return {
            ...row,
            values: { ...row.values, [langCode]: value },
          };
        }
        return row;
      })
    );
    setDirtyKeys(prev => new Set(prev).add(key));
  }, []);

  const addKey = useCallback((newKey: string, initialValues: Record<string, string> = {}) => {
    const trimmed = newKey.trim();
    if (!trimmed) return;
    setRows(prev => {
      if (prev.some(r => r.key === trimmed)) return prev;
      const newRow: TranslationRow = {
        key: trimmed,
        values: folderState?.languages.reduce((acc, lang) => {
          acc[lang.code] = initialValues[lang.code] || '';
          return acc;
        }, {} as Record<string, string>) || {},
      };
      return [newRow, ...prev];
    });
    setDirtyKeys(prev => new Set(prev).add(trimmed));
  }, [folderState]);

  const deleteKey = useCallback((key: string) => {
    setRows(prev => prev.filter(r => r.key !== key));
    setDirtyKeys(prev => new Set(prev).add(key));
  }, []);

  const renameKey = useCallback((oldKey: string, newKey: string) => {
    const trimmed = newKey.trim();
    if (!trimmed || oldKey === trimmed) return;
    setRows(prev =>
      prev.map(r => (r.key === oldKey ? { ...r, key: trimmed } : r))
    );
    setDirtyKeys(prev => {
      const next = new Set(prev);
      next.delete(oldKey);
      next.add(trimmed);
      return next;
    });
  }, []);

  const saveChanges = useCallback(() => {
    if (dirtyKeys.size === 0) return;
    setIsSaving(true);
    vscode.postMessage({
      type: 'SAVE_REQUEST',
      payload: { rows },
    } as WebviewToExtensionMessage);
  }, [dirtyKeys, rows, vscode]);

  const filteredRows = rows.filter(row => {
    const matchesSearch =
      row.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      Object.values(row.values).some(v =>
        v.toLowerCase().includes(searchQuery.toLowerCase())
      );

    if (!matchesSearch) return false;

    if (filterMode === 'missing') {
      return (
        folderState?.languages.some(lang => !row.values[lang.code]?.trim()) ??
        false
      );
    }
    if (filterMode === 'unsaved') {
      return dirtyKeys.has(row.key);
    }
    return true;
  });

  return {
    folderState,
    rows: filteredRows,
    totalCount: rows.length,
    dirtyCount: dirtyKeys.size,
    isSaving,
    searchQuery,
    setSearchQuery,
    filterMode,
    setFilterMode,
    updateCellValue,
    addKey,
    deleteKey,
    renameKey,
    saveChanges,
  };
}
