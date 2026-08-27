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
