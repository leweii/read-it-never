import { request, requestUrl } from 'obsidian';
import { Note } from './Note';
import { Parser } from './Parser';
import { handleError } from 'src/helpers/error';
import { desktopBrowserUserAgent } from 'src/helpers/networkUtils';

interface BilibiliViewResponse {
    code: number;
    message: string;
    data?: BilibiliViewData;
}

interface BilibiliViewData {
    bvid: string;
    aid: number;
    title: string;
    desc: string;
    pic: string;
    pubdate: number;
    duration: number;
    owner: BilibiliOwner;
    stat: BilibiliStat;
    pages: BilibiliPage[];
}

interface BilibiliOwner {
    mid: number;
    name: string;
    face: string;
}

interface BilibiliStat {
    view: number;
}

interface BilibiliPage {
    cid: number;
    page: number;
    part: string;
    duration: number;
}

// Shape of the `player/v2` endpoint fields consumed in `getVideoTranscript`.
interface BilibiliPlayerResponse {
    code: number;
    message: string;
    data?: {
        subtitle?: {
            subtitles?: BilibiliSubtitleTrack[];
        };
    };
}

interface BilibiliSubtitleTrack {
    lan: string;
    lan_doc: string;
    subtitle_url: string;
}

// Shape of the subtitle JSON file referenced by `subtitle_url`.
interface BilibiliSubtitleFile {
    body: BilibiliSubtitleLine[];
}

interface BilibiliSubtitleLine {
    from: number;
    to: number;
    content: string;
}

interface BilibiliTranscriptSegment {
    text: string;
    seconds: number;
}

type BilibiliNoteData = {
    date: string;
    videoId: string;
    videoTitle: string;
    videoURL: string;
    videoPlayer: string;
    videoDescription: string;
    videoThumbnail: string;
    channelName: string;
    channelURL: string;
    videoPublishDate: string;
    videoViewsCount: number;
    videoDuration: number;
    videoDurationFormatted: string;
    videoPartsCount: number;
    videoParts: string;
    videoTranscript: string;
};

const BILIBILI_HEADERS = {
    ...desktopBrowserUserAgent,
    referer: 'https://www.bilibili.com',
};

class BilibiliParser extends Parser {
    private PATTERN = /bilibili\.com\/(?:s\/)?video\/((?:BV[0-9A-Za-z]{10})|(?:av\d+))/i;
    // Short links shared from the Bilibili mobile app, e.g. https://b23.tv/AbCdEf
    private SHORT_LINK_PATTERN = /^https?:\/\/(?:www\.)?(?:b23\.tv|bili2233\.cn)\/[0-9A-Za-z]+/i;

    test(url: string): boolean {
        return this.isValidUrl(url) && (this.PATTERN.test(url) || this.SHORT_LINK_PATTERN.test(url));
    }

    /**
     * Resolves a b23.tv short link to its video id by following the redirect and looking for the
     * id in the landing page.
     */
    private async resolveVideoId(url: string): Promise<string> {
        const directMatch = this.PATTERN.exec(url)?.[1];
        if (directMatch) {
            return directMatch;
        }

        const response = await requestUrl({ method: 'GET', url, headers: { ...BILIBILI_HEADERS } });
        const videoId = response.text.match(/BV[0-9A-Za-z]{10}/)?.[0];
        if (!videoId) {
            throw new Error(`${url} does not point to a Bilibili video.`);
        }
        return videoId;
    }

    async prepareNote(url: string): Promise<Note> {
        const createdAt = new Date();
        let data: BilibiliNoteData;
        try {
            data = await this.getNoteData(url, createdAt);
        } catch (error) {
            handleError(error, 'Unable to parse Bilibili page.');
        }

        const content = this.templateEngine.render(this.plugin.settings.bilibiliNote, data);

        const fileNameTemplate = this.templateEngine.render(this.plugin.settings.bilibiliNoteTitle, {
            title: data.videoTitle,
            date: this.getFormattedDateForFilename(createdAt),
        });

        return new Note(fileNameTemplate, 'md', content, this.plugin.settings.bilibiliContentTypeSlug, createdAt);
    }

    private async getNoteData(url: string, createdAt: Date): Promise<BilibiliNoteData> {
        const videoId = await this.resolveVideoId(url);
        const idQuery = /^av\d+$/i.test(videoId) ? `aid=${videoId.slice(2)}` : `bvid=${videoId}`;

        const response = await requestUrl({
            method: 'GET',
            url: `https://api.bilibili.com/x/web-interface/view?${idQuery}`,
            headers: { ...BILIBILI_HEADERS },
        });

        if (response.status === 429) {
            throw new Error('Rate limited (HTTP 429). Try again later.');
        }
        if (response.status >= 400) {
            throw new Error(`HTTP ${response.status} error fetching ${url}`);
        }

        const body = response.json as BilibiliViewResponse;
        if (body.code !== 0 || !body.data) {
            throw new Error(`Bilibili API error (code ${body.code}): ${body.message}`);
        }

        const video = body.data;

        const firstPageCid = video.pages?.[0]?.cid;
        const videoTranscript = await this.getVideoTranscript(video.bvid, firstPageCid);

        return {
            date: this.getFormattedDateForContent(createdAt),
            videoId: video.bvid,
            videoTitle: video.title,
            videoURL: this.SHORT_LINK_PATTERN.test(url) ? `https://www.bilibili.com/video/${video.bvid}` : url,
            videoPlayer: `<iframe width="${this.plugin.settings.bilibiliEmbedWidth}" height="${this.plugin.settings.bilibiliEmbedHeight}" src="https://player.bilibili.com/player.html?autoplay=0&bvid=${video.bvid}" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>`,
            videoDescription: video.desc,
            videoThumbnail: video.pic.replace(/^http:/, 'https:'),
            channelName: video.owner.name,
            channelURL: `https://space.bilibili.com/${video.owner.mid}`,
            videoPublishDate: this.getFormattedDateForContent(new Date(video.pubdate * 1000)),
            videoViewsCount: video.stat.view,
            videoDuration: video.duration,
            videoDurationFormatted: this.formatDuration(video.duration),
            videoPartsCount: video.pages.length,
            videoParts: this.formatParts(video.bvid, video.pages),
            videoTranscript,
        };
    }

