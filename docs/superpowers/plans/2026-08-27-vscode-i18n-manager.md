# VS Code i18n JSON Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete VS Code extension that enables developers to manage i18n JSON files via an intuitive spreadsheet-style Translation Matrix webview powered by React, TailwindCSS, and daisyUI.

**Architecture:** Dual-build architecture with TypeScript extension host compiled by `esbuild` and React Webview application compiled by `Vite`. Strong two-way RPC message protocol for syncing folder state, dirty state tracking, and atomic file updates with structure preservation.

**Tech Stack:** TypeScript, VS Code Extension API, React 18, TailwindCSS, daisyUI, Lucide React, esbuild, Vite, Vitest.

---

## File Structure

```
loz/
├── package.json
├── tsconfig.json
├── tsconfig.webview.json
├── vite.config.ts
├── esbuild.js
├── tailwind.config.js
├── postcss.config.js
├── .vscode/
│   └── launch.json
├── src/
│   ├── extension/
│   │   ├── extension.ts
│   │   ├── i18nManagerPanel.ts
│   │   ├── fileService.ts
│   │   ├── types.ts
│   │   └── parser/
│   │       ├── jsonParser.ts
│   │       └── langDetector.ts
│   └── webview/
│       ├── index.html
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/
│       │   ├── Toolbar.tsx
│       │   ├── MatrixTable.tsx
│       │   ├── TableRow.tsx
│       │   ├── AddKeyModal.tsx
│       │   └── AddLangModal.tsx
│       ├── hooks/
│       │   ├── useI18nStore.ts
│       │   └── useVsCodeApi.ts
│       └── styles/
│           └── globals.css
└── tests/
    ├── parser/
    │   ├── jsonParser.test.ts
    │   └── langDetector.test.ts
    └── fileService.test.ts
```

---

### Task 1: Project Scaffolding & Build Configuration

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.webview.json`
- Create: `vite.config.ts`
- Create: `esbuild.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `.vscode/launch.json`

- [ ] **Step 1: Create `package.json` with extension manifest and scripts**

```json
{
  "name": "vscode-i18n-manager",
  "displayName": "i18n JSON Manager",
  "description": "Visual translation matrix editor for i18n JSON files",
  "version": "0.1.0",
  "publisher": "tiendat",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": [
    "Other",
    "Programming Languages"
  ],
  "activationEvents": [],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "lozi.openFolder",
        "title": "i18n: Manage Translations in Folder",
        "category": "i18n Manager"
      }
    ],
    "menus": {
      "explorer/context": [
        {
          "command": "lozi.openFolder",
          "when": "explorerResourceIsFolder",
          "group": "navigation"
        }
      ]
    }
  },
  "scripts": {
    "build:extension": "node esbuild.js",
    "build:webview": "vite build",
    "build": "npm run build:extension && npm run build:webview",
    "watch:extension": "node esbuild.js --watch",
    "watch:webview": "vite build --watch",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@types/vscode": "^1.85.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "daisyui": "^4.7.2",
    "esbuild": "^0.20.0",
    "lucide-react": "^0.330.0",
    "postcss": "^8.4.35",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3",
    "vite": "^5.1.0",
    "vitest": "^1.2.2"
  }
}
```

- [ ] **Step 2: Create TypeScript configurations (`tsconfig.json` & `tsconfig.webview.json`)**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "lib": ["ES2022"],
    "sourceMap": true,
    "strict": true,
    "skipLibCheck": true,
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/extension/**/*", "tests/**/*"]
}
```

`tsconfig.webview.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/webview/**/*"]
}
```

- [ ] **Step 3: Create `esbuild.js`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`**

`esbuild.js`:
```javascript
const esbuild = require('esbuild');

const isWatch = process.argv.includes('--watch');

async function build() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension/extension.ts'],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    outfile: 'dist/extension.js',
    external: ['vscode'],
    sourcemap: true,
    minify: !isWatch,
  });

  if (isWatch) {
    await ctx.watch();
    console.log('Watching extension...');
  } else {
    await ctx.rebuild();
    await ctx.dispose();
    console.log('Extension built successfully.');
  }
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
```

`vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/webview',
  build: {
    outDir: resolve(__dirname, 'dist/webview'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/webview/index.html'),
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
});
```

`tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/webview/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["dark", "light"],
    darkTheme: "dark",
  },
};
```

`postcss.config.js`:
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`
Expected: `node_modules` generated without errors.

---

### Task 2: Core Parsing & Language Detection Engines

**Files:**
- Create: `src/extension/parser/langDetector.ts`
- Create: `src/extension/parser/jsonParser.ts`
- Create: `tests/parser/langDetector.test.ts`
- Create: `tests/parser/jsonParser.test.ts`

- [ ] **Step 1: Write failing tests for `langDetector.ts`**

`tests/parser/langDetector.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { detectLanguageFromFilename, getLanguageMeta } from '../../src/extension/parser/langDetector';

describe('langDetector', () => {
  it('detects simple language codes from filenames', () => {
    expect(detectLanguageFromFilename('en.json')).toBe('en');
    expect(detectLanguageFromFilename('vi.json')).toBe('vi');
    expect(detectLanguageFromFilename('ja.json')).toBe('ja');
    expect(detectLanguageFromFilename('zh-CN.json')).toBe('zh-CN');
  });

  it('detects prefixed filenames', () => {
    expect(detectLanguageFromFilename('messages.en.json')).toBe('en');
    expect(detectLanguageFromFilename('common.vi.json')).toBe('vi');
    expect(detectLanguageFromFilename('locales.de.json')).toBe('de');
  });

  it('returns flag and display label for known codes', () => {
    const metaEn = getLanguageMeta('en');
    expect(metaEn.label).toBe('English');
    expect(metaEn.flag).toBe('🇬🇧');

    const metaVi = getLanguageMeta('vi');
    expect(metaVi.label).toBe('Vietnamese');
    expect(metaVi.flag).toBe('🇻🇳');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/parser/langDetector.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `src/extension/parser/langDetector.ts`**

```typescript
export interface LanguageMeta {
  code: string;
  label: string;
  flag: string;
}

const LANGUAGE_MAP: Record<string, { label: string; flag: string }> = {
  en: { label: 'English', flag: '🇬🇧' },
  vi: { label: 'Vietnamese', flag: '🇻🇳' },
  ja: { label: 'Japanese', flag: '🇯🇵' },
  zh: { label: 'Chinese', flag: '🇨🇳' },
  'zh-CN': { label: 'Chinese (Simplified)', flag: '🇨🇳' },
  'zh-TW': { label: 'Chinese (Traditional)', flag: '🇹🇼' },
  fr: { label: 'French', flag: '🇫🇷' },
  de: { label: 'German', flag: '🇩🇪' },
  es: { label: 'Spanish', flag: '🇪🇸' },
  ko: { label: 'Korean', flag: '🇰🇷' },
  it: { label: 'Italian', flag: '🇮🇹' },
  ru: { label: 'Russian', flag: '🇷🇺' },
  pt: { label: 'Portuguese', flag: '🇵🇹' },
  'pt-BR': { label: 'Portuguese (Brazil)', flag: '🇧🇷' },
};

export function detectLanguageFromFilename(filename: string): string {
  const clean = filename.replace(/\.json$/i, '');
  const parts = clean.split('.');
  const candidate = parts[parts.length - 1];
  return candidate || clean;
}

export function getLanguageMeta(code: string): LanguageMeta {
  const meta = LANGUAGE_MAP[code] || LANGUAGE_MAP[code.toLowerCase()];
  if (meta) {
    return { code, ...meta };
  }
  return {
    code,
    label: code.toUpperCase(),
    flag: '🌐',
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/parser/langDetector.test.ts`
Expected: PASS

- [ ] **Step 5: Write failing tests for `jsonParser.ts`**

`tests/parser/jsonParser.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import {
  flattenJson,
  unflattenJson,
  detectJsonStructure,
  formatJsonString,
} from '../../src/extension/parser/jsonParser';

describe('jsonParser', () => {
  it('flattens nested JSON object into dot-notation keys', () => {
    const input = {
      nav: {
        home: 'Home',
        auth: {
          login: 'Sign In',
        },
      },
      simple: 'Simple',
    };
    const flattened = flattenJson(input);
    expect(flattened).toEqual({
      'nav.home': 'Home',
      'nav.auth.login': 'Sign In',
      simple: 'Simple',
    });
  });

  it('unflattens dot-notation keys into nested objects', () => {
    const input = {
      'nav.home': 'Home',
      'nav.auth.login': 'Sign In',
      simple: 'Simple',
    };
    const nested = unflattenJson(input);
    expect(nested).toEqual({
      nav: {
        home: 'Home',
        auth: {
          login: 'Sign In',
        },
      },
      simple: 'Simple',
    });
  });

  it('detects nested structure and indentation', () => {
    const nestedContent = '{\n  "auth": {\n    "title": "Login"\n  }\n}';
    const flatContent = '{\n    "auth.title": "Login"\n}';

    const resNested = detectJsonStructure(nestedContent);
    expect(resNested.isNested).toBe(true);
    expect(resNested.indent).toBe(2);

    const resFlat = detectJsonStructure(flatContent);
    expect(resFlat.isNested).toBe(false);
    expect(resFlat.indent).toBe(4);
  });

  it('formats JSON with sorted keys and original indentation', () => {
    const data = { b: '2', a: '1' };
    const formatted = formatJsonString(data, false, 2);
    expect(formatted).toBe('{\n  "a": "1",\n  "b": "2"\n}\n');
  });
});
```

- [ ] **Step 6: Implement `src/extension/parser/jsonParser.ts`**

```typescript
export interface JsonStructureInfo {
  isNested: boolean;
  indent: number | string;
}

export function flattenJson(
  obj: Record<string, any>,
  prefix = ''
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenJson(value, fullKey));
    } else {
      result[fullKey] = typeof value === 'string' ? value : String(value ?? '');
    }
  }

  return result;
}

export function unflattenJson(data: Record<string, string>): Record<string, any> {
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

export function detectJsonStructure(rawContent: string): JsonStructureInfo {
  let isNested = false;
  let indent: number | string = 2;

  // Detect indentation
  const indentMatch = rawContent.match(/^[ \t]+(?=")/m);
  if (indentMatch) {
    if (indentMatch[0].includes('\t')) {
      indent = '\t';
    } else {
      indent = indentMatch[0].length;
    }
  }

  try {
    const parsed = JSON.parse(rawContent);
    for (const val of Object.values(parsed)) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        isNested = true;
        break;
      }
    }
  } catch {
    // fallback defaults
  }

  return { isNested, indent };
}

function sortObjectKeys(obj: any): any {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return obj;
  }
  const sorted: Record<string, any> = {};
  const keys = Object.keys(obj).sort();
  for (const k of keys) {
    sorted[k] = sortObjectKeys(obj[k]);
  }
  return sorted;
}

export function formatJsonString(
  flatData: Record<string, string>,
  isNested: boolean,
  indent: number | string
): string {
  const targetObj = isNested ? unflattenJson(flatData) : flatData;
  const sortedObj = sortObjectKeys(targetObj);
  return JSON.stringify(sortedObj, null, indent) + '\n';
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run tests/parser/jsonParser.test.ts`
Expected: PASS

---

### Task 3: Shared Types & File System Service

**Files:**
- Create: `src/extension/types.ts`
- Create: `src/extension/fileService.ts`
- Create: `tests/fileService.test.ts`

- [ ] **Step 1: Create `src/extension/types.ts`**

```typescript
export interface LanguageFile {
  code: string;
  label: string;
  flag: string;
  filename: string;
  filePath: string;
  isNested: boolean;
  indent: number | string;
}

export interface TranslationRow {
  key: string;
  values: Record<string, string>; // langCode -> translated string
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

- [ ] **Step 2: Implement `src/extension/fileService.ts`**

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { I18nFolderState, LanguageFile, TranslationRow } from './types';
import { detectLanguageFromFilename, getLanguageMeta } from './parser/langDetector';
import {
  detectJsonStructure,
  flattenJson,
  formatJsonString,
} from './parser/jsonParser';

export class FileService {
  public static async loadFolder(folderPath: string): Promise<I18nFolderState> {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    const jsonFiles = entries.filter(
      e => e.isFile() && e.name.toLowerCase().endsWith('.json')
    );

    const languages: LanguageFile[] = [];
    const rawDataByLang: Record<string, Record<string, string>> = {};
    const allKeysSet = new Set<string>();

    for (const file of jsonFiles) {
      const filePath = path.join(folderPath, file.name);
      const content = await fs.readFile(filePath, 'utf-8');
      const langCode = detectLanguageFromFilename(file.name);
      const meta = getLanguageMeta(langCode);
      const { isNested, indent } = detectJsonStructure(content);

      languages.push({
        code: langCode,
        label: meta.label,
        flag: meta.flag,
        filename: file.name,
        filePath,
        isNested,
        indent,
      });

      let parsed = {};
      try {
        parsed = JSON.parse(content || '{}');
      } catch (err) {
        console.error(`Failed to parse ${file.name}:`, err);
      }

      const flat = flattenJson(parsed);
      rawDataByLang[langCode] = flat;
      Object.keys(flat).forEach(k => allKeysSet.add(k));
    }

    const sortedKeys = Array.from(allKeysSet).sort();
    let missingCount = 0;

    const rows: TranslationRow[] = sortedKeys.map(key => {
      const values: Record<string, string> = {};
      for (const lang of languages) {
        const val = rawDataByLang[lang.code]?.[key] ?? '';
        values[lang.code] = val;
        if (!val.trim()) {
          missingCount++;
        }
      }
      return { key, values };
    });

    return {
      folderPath,
      folderName: path.basename(folderPath),
      languages,
      rows,
      totalKeys: sortedKeys.length,
      missingCount,
    };
  }

  public static async saveFolder(
    folderState: I18nFolderState,
    rows: TranslationRow[]
  ): Promise<void> {
    for (const lang of folderState.languages) {
      const flatMap: Record<string, string> = {};
      for (const row of rows) {
        const val = row.values[lang.code];
        if (val !== undefined) {
          flatMap[row.key] = val;
        }
      }

      const formatted = formatJsonString(flatMap, lang.isNested, lang.indent);
      await fs.writeFile(lang.filePath, formatted, 'utf-8');
    }
  }

  public static async createLanguageFile(
    folderPath: string,
    filename: string
  ): Promise<string> {
    const filePath = path.join(folderPath, filename);
    await fs.writeFile(filePath, '{\n}\n', 'utf-8');
    return filePath;
  }
}
```

- [ ] **Step 3: Write tests for `fileService.ts`**

`tests/fileService.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { FileService } from '../src/extension/fileService';

describe('FileService', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'i18n-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('loads folder with nested json files and aggregates rows', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'en.json'),
      JSON.stringify({ nav: { home: 'Home', about: 'About' } }, null, 2)
    );
    await fs.writeFile(
      path.join(tmpDir, 'vi.json'),
      JSON.stringify({ nav: { home: 'Trang chủ' } }, null, 2)
    );

    const state = await FileService.loadFolder(tmpDir);
    expect(state.languages.length).toBe(2);
    expect(state.totalKeys).toBe(2);
    expect(state.missingCount).toBe(1); // vi is missing nav.about

    const homeRow = state.rows.find(r => r.key === 'nav.home');
    expect(homeRow?.values['en']).toBe('Home');
    expect(homeRow?.values['vi']).toBe('Trang chủ');
  });

  it('saves changes back to nested structure on disk', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'en.json'),
      JSON.stringify({ title: 'Old Title' }, null, 2)
    );

    const state = await FileService.loadFolder(tmpDir);
    const updatedRows = [
      { key: 'title', values: { en: 'New Title' } },
      { key: 'auth.login', values: { en: 'Sign In' } },
    ];

    await FileService.saveFolder(state, updatedRows);

    const savedContent = await fs.readFile(path.join(tmpDir, 'en.json'), 'utf-8');
    const parsed = JSON.parse(savedContent);
    expect(parsed.title).toBe('New Title');
    expect(parsed.auth.login).toBe('Sign In');
  });
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/fileService.test.ts`
Expected: PASS

---

### Task 4: Webview Panel Controller & Extension Lifecycle

**Files:**
- Create: `src/extension/i18nManagerPanel.ts`
- Create: `src/extension/extension.ts`

- [ ] **Step 1: Implement `src/extension/i18nManagerPanel.ts`**

```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import { FileService } from './fileService';
import {
  ExtensionToWebviewMessage,
  I18nFolderState,
  WebviewToExtensionMessage,
} from './types';

export class I18nManagerPanel {
  public static currentPanels: Map<string, I18nManagerPanel> = new Map();
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _folderPath: string;
  private _folderState?: I18nFolderState;
  private _disposables: vscode.Disposable[] = [];
  private _fileWatcher?: vscode.FileSystemWatcher;

  public static createOrShow(extensionUri: vscode.Uri, folderUri: vscode.Uri) {
    const folderPath = folderUri.fsPath;
    const existingPanel = I18nManagerPanel.currentPanels.get(folderPath);

    if (existingPanel) {
      existingPanel._panel.reveal(vscode.ViewColumn.One);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'lozi',
      `i18n: ${path.basename(folderPath)}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'dist', 'webview'),
        ],
      }
    );

    const manager = new I18nManagerPanel(panel, extensionUri, folderPath);
    I18nManagerPanel.currentPanels.set(folderPath, manager);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    folderPath: string
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._folderPath = folderPath;

    this._updateHtml();
    this._setupMessageListener();
    this._setupFileWatcher();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  private async _loadAndSendData() {
    try {
      this._folderState = await FileService.loadFolder(this._folderPath);
      this._postMessage({
        type: 'INIT_DATA',
        payload: this._folderState,
      });
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to load i18n folder: ${err.message}`);
    }
  }

  private _postMessage(message: ExtensionToWebviewMessage) {
    this._panel.webview.postMessage(message);
  }

  private _setupMessageListener() {
    this._panel.webview.onDidReceiveMessage(
      async (message: WebviewToExtensionMessage) => {
        switch (message.type) {
          case 'READY':
            await this._loadAndSendData();
            break;
          case 'SAVE_REQUEST':
            if (!this._folderState) return;
            try {
              await FileService.saveFolder(this._folderState, message.payload.rows);
              this._postMessage({
                type: 'SAVE_SUCCESS',
                payload: { timestamp: Date.now() },
              });
              vscode.window.showInformationMessage('i18n translations saved successfully.');
              await this._loadAndSendData();
            } catch (err: any) {
              this._postMessage({
                type: 'SAVE_ERROR',
                payload: { error: err.message },
              });
              vscode.window.showErrorMessage(`Error saving translations: ${err.message}`);
            }
            break;
          case 'ADD_LANGUAGE_REQUEST':
            try {
              await FileService.createLanguageFile(
                this._folderPath,
                message.payload.filename
              );
              vscode.window.showInformationMessage(
                `Created language file ${message.payload.filename}`
              );
              await this._loadAndSendData();
            } catch (err: any) {
              vscode.window.showErrorMessage(`Failed to create language file: ${err.message}`);
            }
            break;
          case 'COPY_TO_CLIPBOARD':
            await vscode.env.clipboard.writeText(message.payload.text);
            vscode.window.showInformationMessage(`Copied "${message.payload.text}" to clipboard.`);
            break;
          case 'SHOW_NOTIFICATION':
            if (message.payload.level === 'warn') {
              vscode.window.showWarningMessage(message.payload.message);
            } else if (message.payload.level === 'error') {
              vscode.window.showErrorMessage(message.payload.message);
            } else {
              vscode.window.showInformationMessage(message.payload.message);
            }
            break;
        }
      },
      null,
      this._disposables
    );
  }

  private _setupFileWatcher() {
    const pattern = new vscode.RelativePattern(this._folderPath, '*.json');
    this._fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

    this._fileWatcher.onDidChange(async () => {
      await this._loadAndSendData();
    });
    this._fileWatcher.onDidCreate(async () => {
      await this._loadAndSendData();
    });
    this._fileWatcher.onDidDelete(async () => {
      await this._loadAndSendData();
    });

    this._disposables.push(this._fileWatcher);
  }

  private _updateHtml() {
    const webview = this._panel.webview;
    const webviewDistUri = vscode.Uri.joinPath(
      this._extensionUri,
      'dist',
      'webview'
    );

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(webviewDistUri, 'assets', 'index.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(webviewDistUri, 'assets', 'index.css')
    );

    webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>i18n Manager</title>
  <link rel="stylesheet" href="${styleUri}">
</head>
<body class="bg-base-100 text-base-content min-h-screen">
  <div id="root"></div>
  <script type="module" src="${scriptUri}"></script>
</body>
</html>`;
  }

  public dispose() {
    I18nManagerPanel.currentPanels.delete(this._folderPath);
    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) d.dispose();
    }
  }
}
```

- [ ] **Step 2: Implement `src/extension/extension.ts`**

```typescript
import * as vscode from 'vscode';
import { I18nManagerPanel } from './loziPanel';

