import { requestUrl } from 'obsidian';
import { Note } from './Note';
import { Parser } from './Parser';
import { parseHtmlContent } from './parsehtml';
import { handleError } from 'src/helpers/error';
import { desktopBrowserUserAgent } from 'src/helpers/networkUtils';

interface XiaoyuzhouImage {
    picUrl: string;
}

interface XiaoyuzhouPodcast {
    pid: string;
    title: string;
    author: string;
    image?: XiaoyuzhouImage;
}

interface XiaoyuzhouEpisode {
    eid: string;
    title: string;
    shownotes?: string;
    description?: string;
    duration: number;
    pubDate: string;
    image?: XiaoyuzhouImage;
    enclosure?: { url: string };
    podcast: XiaoyuzhouPodcast;
}

interface XiaoyuzhouNextData {
    props?: {
        pageProps?: {
            episode?: XiaoyuzhouEpisode;
        };
    };
}

type XiaoyuzhouNoteData = {
    date: string;
    episodeId: string;
    episodeTitle: string;
    episodeURL: string;
    episodePlayer: string;
    episodeDescription: string;
    episodeThumbnail: string;
    episodeDuration: number;
    episodeDurationFormatted: string;
    episodePublishDate: string;
    podcastName: string;
    podcastAuthor: string;
    podcastURL: string;
    podcastThumbnail: string;
    audioURL: string;
};

class XiaoyuzhouParser extends Parser {
    private PATTERN = /xiaoyuzhoufm\.com\/episode\/([a-z0-9]+)/i;

    test(url: string): boolean {
        return this.isValidUrl(url) && this.PATTERN.test(url);
    }

    async prepareNote(url: string): Promise<Note> {
        const createdAt = new Date();
        let data: XiaoyuzhouNoteData;
        try {
            data = await this.getNoteData(url, createdAt);
        } catch (error) {
            handleError(error, 'Unable to parse Xiaoyuzhou episode page.');
        }

        const content = this.templateEngine.render(this.plugin.settings.xiaoyuzhouNote, data);

        const fileNameTemplate = this.templateEngine.render(this.plugin.settings.xiaoyuzhouNoteTitle, {
            title: data.episodeTitle,
            date: this.getFormattedDateForFilename(createdAt),
        });

        return new Note(fileNameTemplate, 'md', content, this.plugin.settings.xiaoyuzhouContentTypeSlug, createdAt);
    }

    private async getNoteData(url: string, createdAt: Date): Promise<XiaoyuzhouNoteData> {
        const episodeId = this.PATTERN.exec(url)?.[1] ?? '';

        const response = await requestUrl({
            method: 'GET',
            url: `https://www.xiaoyuzhoufm.com/episode/${episodeId}`,
            headers: { ...desktopBrowserUserAgent },
        });

        if (response.status === 429) {
            throw new Error('Rate limited (HTTP 429). Try again later.');
        }
        if (response.status >= 400) {
            throw new Error(`HTTP ${response.status} error fetching ${url}`);
        }

        const nextDataMatch = response.text.match(
            /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s,
        );
        if (!nextDataMatch) {
            throw new Error('Unable to locate episode data on the Xiaoyuzhou page.');
        }

        const episode = (JSON.parse(nextDataMatch[1]) as XiaoyuzhouNextData).props?.pageProps?.episode;
        if (!episode) {
            throw new Error('Xiaoyuzhou page did not contain episode data.');
        }

        const audioUrl = episode.enclosure?.url ?? '';

        return {
            date: this.getFormattedDateForContent(createdAt),
            episodeId: episode.eid,
            episodeTitle: episode.title,
            episodeURL: url,
            episodePlayer: audioUrl ? `<audio controls style="width: 100%;" src="${audioUrl}"></audio>` : '',
            episodeDescription: await this.getEpisodeDescription(episode),
            episodeThumbnail: this.toHttps(episode.image?.picUrl ?? episode.podcast.image?.picUrl ?? ''),
            episodeDuration: episode.duration,
            episodeDurationFormatted: this.formatDuration(episode.duration),
            episodePublishDate: this.getFormattedDateForContent(new Date(episode.pubDate)),
            podcastName: episode.podcast.title,
            podcastAuthor: episode.podcast.author,
            podcastURL: `https://www.xiaoyuzhoufm.com/podcast/${episode.podcast.pid}`,
            podcastThumbnail: this.toHttps(episode.podcast.image?.picUrl ?? ''),
            audioURL: audioUrl,
        };
    }

    private async getEpisodeDescription(episode: XiaoyuzhouEpisode): Promise<string> {
        if (episode.shownotes) {
            return await parseHtmlContent(episode.shownotes);
        }

        return episode.description ?? '';
    }

    private toHttps(url: string): string {
        return url.replace(/^http:/, 'https:');
    }

    private formatDuration(totalSeconds: number): string {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);

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
}

export default XiaoyuzhouParser;
