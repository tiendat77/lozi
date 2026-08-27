import React, { useState } from 'react';
import { I18nFolderState } from '../../extension/types';

interface AddKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderState: I18nFolderState | null;
  onAdd: (key: string, values: Record<string, string>) => void;
}

export const AddKeyModal: React.FC<AddKeyModalProps> = ({
  isOpen,
  onClose,
  folderState,
  onAdd,
}) => {
  const [keyName, setKeyName] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;
    onAdd(keyName.trim(), values);
    setKeyName('');
    setValues({});
    onClose();
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg bg-base-200 border border-base-100">
        <h3 className="font-bold text-lg mb-4">Add Translation Key</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label label-text font-medium">
              Key Name (supports dot notation, e.g. <code>auth.login.title</code>)
            </label>
            <input
              type="text"
              className="input input-bordered w-full bg-base-100 font-mono text-sm"
              placeholder="e.g. navigation.home"
              value={keyName}
              onChange={e => setKeyName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {folderState?.languages.map(lang => (
              <div key={lang.code}>
                <label className="label label-text text-xs text-base-content/70">
                  {lang.flag} {lang.label} ({lang.code})
                </label>
                <input
                  type="text"
                  className="input input-sm input-bordered w-full bg-base-100"
                  placeholder={`Value in ${lang.label}...`}
                  value={values[lang.code] || ''}
                  onChange={e =>
                    setValues(prev => ({ ...prev, [lang.code]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>

          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Key
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
