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
