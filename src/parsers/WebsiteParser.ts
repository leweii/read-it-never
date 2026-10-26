import { Notice, Platform, requestUrl } from 'obsidian';
import { Readability, isProbablyReaderable } from '@mozilla/readability';
import DOMPurify from 'isomorphic-dompurify';
import { Note, NoteContentProcessor } from './Note';
import { Parser } from './Parser';
import { parseHtmlContent } from './parsehtml';
import { getBaseUrl, normalizeFilename } from 'src/helpers/fileutils';
import { replaceImages } from 'src/helpers/replaceImages';
import { desktopBrowserUserAgent } from 'src/helpers/networkUtils';
import { t } from 'src/i18n';

interface ReadabilityArticle {
    title: string;
    content: string;
    textContent: string;
    length: number;
    excerpt: string;
    byline: string;
    dir: string;
    siteName: string;
    lang: string;
    publishedTime: string;
}

type WebsiteNoteData = {
    date: string;
    articleTitle: string;
    articleURL: string;
    articleReadingTime: number;
    articleContent: string;
    siteName: string;
    author: string;
    previewURL: string;
    publishedTime: string;
    readabilityArticle: ReadabilityArticle;
    articleOgDescription: string;
    articleMetaAuthor: string;
    articlePublishedTime: string;
};

const CJK_CHARACTERS_PER_MINUTE = 400;

class WebsiteParser extends Parser {
    test(url: string): boolean {
        return this.isValidUrl(url);
    }

    async prepareNote(url: string): Promise<Note> {
        const originUrl = new URL(url);
        const document = await this.getDocument(originUrl);

        return this.makeNote(document, originUrl);
    }

    protected async makeNote(document: Document, originUrl: URL): Promise<Note> {
        if (!isProbablyReaderable(document)) {
            new Notice(t('notice.notReaderable'));
        }

        const createdAt = new Date();
        const previewUrl = this.extractPreviewUrl(document);

        // Extract OG/meta fields for template variables and thin-content fallback
        const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') ?? '';
        const ogDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content') ?? '';
        const ogSiteName = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ?? '';
        const metaAuthor =
            document.querySelector('meta[name="author"]')?.getAttribute('content') ??
            document.querySelector('meta[property="article:author"]')?.getAttribute('content') ??
            '';
        const rawPublishedTime =
            document.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ?? '';

        const readableDocument = new Readability(document).parse();

        if (readableDocument === null || !Object.prototype.hasOwnProperty.call(readableDocument, 'content')) {
            return this.notParsableArticle(originUrl.href, previewUrl, createdAt, {
                title: ogTitle,
                description: ogDescription,
                siteName: ogSiteName,
            });
        }

        // Fall back to not-parsable path for thin content (JS-rendered pages, paywalls, etc.)
        if (readableDocument.textContent.trim().length < 100) {
            return this.notParsableArticle(originUrl.href, previewUrl, createdAt, {
                title: ogTitle,
                description: ogDescription,
                siteName: ogSiteName,
            });
        }

        const content = await parseHtmlContent(readableDocument.content);

        return this.parsableArticle(
            {
                date: this.getFormattedDateForContent(createdAt),
                articleTitle: readableDocument.title || ogTitle || 'No title',
                articleURL: originUrl.href,
                articleReadingTime: this.getEstimatedReadingTime(readableDocument),
                articleContent: content,
                siteName: readableDocument.siteName || ogSiteName || '',
                author: readableDocument.byline || metaAuthor || '',
                previewURL: previewUrl || '',
                publishedTime:
                    readableDocument.publishedTime !== null
                        ? this.getFormattedDateForContent(readableDocument.publishedTime)
                        : '',
                readabilityArticle: readableDocument,
                articleOgDescription: ogDescription,
                articleMetaAuthor: metaAuthor,
                articlePublishedTime: rawPublishedTime ? this.getFormattedDateForContent(rawPublishedTime) : '',
            },
            createdAt,
        );
    }

