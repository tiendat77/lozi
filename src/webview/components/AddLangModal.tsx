import React, { useState } from 'react';
import { useVsCodeApi } from '../hooks/useVsCodeApi';

interface AddLangModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddLangModal: React.FC<AddLangModalProps> = ({ isOpen, onClose }) => {
  const vscode = useVsCodeApi();
  const [langCode, setLangCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = langCode.trim().toLowerCase();
    if (!code) return;
    vscode.postMessage({
      type: 'ADD_LANGUAGE_REQUEST',
      payload: { langCode: code, filename: `${code}.json` },
    });
    setLangCode('');
    onClose();
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-sm bg-base-200 border border-base-100">
        <h3 className="font-bold text-lg mb-3">Add New Language</h3>
        <form onSubmit={handleSubmit}>
          <label className="label label-text">
            Language Code (e.g. <code>fr</code>, <code>de</code>, <code>es</code>, <code>zh-CN</code>)
          </label>
          <input
            type="text"
            className="input input-bordered w-full bg-base-100 mb-4 font-mono text-sm"
            placeholder="e.g. fr"
            value={langCode}
            onChange={e => setLangCode(e.target.value)}
            autoFocus
            required
          />
          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create File
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