export function activate(context: vscode.ExtensionContext) {
  const openFolderCommand = vscode.commands.registerCommand(
    'lozi.openFolder',
    async (uri?: vscode.Uri) => {
      let targetUri = uri;

      if (!targetUri) {
        const selected = await vscode.window.showOpenDialog({
          canSelectFiles: false,
          canSelectFolders: true,
          canSelectMany: false,
          openLabel: 'Open i18n Folder',
        });
        if (selected && selected.length > 0) {
          targetUri = selected[0];
        }
      }

      if (targetUri) {
        I18nManagerPanel.createOrShow(context.extensionUri, targetUri);
      }
    }
  );

  context.subscriptions.push(openFolderCommand);
}

export function deactivate() {}
```

---

### Task 5: Webview React Application & daisyUI Components

**Files:**
- Create: `src/webview/styles/globals.css`
- Create: `src/webview/hooks/useVsCodeApi.ts`
- Create: `src/webview/hooks/useI18nStore.ts`
- Create: `src/webview/components/Toolbar.tsx`
- Create: `src/webview/components/MatrixTable.tsx`
- Create: `src/webview/components/TableRow.tsx`
- Create: `src/webview/components/AddKeyModal.tsx`
- Create: `src/webview/components/AddLangModal.tsx`
- Create: `src/webview/App.tsx`
- Create: `src/webview/main.tsx`
- Create: `src/webview/index.html`

- [ ] **Step 1: Create `src/webview/styles/globals.css` and `index.html`**

`src/webview/styles/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  overflow: hidden;
  user-select: none;
}