    /**
     * Fetches the video's closed captions as plain text.
     *
     * Unlike YouTube, Bilibili only returns the subtitle list to authenticated requests: the
     * `player/v2` endpoint returns an empty `subtitles` array for anonymous callers. The user must
     * supply their `SESSDATA` cookie (copied from a logged-in browser session) in the plugin
     * settings for this to work.
     */
    private async getVideoTranscript(bvid: string, cid?: number): Promise<string> {
        if (!this.plugin.settings.bilibiliFetchTranscript || !cid) {
            return '';
        }

        try {
            const sessdata = this.plugin.settings.bilibiliSessdata?.trim();
            const headers: Record<string, string> = { ...BILIBILI_HEADERS };
            if (sessdata) {
                headers.cookie = `SESSDATA=${sessdata}`;
            }

            const playerResponse = JSON.parse(
                await request({
                    method: 'GET',
                    url: `https://api.bilibili.com/x/player/v2?bvid=${bvid}&cid=${cid}`,
                    headers,
                }),
            ) as BilibiliPlayerResponse;

            const subtitles = playerResponse?.data?.subtitle?.subtitles ?? [];
            if (subtitles.length === 0) {
                return '';
            }

            const language = this.plugin.settings.bilibiliTranscriptLanguage?.trim();
            const track =
                (language && subtitles.find((subtitle) => subtitle.lan === language)) ||
                (language && subtitles.find((subtitle) => subtitle.lan?.startsWith(`${language}-`))) ||
                subtitles.find((subtitle) => !subtitle.lan?.startsWith('ai-')) ||
                subtitles[0];

            if (!track?.subtitle_url) {
                return '';
            }

            const subtitleUrl = track.subtitle_url.startsWith('//')
                ? `https:${track.subtitle_url}`
                : track.subtitle_url;
            const subtitleFile = JSON.parse(
                await request({ method: 'GET', url: subtitleUrl, headers }),
            ) as BilibiliSubtitleFile;

            return this.formatVideoTranscript(bvid, this.parseTranscriptSegments(subtitleFile));
        } catch {
            // A missing/unavailable transcript should not block note creation.
            return '';
        }
    }

    private parseTranscriptSegments(subtitleFile: BilibiliSubtitleFile): BilibiliTranscriptSegment[] {
        return (subtitleFile.body ?? [])
            .map((line) => ({ text: (line.content ?? '').replace(/\s+/g, ' ').trim(), seconds: Math.floor(line.from) }))
            .filter((segment) => segment.text !== '');
    }

    private formatVideoTranscript(bvid: string, segments: BilibiliTranscriptSegment[]): string {
        // Group several caption segments into one block so each line is a readable chunk of text
        // prefixed by a single linked timestamp, instead of one tiny fragment per line.
        const linesPerBlock = Math.max(1, this.plugin.settings.bilibiliTranscriptLinesPerBlock);
        const blocks: BilibiliTranscriptSegment[] = [];

        segments.forEach((segment, index) => {
            if (index % linesPerBlock === 0) {
                blocks.push({ text: segment.text, seconds: segment.seconds });
            } else {
                blocks[blocks.length - 1].text += ` ${segment.text}`;
            }
        });

        return blocks
            .map((block) => {
                return this.templateEngine.render(this.plugin.settings.bilibiliTranscriptLine, {
                    transcriptTimestamp: this.formatTimestamp(block.seconds),
                    transcriptText: block.text.trim(),
                    transcriptSeconds: block.seconds,
                    transcriptUrl: `https://www.bilibili.com/video/${bvid}?t=${block.seconds}`,
                });
            }, this)
            .join('\n');
    }

    private formatTimestamp(totalSeconds: number): string {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const pad = (value: number): string => String(value).padStart(2, '0');

        return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
    }

    private formatDuration(totalSeconds: number): string {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        let formatted = '';
        if (hours > 0) {
            formatted = formatted.concat(' ', `${hours}h`);
        }
        if (minutes > 0) {
            formatted = formatted.concat(' ', `${minutes}m`);
        }
        if (seconds > 0) {
            formatted = formatted.concat(' ', `${seconds}s`);
        }

        return formatted.trim();
    }

    private formatParts(bvid: string, pages: BilibiliPage[]): string {
        if (pages.length <= 1) {
            return '';
        }

        return pages
            .map((page) => `- [P${page.page}](https://www.bilibili.com/video/${bvid}?p=${page.page}) ${page.part}`)
            .join('\n');
    }
}

export default BilibiliParser;
