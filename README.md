# Lozi 🌐

> **Localize with ease.** The visual translation matrix editor for your i18n JSON files in VS Code.

[![Visual Studio Code](https://img.shields.io/badge/VS%20Code-v1.85%2B-blue.svg)](https://code.visualstudio.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 💡 What is "Lozi"?

The name **Lozi** (pronounced *“low-zee”*) is inspired by **Lo**cali**z**at**i**on:`

* **Lo**cali**z**at**i**on Made Ea**sy** — Translating multi-language applications shouldn't mean jumping across dozens of split JSON files.
* **Lo**cale Organ**iz**er **I**nterface — A single, cohesive visual matrix where every locale and key aligns side by side.
* **Zero friction** — Effortlessly audit missing translations, add keys across all locales simultaneously, and keep formatting consistent.

---

## ✨ Features

- 📊 **Visual Translation Matrix**: View and edit all your language JSON files (`en.json`, `vi.json`, `ja.json`, `fr.json`, etc.) side-by-side in a responsive spreadsheet-like grid.
- 🔍 **Instant Missing Detection**: Filter immediately by **Missing** translations with color-coded alerts and placeholders so nothing slips into production untranslated.
- ⚡ **Seamless Key Operations**:
  - **Add Key**: Add a key and initialize translations for all languages in one prompt.
  - **Rename Key**: Inline rename keys across every language file with zero manual search-and-replace.
  - **Delete Key**: Remove deprecated keys everywhere in a single click.
  - **Copy Key**: 1-click copy key path to clipboard for quick pasting into your code.
- 🌐 **Add New Languages**: Create and register new locale files with auto-detected flags and labels (supporting 40+ language codes).
- 🧩 **Structure & Format Aware**:
  - Automatically detects whether your files use **flat** (`"home.title": "..."`) or **nested** (`"home": { "title": "..." }`) JSON.
  - Detects and preserves your exact indentation (2-space, 4-space, tabs).
  - Automatically sorts keys alphabetically on save.
- 🔎 **Real-time Search & Filter**:
  - Filter by **All**, **Missing**, or **Unsaved**.
  - Search instantaneously by translation key name or translated text in any language.
- 💾 **Batch Save & Keyboard Shortcuts**:
  - Visual badge counter for unsaved edits.
  - Save all changes with `Cmd + S` (macOS) or `Ctrl + S` (Windows/Linux).

---

## 🚀 Getting Started

### 1. Open Lozi on a Translation Folder

You can launch Lozi in two ways:

- **Via Explorer Context Menu**: Right-click any folder containing `.json` translation files (e.g., `locales/`, `i18n/`, `translations/`) and select **`i18n: Manage Translations in Folder`**.
- **Via Command Palette**: Press `Ctrl+Shift+P` (or `Cmd+Shift+P`), type **`i18n: Manage Translations in Folder`**, and pick your target directory.

### 2. Supported Folder Layouts

Lozi automatically inspects `.json` files inside the chosen folder:

```text
src/
└── locales/
    ├── en.json
    ├── vi.json
    ├── ja.json
    └── fr.json
```

Both **nested** and **flat** JSON structures are fully supported:

#### Nested JSON (`en.json`)
```json
{
  "auth": {
    "login": "Sign In",
    "logout": "Sign Out"
  }
}
```

#### Flat JSON (`en.json`)
```json
{
  "auth.login": "Sign In",
  "auth.logout": "Sign Out"
}
```

Lozi detects the structure of each file automatically and writes changes back in the exact same format!

---

## ⌨️ Shortcuts & Navigation

| Action | Shortcut / Trigger |
| :--- | :--- |
| **Open Lozi** | Right-click folder → `i18n: Manage Translations in Folder` |
| **Save All Changes** | `Cmd + S` / `Ctrl + S` or click **Save (n)** |
| **Filter Missing** | Click the **Missing** badge in the toolbar |
| **Quick Search** | Type in the search box in the toolbar |
| **Rename Key** | Hover over key → Click ✏️ (Edit) or press Enter |
| **Copy Key Name** | Hover over key → Click 📋 (Copy) |
| **Delete Key** | Hover over key → Click 🗑️ (Delete) |

---

## 🛠️ Development & Building

If you're contributing to or building Lozi from source:

```bash
# Install dependencies
npm install

# Build both extension & webview
npm run build

# Watch mode for extension & webview during development
npm run watch:extension
npm run watch:webview

# Run unit tests
npm run test
```

Press `F5` in VS Code to launch the Extension Development Host.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
