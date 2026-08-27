# VS Code i18n JSON Manager Extension Design Document

**Date:** 2026-08-27
**Status:** Approved
**Topic:** VS Code Extension for Managing i18n JSON Files

---

## 1. Overview & Objectives

The **VS Code i18n JSON Manager** extension simplifies internationalization workflows by providing an intuitive, spreadsheet-like **Translation Matrix** webview. Developers can open any folder containing language JSON files (e.g. `en.json`, `vi.json`, `ja.json`) and manage translations, add/delete keys, detect missing translations, and edit language values with automatic structure preservation (nested or flat JSON).

### Key Goals:
- **Folder-based Workflow**: Open any folder containing i18n JSON files via Explorer context menu or Command Palette.
- **Auto-detection**: Automatically detect languages from filenames (e.g. `en.json`, `messages.vi.json`, `zh-CN.json`).
- **Translation Matrix View**: A high-performance table where rows are translation keys and columns are languages.
- **Format Preservation**: Support both deeply nested JSON and flat dot-notation JSON files without altering the developer's original indentation or structure.
- **Visual Clarity**: Highlight missing translations and modified dirty states clearly with a modern daisyUI & TailwindCSS interface styled to match VS Code native themes.
- **Safe Editing & Sync**: Explicit `Cmd+S` saving, dirty indicator badge, and external file watching.

---

## 2. User Experience & Workflows

### 2.1 Opening the i18n Manager
1. **Explorer Context Menu**: Right-click any folder in VS Code File Explorer → select **"Open with i18n Manager"** (`lozi.openFolder`).
2. **Command Palette**: Run `i18n: Manage Translations in Folder...` (`Cmd+Shift+P`), choose from workspace folders or recently detected translation folders (`locales/`, `i18n/`, `dictionaries/`, `messages/`).

### 2.2 Translation Matrix Interface
The webview opens as an editor tab containing:
1. **Header Toolbar**:
   - **Folder Path & Stats**: Displays current folder name and language count (e.g. `src/dictionaries (en, vi, ja)`).
   - **Search Input**: Live debounce search filtering by key name or translated value across any column.
   - **Filter Pills**: `All Keys (142)`, `⚠️ Missing Only (5)`, `📝 Unsaved (2)`.
   - **Add Key Button**: Opens a modal to input key name (e.g. `auth.login.title`) and initial values.
   - **Add Language Button**: Prompts for language code (e.g. `fr`), creates `fr.json` in the folder, and adds a column.
   - **Save Button (`Cmd+S`)**: Badged with unsaved change count; triggers batch save to disk.
2. **Matrix Data Grid**:
   - **Sticky Headers**: Fixed language column headers with flags and code labels.
   - **Key Column**: Shows dot-notation key path with hover actions (📋 Copy Key, ✏️ Rename Key, 🗑️ Delete Key).
   - **Language Cells**:
     - Inline text editing with auto-resize.
     - **Missing Value**: Outlined in red/amber with placeholder `[Missing translation]`.
     - **Modified Value**: Highlighted with indicator badge showing unsaved change.
   - **Keyboard Navigation**: `Tab` / `Shift+Tab` to traverse cells horizontally, `Enter` / `Esc` to commit/blur.

---

## 3. Architecture & Tech Stack

### 3.1 Dual-Build Monorepo Structure
- **Extension Host**: Built with TypeScript + Node.js APIs, bundled with `esbuild`. Handles VS Code commands, file system reads/writes, language detection, and file system watchers.
- **Webview UI**: Built with React + TailwindCSS + daisyUI, bundled with Vite into a single client distribution loaded into `vscode.WebviewPanel`.

```
loz/
├── package.json               # VS Code extension manifest & npm scripts
├── tsconfig.json              # Extension host TS configuration
├── tsconfig.webview.json      # React Webview TS configuration
├── vite.config.ts             # Webview bundler (React + Tailwind + daisyUI)
├── esbuild.js                 # Extension host bundler
├── tailwind.config.js         # Tailwind configuration with daisyUI plugin
├── src/
│   ├── extension/             # Extension Host (Node / VS Code APIs)
│   │   ├── extension.ts       # Activation & command registration
│   │   ├── i18nManagerPanel.ts# WebviewPanel controller & message router
│   │   ├── parser/
│   │   │   ├── jsonParser.ts  # Flatten/unflatten, nested structure detector
│   │   │   └── langDetector.ts# Filename-to-language parser & flag mappings
│   │   ├── fileService.ts     # Folder scanner, JSON reader/writer, file watcher
│   │   └── types.ts           # Shared data contracts & RPC types
│   └── webview/               # Webview UI (React + daisyUI)
│       ├── index.html         # Webview entry HTML
│       ├── main.tsx           # React entry point
│       ├── App.tsx            # Main application layout
│       ├── components/
│       │   ├── Toolbar.tsx    # Search, filters, add key/lang, save
│       │   ├── MatrixTable.tsx# Table grid with sticky headers & key column
│       │   ├── TableRow.tsx   # Key row & language input cells
│       │   ├── AddKeyModal.tsx# Modal to create keys
│       │   ├── AddLangModal.tsx# Modal to create language files
│       │   └── DeleteConfirmModal.tsx
│       ├── hooks/
│       │   ├── useI18nStore.ts# State management (rows, languages, dirty map)
│       │   └── useVsCodeApi.ts# Bridge to acquireVsCodeApi() & postMessage
│       └── styles/
│           └── globals.css    # Tailwind & daisyUI imports, VS Code theme bridges
```