/* Custom scrollbars matching VS Code */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(121, 121, 121, 0.4);
  border-radius: 5px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 100, 100, 0.7);
}
```

`src/webview/index.html`:
```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>i18n Manager Webview</title>
  </head>
  <body class="bg-base-300 text-base-content h-screen w-screen overflow-hidden">
    <div id="root" class="h-full w-full"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Create `useVsCodeApi.ts` and `useI18nStore.ts`**

`src/webview/hooks/useVsCodeApi.ts`:
```typescript
declare function acquireVsCodeApi(): {
  postMessage: (message: any) => void;
  getState: () => any;
  setState: (state: any) => void;
};

const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : {
  postMessage: (msg: any) => console.log('Mock postMessage:', msg),
  getState: () => ({}),
  setState: () => {},
};

export function useVsCodeApi() {
  return vscode;
}
```

`src/webview/hooks/useI18nStore.ts`:
```typescript
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
```

- [ ] **Step 3: Create Toolbar & Modals components**

`src/webview/components/Toolbar.tsx`:
```tsx
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
```

`src/webview/components/AddKeyModal.tsx`:
```tsx
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
              className="input input-bordered w-full bg-base-100"
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
```

`src/webview/components/AddLangModal.tsx`:
```tsx
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
            className="input input-bordered w-full bg-base-100 mb-4"
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
```

