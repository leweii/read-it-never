import { describe, expect, it } from 'vitest';
import WebsiteParser from 'src/parsers/WebsiteParser';

type CharsetInternals = { getCharsetFromContentType(contentType: string | null | undefined): string | null };

const parser = new WebsiteParser(null, null, null) as unknown as CharsetInternals;

describe('WebsiteParser charset detection', () => {
    it.each([
        ['text/html; charset=UTF-8', 'utf-8'],
        ['text/html; charset="utf-8"', 'utf-8'],
        ["text/html; charset='GBK'", 'gbk'],
        ['text/html;charset=utf8', 'utf-8'],
        ['text/html', null],
        [undefined, null],
    ])('%s → %s', (contentType, expected) => {
        expect(parser.getCharsetFromContentType(contentType)).toBe(expected);
    });
});
