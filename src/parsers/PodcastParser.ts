import { requestUrl } from 'obsidian';
import { Note } from './Note';
import { Parser } from './Parser';
import { parseHtmlContent } from './parsehtml';
import { handleError } from 'src/helpers/error';
import { desktopBrowserUserAgent } from 'src/helpers/networkUtils';

type PodcastNoteData = {
    date: string;
    episodeTitle: string;
    episodeURL: string;
    episodePlayer: string;
    episodeDescription: string;
    episodeThumbnail: string;
    episodeDurationFormatted: string;
    episodePublishDate: string;
    podcastName: string;
    podcastAuthor: string;
    feedURL: string;
    audioURL: string;
};

class PodcastParser extends Parser {
    // Only URLs that look like a feed (not every website); actual podcast feeds don't share a
    // hostname pattern the way Xiaoyuzhou/Bilibili/Youtube do.
    private PATTERN = /(\.(rss|xml)(?:$|[?#])|\/(feed|rss)\/?(?:$|[?#]))/i;

    test(url: string): boolean {
        return this.isValidUrl(url) && this.PATTERN.test(url);
    }

    async prepareNote(url: string): Promise<Note> {
        const createdAt = new Date();
        let data: PodcastNoteData;
        try {
            data = await this.getNoteData(url, createdAt);
        } catch (error) {
            handleError(error, 'Unable to parse podcast feed.');
        }

        const content = this.templateEngine.render(this.plugin.settings.podcastNote, data);

        const fileNameTemplate = this.templateEngine.render(this.plugin.settings.podcastNoteTitle, {
            title: data.episodeTitle,
            date: this.getFormattedDateForFilename(createdAt),
        });

        return new Note(fileNameTemplate, 'md', content, this.plugin.settings.podcastContentTypeSlug, createdAt);
    }

    private async getNoteData(url: string, createdAt: Date): Promise<PodcastNoteData> {
        const response = await requestUrl({
            method: 'GET',
            url,
            headers: { ...desktopBrowserUserAgent },
        });

        if (response.status === 429) {
            throw new Error('Rate limited (HTTP 429). Try again later.');
        }
        if (response.status >= 400) {
            throw new Error(`HTTP ${response.status} error fetching ${url}`);
        }

        const feed = new DOMParser().parseFromString(response.text, 'text/xml');
        if (feed.querySelector('parsererror')) {
            throw new Error(`${url} is not a valid RSS/Atom feed.`);
        }

        const channel = feed.querySelector('channel') ?? feed.documentElement;
        const item = feed.querySelector('item');
        if (!item) {
            throw new Error(`No episodes found in feed ${url}.`);
        }

        const audioUrl = item.querySelector('enclosure')?.getAttribute('url') ?? '';
        if (!audioUrl) {
            throw new Error(`Latest item in ${url} has no audio enclosure.`);
        }

        const descriptionHtml =
            item.getElementsByTagName('content:encoded')[0]?.textContent ??
            item.querySelector('description')?.textContent ??
            '';
        const pubDate = item.querySelector('pubDate')?.textContent?.trim();
        const thumbnail =
            item.getElementsByTagName('itunes:image')[0]?.getAttribute('href') ??
            channel.getElementsByTagName('itunes:image')[0]?.getAttribute('href') ??
            channel.querySelector('image > url')?.textContent?.trim() ??
            '';

        return {
            date: this.getFormattedDateForContent(createdAt),
            episodeTitle: item.querySelector('title')?.textContent?.trim() || 'Untitled episode',
            episodeURL: item.querySelector('link')?.textContent?.trim() || url,
            episodePlayer: `<audio controls style="width: 100%;" src="${audioUrl}"></audio>`,
            episodeDescription: descriptionHtml ? await parseHtmlContent(descriptionHtml) : '',
            episodeThumbnail: thumbnail,
            episodeDurationFormatted: this.formatDuration(
                item.getElementsByTagName('itunes:duration')[0]?.textContent?.trim() ?? '',
            ),
            episodePublishDate: pubDate ? this.getFormattedDateForContent(new Date(pubDate)) : '',
            podcastName: channel.querySelector('title')?.textContent?.trim() ?? '',
            podcastAuthor: channel.getElementsByTagName('itunes:author')[0]?.textContent?.trim() ?? '',
            feedURL: url,
            audioURL: audioUrl,
        };
    }

    /**
     * `itunes:duration` is either plain seconds ("2416") or a "HH:MM:SS"/"MM:SS" clock string.
     */
    private formatDuration(rawDuration: string): string {
        if (!rawDuration) {
            return '';
        }

        const totalSeconds = /^\d+$/.test(rawDuration)
            ? parseInt(rawDuration, 10)
            : rawDuration
                  .split(':')
                  .map((part) => parseInt(part, 10))
                  .reduce((total, part) => total * 60 + part, 0);

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

export default PodcastParser;