---

## 4. Detailed Component Design

### 4.1 Language Detection (`langDetector.ts`)
- Matches filename patterns:
  - `<lang>.json` (e.g. `en.json`, `vi.json`, `zh-CN.json`, `pt-BR.json`)
  - `[prefix].<lang>.json` (e.g. `messages.en.json`, `common.vi.json`)
- Language code mapping to metadata:
  - `en` → English (`🇬🇧`)
  - `vi` → Vietnamese (`🇻🇳`)
  - `ja` → Japanese (`🇯🇵`)
  - `zh` / `zh-CN` → Chinese (`🇨🇳`)
  - `fr` → French (`🇫🇷`)
  - `de` → German (`🇩🇪`)
  - `es` → Spanish (`🇪🇸`)
  - Fallback: Uses upper-cased code with globe icon `🌐`.

### 4.2 JSON Structure Parser (`jsonParser.ts`)
- **Structure Detection**:
  - Checks if root object has nested objects or flat keys.
  - Detects indentation (spaces count or tabs).
- **Flattening**: Converts `{ "auth": { "login": "Log In" } }` → `{ "auth.login": "Log In" }`.
- **Unflattening**:
  - Splits keys by `.` and builds nested object tree:
    ```typescript
    export function unflatten(data: Record<string, string>): Record<string, any> {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        const parts = key.split('.');
        let current = result;
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!current[part] || typeof current[part] !== 'object') {
            current[part] = {};
          }
          current = current[part];
        }
        current[parts[parts.length - 1]] = value;
      }
      return result;
    }
    ```
- **Sorting**: Keys are alphabetically sorted recursively to produce clean git diffs.

### 4.3 Extension ↔ Webview RPC Protocol (`types.ts`)
```typescript
export interface LanguageFile {
  code: string;
  filename: string;
  filePath: string;
  isNested: boolean;
  indent: number | string;
}

export interface TranslationRow {
  key: string;
  values: Record<string, string>; // languageCode -> value
}

export interface I18nFolderState {
  folderPath: string;
  folderName: string;
  languages: LanguageFile[];
  rows: TranslationRow[];
  totalKeys: number;
  missingCount: number;
}

export type WebviewToExtensionMessage =
  | { type: 'READY' }
  | { type: 'SAVE_REQUEST'; payload: { rows: TranslationRow[] } }
  | { type: 'ADD_KEY_REQUEST'; payload: { key: string; defaultValues?: Record<string, string> } }
  | { type: 'DELETE_KEY_REQUEST'; payload: { key: string } }
  | { type: 'RENAME_KEY_REQUEST'; payload: { oldKey: string; newKey: string } }
  | { type: 'ADD_LANGUAGE_REQUEST'; payload: { langCode: string; filename: string } }
  | { type: 'COPY_TO_CLIPBOARD'; payload: { text: string } }
  | { type: 'SHOW_NOTIFICATION'; payload: { message: string; level: 'info' | 'warn' | 'error' } };

export type ExtensionToWebviewMessage =
  | { type: 'INIT_DATA'; payload: I18nFolderState }
  | { type: 'SAVE_SUCCESS'; payload: { timestamp: number } }
  | { type: 'SAVE_ERROR'; payload: { error: string } }
  | { type: 'EXTERNAL_FILE_CHANGE'; payload: { changedFiles: string[] } };
```

---

## 5. Error Handling & Edge Cases

1. **Empty Folder or Non-JSON Files**: If no `.json` files are found in the selected directory, display a clear empty state with a button to create the first language file (e.g. `en.json`).
2. **Invalid JSON Syntax**: If a JSON file has syntax errors, show an error banner with line numbers and offer to open the offending file in the standard editor.
3. **External File Modification**: When external modifications occur while the user has unsaved edits, alert the user and allow choosing between "Reload from Disk" and "Keep Local Edits".
4. **Key Collisions & Renaming**: Validate new or renamed keys to prevent collisions or empty key names.

---

## 6. Testing & Verification Strategy

- **Unit Tests**:
  - `jsonParser.test.ts`: Test flattening, unflattening, nested structure detection, and indentation preservation.
  - `langDetector.test.ts`: Test language detection from various filename conventions.
- **Integration Tests**:
  - Verify file service read/write cycles against temporary fixture directories.
- **Manual Verification in VS Code Extension Host**:
  - Run `F5` / Launch Extension in VS Code debug host.
  - Open a sample folder containing `en.json`, `vi.json`, `ja.json`.
  - Add new keys, edit cells, test search/filter for missing values, add a new language `fr.json`, and verify `Cmd+S` saves formatted JSON back to disk.
