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
