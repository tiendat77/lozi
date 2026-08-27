import React from 'react';
import { Search, Plus, Globe, Save, AlertCircle } from 'lucide-react';
import { I18nFolderState } from '../../extension/types';

interface ToolbarProps {
  folderState: I18nFolderState | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterMode: 'all' | 'missing' | 'unsaved';
  onFilterChange: (mode: 'all' | 'missing' | 'unsaved') => void;
  dirtyCount: number;
  totalCount: number;
  isSaving: boolean;
  onSave: () => void;
  onOpenAddKeyModal: () => void;
  onOpenAddLangModal: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  folderState,
  searchQuery,
  onSearchChange,
  filterMode,
  onFilterChange,
  dirtyCount,
  totalCount,
  isSaving,
  onSave,
  onOpenAddKeyModal,
  onOpenAddLangModal,
}) => {
  return (
    <header className="bg-base-200 border-b border-base-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-3">
        <div className="font-semibold text-sm flex items-center gap-2">
          <span className="text-primary font-mono text-base">📁</span>
          <span>{folderState?.folderName || 'Loading...'}</span>
          <span className="badge badge-sm badge-neutral">
            {folderState?.languages.length || 0} languages
          </span>
        </div>

        <div className="join">
          <button
            className={`btn btn-xs join-item ${
              filterMode === 'all' ? 'btn-primary' : 'btn-ghost'
            }`}
            onClick={() => onFilterChange('all')}
          >
            All ({totalCount})
          </button>
          <button
            className={`btn btn-xs join-item ${
              filterMode === 'missing' ? 'btn-warning' : 'btn-ghost'
            }`}
            onClick={() => onFilterChange('missing')}
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Missing
          </button>
          <button
            className={`btn btn-xs join-item ${
              filterMode === 'unsaved' ? 'btn-info' : 'btn-ghost'
            }`}
            onClick={() => onFilterChange('unsaved')}
          >
            Unsaved ({dirtyCount})
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
          <input
            type="text"
            placeholder="Search keys or translations..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="input input-sm input-bordered pl-9 w-64 bg-base-100"
          />
        </div>

        <button
          className="btn btn-sm btn-outline gap-1"
          onClick={onOpenAddKeyModal}
        >
          <Plus className="w-4 h-4" /> Add Key
        </button>

        <button
          className="btn btn-sm btn-outline gap-1"
          onClick={onOpenAddLangModal}
        >
          <Globe className="w-4 h-4" /> Add Language
        </button>

        <button
          className={`btn btn-sm ${
            dirtyCount > 0 ? 'btn-success' : 'btn-disabled opacity-50'
          } gap-1`}
          onClick={onSave}
          disabled={dirtyCount === 0 || isSaving}
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : `Save (${dirtyCount})`}
        </button>
      </div>
    </header>
  );
};