- [ ] **Step 4: Create MatrixTable & TableRow components**

`src/webview/components/TableRow.tsx`:
```tsx
import React, { useState } from 'react';
import { Copy, Trash2, Edit2, Check } from 'lucide-react';
import { LanguageFile, TranslationRow } from '../../extension/types';
import { useVsCodeApi } from '../hooks/useVsCodeApi';

interface TableRowProps {
  row: TranslationRow;
  languages: LanguageFile[];
  onCellChange: (key: string, langCode: string, value: string) => void;
  onDeleteKey: (key: string) => void;
  onRenameKey: (oldKey: string, newKey: string) => void;
}

export const TableRow: React.FC<TableRowProps> = ({
  row,
  languages,
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
      <td className="w-72 min-w-[280px] p-2 align-top font-mono text-xs text-primary bg-base-300/40 sticky left-0 z-10 border-r border-base-200">
        <div className="flex items-center justify-between gap-1">
          {isEditingKey ? (
            <div className="flex items-center gap-1 w-full">
              <input
                type="text"
                className="input input-xs input-bordered w-full font-mono bg-base-100"
                value={tempKey}
                onChange={e => setTempKey(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCommitRename();
                  if (e.key === 'Escape') setIsEditingKey(false);
                }}
                autoFocus
              />
              <button
                className="btn btn-xs btn-square btn-ghost text-success"
                onClick={handleCommitRename}
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <>
              <span className="truncate select-text" title={row.key}>
                {row.key}
              </span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
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
      {languages.map(lang => {
        const val = row.values[lang.code] || '';
        const isMissing = !val.trim();

        return (
          <td key={lang.code} className="p-1 min-w-[200px] align-top">
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
```