    protected async getDocument(url: URL): Promise<Document> {
        const document = await this.parseHtmlDom(url);

        //check for existing base element
        const originBasElements = document.getElementsByTagName('base');
        let originBaseUrl = null;
        if (originBasElements.length > 0) {
            originBaseUrl = originBasElements.item(0).getAttribute('href');
            Array.from(originBasElements).forEach((originBasEl) => {
                originBasEl.remove();
            });
        }

        // Set base to allow Readability to resolve relative path's
        const baseEl = document.createElement('base');
        baseEl.setAttribute('href', getBaseUrl(originBaseUrl ?? url.href, url.origin));
        document.head.append(baseEl);
        const cleanDocumentBody = DOMPurify.sanitize(document.body.innerHTML, { RETURN_DOM_FRAGMENT: true });
        document.body.empty();
        document.body.append(cleanDocumentBody);

        /*
        DOM optimizations from MarkDownload. Distributed under an Apache License 2.0: https://github.com/deathau/markdownload/blob/main/LICENSE
        */
        document.body.querySelectorAll('pre br')?.forEach((br) => {
            // we need to keep <br> tags because they are removed by Readability.js
            br.replaceWith(br.ownerDocument.createElement('br-keep'));
        });

        document.body.querySelectorAll('h1, h2, h3, h4, h5, h6')?.forEach((header) => {
            // Readability.js will strip out headings from the dom if certain words appear in their className
            // See: https://github.com/mozilla/readability/issues/807
            header.className = '';
        });

        document.body.querySelectorAll('[class*=highlight-text],[class*=highlight-source]')?.forEach((codeSource) => {
            const language = codeSource.className.match(/highlight-(?:text|source)-([a-z0-9]+)/)?.[1];
            if (language && codeSource.firstElementChild?.nodeName === 'PRE') {
                codeSource.removeAttribute('data-snippet-clipboard-copy-content');
                codeSource.firstElementChild.id = `code-lang-${language}`;
            }
        });

        document.body.querySelectorAll('[class*=language-]')?.forEach((codeSource) => {
            const language = codeSource.className.match(/language-([a-z0-9]+)/)?.[1];
            if (language) {
                codeSource.id = `code-lang-${language}`;
            }
        });

        document.body.querySelectorAll('.codehilite > pre')?.forEach((codeSource) => {
            if (codeSource.firstChild?.nodeName !== 'CODE' && !codeSource.className.includes('language')) {
                codeSource.id = 'code-lang-text';
            }
        });

        //fix for substack images
        document.body.querySelectorAll('.captioned-image-container figure')?.forEach((figure) => {
            const imgEl = figure.querySelector('img');
            if (!imgEl) {
                return;
            }

            figure.querySelector('.image-link')?.remove();
            figure.prepend(imgEl);
        });

        //fix for Readability removing <figure> elements in <div>
        document.body.querySelectorAll('div > figure')?.forEach((figure) => {
            figure.parentElement?.before(figure);
        });

        //fix for WeChat site (https://github.com/DominikPieper/obsidian-ReadItNever/issues/187)
        document.body.querySelector('.rich_media_content.js_underline_content')?.removeAttribute('style');
        document.body.querySelectorAll('.rich_media_content.js_underline_content img[data-src]')?.forEach((imgEl) => {
            if (imgEl.getAttribute('src') === null) {
                imgEl.setAttribute('src', imgEl.getAttribute('data-src'));
            }
        });

        return document;
    }

    protected async parsableArticle(data: WebsiteNoteData, createdAt: Date): Promise<Note> {
        const fileNameTemplate = this.templateEngine.render(this.plugin.settings.parseableArticleNoteTitle, {
            title: data.articleTitle,
            date: this.getFormattedDateForFilename(createdAt),
        });

        const content = this.templateEngine.render(this.plugin.settings.parsableArticleNote, data);

        return new Note(
            fileNameTemplate,
            'md',
            content,
            this.plugin.settings.parseableArticleContentType,
            createdAt,
            this.getImageProcessor(fileNameTemplate, createdAt, this.plugin.settings.parseableArticleContentType),
        );
    }

    protected async notParsableArticle(
        url: string,
        previewUrl: string | null,
        createdAt: Date,
        ogData?: { title?: string; description?: string; siteName?: string },
    ): Promise<Note> {
        console.warn(`Read It Never: ${url} is not parseable, saving link only.`);

        const content = this.templateEngine.render(this.plugin.settings.notParsableArticleNote, {
            articleURL: url,
            previewURL: previewUrl ?? '',
            articleTitle: ogData?.title ?? '',
            articleOgDescription: ogData?.description ?? '',
            siteName: ogData?.siteName ?? '',
        });

        const fileNameTemplate = this.templateEngine.render(this.plugin.settings.notParseableArticleNoteTitle, {
            date: this.getFormattedDateForFilename(createdAt),
            title: ogData?.title || new URL(url).hostname,
        });

        return new Note(
            fileNameTemplate,
            'md',
            content,
            this.plugin.settings.notParseableArticleContentType,
            createdAt,
            this.getImageProcessor(fileNameTemplate, createdAt, this.plugin.settings.notParseableArticleContentType),
        );
    }

    /**
     * Extracts a preview URL from the document.
     * Searches for OpenGraph `og:image` and Twitter `twitter:image` meta tags.
     * @param document The document to extract preview URL from
     */
    protected extractPreviewUrl(document: Document): string | null {
        let previewMetaElement = document.querySelector('meta[property="og:image"]');
        if (previewMetaElement == null) {
            previewMetaElement = document.querySelector('meta[name="twitter:image"]');
        }
        return previewMetaElement?.getAttribute('content');
    }

