import { requestUrl } from 'obsidian';
import { Note } from './Note';
import { Parser } from './Parser';
import { handleError } from 'src/helpers/error';

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
};

class BilibiliParser extends Parser {
    private PATTERN = /(bilibili.com)\/(video)?\/([a-z0-9]+)?/i;

    test(url: string): boolean {
        return this.isValidUrl(url) && this.PATTERN.test(url);
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
        const videoId = this.PATTERN.exec(url)?.[3] ?? '';
        const idQuery = /^av\d+$/i.test(videoId) ? `aid=${videoId.slice(2)}` : `bvid=${videoId}`;

        const response = await requestUrl({
            method: 'GET',
            url: `https://api.bilibili.com/x/web-interface/view?${idQuery}`,
            headers: {
                'user-agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
                referer: 'https://www.bilibili.com',
            },
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

        return {
            date: this.getFormattedDateForContent(createdAt),
            videoId: video.bvid,
            videoTitle: video.title,
            videoURL: url,
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
        };
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
