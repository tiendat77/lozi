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
    const keys = Object.keys(parsed);
    if (keys.length === 0) {
      isNested = true;
    } else {
      for (const val of Object.values(parsed)) {
        if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
          isNested = true;
          break;
        }
      }
    }
  } catch {
    isNested = true;
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
