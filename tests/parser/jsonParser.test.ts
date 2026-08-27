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
