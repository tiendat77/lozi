import React, { useState, useEffect } from 'react';
import { useI18nStore } from './hooks/useI18nStore';
import { Toolbar } from './components/Toolbar';
import { MatrixTable } from './components/MatrixTable';
import { AddKeyModal } from './components/AddKeyModal';
import { AddLangModal } from './components/AddLangModal';

export const App: React.FC = () => {
  const {
    folderState,
    rows,
    totalCount,
    dirtyCount,
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
  } = useI18nStore();

  const [isAddKeyOpen, setIsAddKeyOpen] = useState(false);
  const [isAddLangOpen, setIsAddLangOpen] = useState(false);

  // Keyboard shortcut: Cmd+S / Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveChanges();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveChanges]);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-base-300 text-base-content text-sm">
      <Toolbar
        folderState={folderState}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterMode={filterMode}
        onFilterChange={setFilterMode}
        dirtyCount={dirtyCount}
        totalCount={totalCount}
        isSaving={isSaving}
        onSave={saveChanges}
        onOpenAddKeyModal={() => setIsAddKeyOpen(true)}
        onOpenAddLangModal={() => setIsAddLangOpen(true)}
      />

      <MatrixTable
        folderState={folderState}
        rows={rows}
        onCellChange={updateCellValue}
        onDeleteKey={deleteKey}
        onRenameKey={renameKey}
      />

      <AddKeyModal
        isOpen={isAddKeyOpen}
        onClose={() => setIsAddKeyOpen(false)}
        folderState={folderState}
        onAdd={addKey}
      />

      <AddLangModal
        isOpen={isAddLangOpen}
        onClose={() => setIsAddLangOpen(false)}
      />
    </div>
  );
};
