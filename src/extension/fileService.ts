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
