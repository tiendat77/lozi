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
      JSON.stringify({ app: { title: 'Old Title' } }, null, 2)
    );

    const state = await FileService.loadFolder(tmpDir);
    const updatedRows = [
      { key: 'app.title', values: { en: 'New Title' } },
      { key: 'auth.login', values: { en: 'Sign In' } },
    ];

    await FileService.saveFolder(state, updatedRows);

    const savedContent = await fs.readFile(path.join(tmpDir, 'en.json'), 'utf-8');
    const parsed = JSON.parse(savedContent);
    expect(parsed.app.title).toBe('New Title');
    expect(parsed.auth.login).toBe('Sign In');
  });

  it('preserves flat format if original file was flat', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'en.json'),
      JSON.stringify({ 'auth.title': 'Old Title' }, null, 2)
    );

    const state = await FileService.loadFolder(tmpDir);
    const updatedRows = [
      { key: 'auth.title', values: { en: 'New Title' } },
      { key: 'auth.login', values: { en: 'Sign In' } },
    ];

    await FileService.saveFolder(state, updatedRows);

    const savedContent = await fs.readFile(path.join(tmpDir, 'en.json'), 'utf-8');
    const parsed = JSON.parse(savedContent);
    expect(parsed['auth.title']).toBe('New Title');
    expect(parsed['auth.login']).toBe('Sign In');
  });
});