`src/webview/components/MatrixTable.tsx`:
```tsx
import React from 'react';
import { I18nFolderState, TranslationRow } from '../../extension/types';
import { TableRow } from './TableRow';

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
  if (!folderState || folderState.languages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-70">
        <span className="text-4xl mb-3">🌐</span>
        <p className="text-base font-semibold">No i18n JSON files detected</p>
        <p className="text-sm text-base-content/60 mt-1">
          Add your first language file (e.g. <code>en.json</code>) using the button above.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="table table-pin-rows table-pin-cols w-full border-collapse">
        <thead>
          <tr className="bg-base-200 text-xs border-b border-base-100">
            <th className="w-72 min-w-[280px] bg-base-200 sticky left-0 z-20 text-left font-semibold">
              Translation Key
            </th>
            {folderState.languages.map(lang => (
              <th key={lang.code} className="min-w-[200px] text-left font-semibold">
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
            rows.map(row => (
              <TableRow
                key={row.key}
                row={row}
                languages={folderState.languages}
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
```

- [ ] **Step 5: Create App.tsx and main.tsx**

`src/webview/App.tsx`:
```tsx
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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-base-300 text-base-content text-sm">
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
```

`src/webview/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

### Task 6: Build & Verification

**Files:**
- Output: `dist/extension.js`
- Output: `dist/webview/`

- [ ] **Step 1: Run all unit tests**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 2: Run webview build**

Run: `npm run build:webview`
Expected: `dist/webview/index.html` and assets compiled cleanly.

- [ ] **Step 3: Run extension host build**

Run: `npm run build:extension`
Expected: `dist/extension.js` generated.

- [ ] **Step 4: End-to-End manual verification**
- Launch extension in VS Code test environment / debug host.
- Test context menu on sample folder.
- Add key, edit translations across multiple languages, verify `Cmd+S` writes back nicely formatted JSON to disk.
