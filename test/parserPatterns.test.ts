import { describe, expect, it } from 'vitest';
import BilibiliParser from 'src/parsers/BilibiliParser';
import TwitterParser from 'src/parsers/TwitterParser';
import YoutubeParser from 'src/parsers/YoutubeParser';
import { Parser } from 'src/parsers/Parser';

// `test()` only inspects the URL, so the parsers can be constructed without a real app/plugin.
function create<T extends Parser>(ParserClass: new (...args: never[]) => T): T {
    return new ParserClass(...([null, null, null] as unknown as never[]));
}

describe('YoutubeParser.test', () => {
    const parser = create(YoutubeParser);

    it.each([
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtube.com/watch?app=desktop&v=dQw4w9WgXcQ',
        'https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=42',
        'https://music.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://www.youtube.com/shorts/dQw4w9WgXcQ',
        'https://www.youtube.com/live/dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ?si=abc',
    ])('matches %s', (url) => {
        expect(parser.test(url)).toBe(true);
    });

    it.each(['https://www.youtube.com/@channel', 'https://example.com/watch?v=dQw4w9WgXcQ'])(
        'does not match %s',
        (url) => {
            expect(parser.test(url)).toBe(false);
        },
    );
});

describe('BilibiliParser.test', () => {
    const parser = create(BilibiliParser);

    it.each([
        'https://www.bilibili.com/video/BV1GJ411x7h7/',
        'https://m.bilibili.com/video/BV1GJ411x7h7?p=2',
        'https://www.bilibili.com/video/av170001',
        'https://b23.tv/AbCd123',
    ])('matches %s', (url) => {
        expect(parser.test(url)).toBe(true);
    });

    it.each(['https://www.bilibili.com/read/cv123', 'https://space.bilibili.com/123'])('does not match %s', (url) => {
        expect(parser.test(url)).toBe(false);
    });
});

describe('TwitterParser.test', () => {
    const parser = create(TwitterParser);

    it.each([
        'https://x.com/jack/status/20',
        'https://twitter.com/jack/status/20?s=20&t=abc',
        'https://mobile.twitter.com/jack/status/20',
    ])('matches %s', (url) => {
        expect(parser.test(url)).toBe(true);
    });

    it.each(['https://x.com/jack', 'https://xxcom.example/jack/status/20'])('does not match %s', (url) => {
        expect(parser.test(url)).toBe(false);
    });
});
