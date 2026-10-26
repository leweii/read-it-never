import { describe, expect, it } from 'vitest';
import { FileSystemAdapter } from 'obsidian';
import { byteLength, getOsOptimizedPath, normalizeFilename, truncateToByteLength } from 'src/helpers/fileutils';

function fakeAdapter(basePath: string): FileSystemAdapter {
    return { getFullPath: (path: string) => `${basePath}/${path}` } as unknown as FileSystemAdapter;
}

describe('normalizeFilename', () => {
    it('removes characters invalid in file names or wikilinks', () => {
        expect(normalizeFilename('a:b/c\\d|e?f*g<h>i"j#k[l]m^n')).toBe('abcdefghijklmn');
    });

    it('collapses whitespace and strips trailing dots and spaces', () => {
        expect(normalizeFilename('  Hello\n\tworld...  ')).toBe('Hello world');
    });

    it('never returns an empty name', () => {
        expect(normalizeFilename('???')).toBe('Untitled');
    });

    it('keeps unicode by default', () => {
        expect(normalizeFilename('中文标题 🎉')).toBe('中文标题 🎉');
    });
});

describe('truncateToByteLength', () => {
    it('counts CJK characters as three bytes', () => {
        expect(byteLength('中文')).toBe(6);
        expect(truncateToByteLength('中文标题', 7)).toBe('中文');
    });

    it('does not split surrogate pairs', () => {
        expect(truncateToByteLength('a🎉', 3)).toBe('a');
    });
});

describe('getOsOptimizedPath', () => {
    const limits = { path: 1024, fileName: 255 };

    it('keeps short names unchanged', () => {
        expect(getOsOptimizedPath('Inbox', 'Note.md', fakeAdapter('/vault'), limits)).toBe('Inbox/Note.md');
    });

    it('truncates long CJK names to the byte limit and keeps the extension', () => {
        const path = getOsOptimizedPath('Inbox', `${'中'.repeat(120)}.md`, fakeAdapter('/vault'), limits);
        const fileName = path.split('/').pop();
        expect(fileName.endsWith('.md')).toBe(true);
        expect(byteLength(fileName)).toBeLessThanOrEqual(255);
    });

    it('shortens only the file name when the full path is too long', () => {
        const path = getOsOptimizedPath('Inbox', `${'a'.repeat(100)}.md`, fakeAdapter('/vault'), {
            path: 60,
            fileName: 255,
        });
        expect(path.startsWith('Inbox/')).toBe(true);
        expect(path.endsWith('.md')).toBe(true);
        expect(`/vault/${path}`.length).toBeLessThanOrEqual(60);
    });
});