    /**
     * Returns a processor downloading remote images into the vault, or `null` if disabled.
     * Runs only once the note is about to be written, so skipped notes leave no orphaned images.
     */
    protected getImageProcessor(fileName: string, createdAt: Date, contentType: string): NoteContentProcessor | null {
        if (!this.plugin.settings.downloadImages || !Platform.isDesktop) {
            return null;
        }

        const assetsDir = this.getAssetsDir(fileName, createdAt, contentType);
        return (content: string) => replaceImages(this.plugin, normalizeFilename(fileName), content, assetsDir);
    }

    protected getAssetsDir(fileName: string, createdAt: Date, contentType: string): string {
        if (this.plugin.settings.downloadImagesInArticleDir) {
            const assetsDir = this.templateEngine.render(this.plugin.settings.assetsDir, {
                date: '',
                fileName: '',
                contentType: '',
            });
            return `${assetsDir}/${normalizeFilename(fileName)}`;
        }

        return this.templateEngine.render(this.plugin.settings.assetsDir, {
            date: this.getFormattedDateForFilename(createdAt),
            fileName: normalizeFilename(fileName),
            contentType,
        });
    }

    /**
     * Returns estimated reading time of article in minutes
     */
    private getEstimatedReadingTime(article: ReadabilityArticle): number {
        const text = article.textContent.trim();

        // CJK text has no spaces between words; count characters instead (~400 characters/minute).
        const cjkCharacters = text.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/g)?.length ?? 0;
        const otherWords = text
            .replace(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/g, ' ')
            .split(/\s+/)
            .filter((word) => word !== '').length;

        const lang = (article.lang || 'en').toLowerCase().split('-')[0];
        const minutes = cjkCharacters / CJK_CHARACTERS_PER_MINUTE + otherWords / this.getReadingSpeed(lang);

        return Math.max(1, Math.ceil(minutes));
    }

    /**
     * Reading speed in words per minute. Data are gathered from this study https://irisreading.com/average-reading-speed-in-various-languages/
     */
    private getReadingSpeed(lang: string): number {
        const readingSpeed = new Map<string, number>([
            ['en', 228],
            ['ar', 138],
            ['de', 179],
            ['es', 218],
            ['fi', 161],
            ['fr', 195],
            ['he', 187],
            ['it', 188],
            ['ja', 193],
            ['nl', 202],
            ['pl', 166],
            ['pt', 181],
            ['ru', 184],
            ['sk', 190],
            ['sl', 180],
            ['sv', 199],
            ['tr', 166],
            ['zh', 158],
        ]);

        return readingSpeed.get(lang) || readingSpeed.get('en');
    }

    private async parseHtmlDom(url: URL): Promise<Document> {
        const response = await requestUrl({
            method: 'GET',
            url: url.href,
            headers: { ...desktopBrowserUserAgent },
        });

        const buffer = response.arrayBuffer;
        const headerCharset = this.getCharsetFromContentType(response.headers?.['content-type']);
        const document = this.decodeHtml(buffer, headerCharset ?? 'utf-8');

        // Without a charset in the response header, honour the one declared in the document. The
        // response body is re-decoded locally; no second request is made.
        if (headerCharset === null) {
            const metaCharset = document.querySelector('meta[charset], meta[http-equiv="Content-Type" i]');
            const documentCharset = this.normalizeCharset(
                metaCharset?.getAttribute('charset') ??
                    this.getCharsetFromContentType(metaCharset?.getAttribute('content')),
            );
            if (documentCharset !== null && documentCharset !== 'utf-8') {
                return this.decodeHtml(buffer, documentCharset);
            }
        }

        return document;
    }

    private decodeHtml(buffer: ArrayBuffer, charset: string): Document {
        let decoder: TextDecoder;
        try {
            decoder = new TextDecoder(charset);
        } catch {
            // Unknown encoding label; fall back to UTF-8 rather than failing the whole note.
            decoder = new TextDecoder('utf-8');
        }

        return new DOMParser().parseFromString(decoder.decode(buffer), 'text/html');
    }

    private getCharsetFromContentType(contentType: string | null | undefined): string | null {
        return this.normalizeCharset(contentType?.match(/charset\s*=\s*([^;]+)/i)?.[1]);
    }

    private normalizeCharset(charset: string | null | undefined): string | null {
        const normalized = charset
            ?.trim()
            .replace(/^["']|["']$/g, '')
            .toLowerCase();
        if (!normalized) {
            return null;
        }
        return normalized === 'utf8' ? 'utf-8' : normalized;
    }
}

export default WebsiteParser;
