import { Delimiter } from './enums/delimiter';
import { FileExistsStrategy } from './enums/fileExistsStrategy';

export type ReadItNeverSettingValue = string | number | boolean | Delimiter | FileExistsStrategy | null;

export interface ReadItNeverSettings {
    [key: string]: ReadItNeverSettingValue;
    inboxDir: string;
    assetsDir: string;
    openNewNote: boolean;
    batchProcess: boolean; // deprecated
    batchProcessDelimiter: Delimiter;
    openNewNoteInNewTab: boolean;
    youtubeContentTypeSlug: string;
    youtubeNoteTitle: string;
    youtubeNote: string;
    youtubeChapter: string;
    youtubeEmbedWidth: string;
    youtubeEmbedHeight: string;
    youtubeUsePrivacyEnhancedEmbed: boolean;
    youtubeFetchTranscript: boolean;
    youtubeTranscriptLanguage: string;
    youtubeTranscriptLine: string;
    youtubeTranscriptLinesPerBlock: number;
    bilibiliContentTypeSlug: string;
    bilibiliNoteTitle: string;
    bilibiliNote: string;
    bilibiliEmbedWidth: string;
    bilibiliEmbedHeight: string;
    twitterContentTypeSlug: string;
    twitterNoteTitle: string;
    twitterNote: string;
    parseableArticleContentType: string;
    parseableArticleNoteTitle: string;
    parsableArticleNote: string;
    notParseableArticleContentType: string;
    notParseableArticleNoteTitle: string;
    notParsableArticleNote: string;
    textSnippetContentType: string;
    textSnippetNoteTitle: string;
    textSnippetNote: string;
    downloadImages: boolean;
    downloadImagesInArticleDir: boolean;
    dateTitleFmt: string;
    dateContentFmt: string;
    youtubeApiKey: string;
    extendShareMenu: boolean;
    filesystemLimitPath: number | null;
    filesystemLimitFileName: number | null;
    youtubeChannelContentTypeSlug: string;
    youtubeChannelNoteTitle: string;
    youtubeChannelNote: string;
    fileExistsStrategy: FileExistsStrategy;
}

export const DEFAULT_SETTINGS: ReadItNeverSettings = {
    inboxDir: 'Read It Never Inbox',
    assetsDir: 'Read It Never Inbox/assets',
    openNewNote: false,
    batchProcess: false, // deperecated
    batchProcessDelimiter: Delimiter.NewLine,
    openNewNoteInNewTab: false,
    youtubeContentTypeSlug: 'youtube',
    youtubeNoteTitle: 'Youtube - {{ title }}',
    youtubeNote:
        '#ReadItNever [[Youtube]]\n\n# [{{ videoTitle }}]({{ videoURL }})\n\n{{ videoPlayer }}\n\n{{ videoChapters }}\n\n## Transcript\n\n{{ videoTranscript }}',
    youtubeChapter: '- [{{ chapterTimestamp }}]({{ chapterUrl }}) {{ chapterTitle }}',
    youtubeEmbedWidth: '560',
    youtubeEmbedHeight: '315',
    youtubeUsePrivacyEnhancedEmbed: true,
    youtubeFetchTranscript: true,
    youtubeTranscriptLanguage: '',
    youtubeTranscriptLine: '[{{ transcriptTimestamp }}]({{ transcriptUrl }}) {{ transcriptText }}',
    youtubeTranscriptLinesPerBlock: 5,
    bilibiliContentTypeSlug: 'bilibili',
    bilibiliNoteTitle: 'Bilibili - {{ title }}',
    bilibiliNote:
        '#ReadItNever [[Bilibili]]\n\n# [{{ videoTitle }}]({{ videoURL }})\n\n{{ videoPlayer }}\n\n{{ videoParts }}\n\n## Description\n\n{{ videoDescription }}',
    bilibiliEmbedWidth: '560',
    bilibiliEmbedHeight: '315',
    twitterContentTypeSlug: 'xcom',
    twitterNoteTitle: 'Tweet from {{ tweetAuthorName }} ({{ date }})',
    twitterNote: '#ReadItNever [[Tweet]]\n\n# [{{ tweetAuthorName }}]({{ tweetURL }})\n\n{{ tweetContent }}',
    parseableArticleContentType: 'article',
    parseableArticleNoteTitle: '{{ title }}',
    parsableArticleNote: '#ReadItNever [[Article]]\n\n# [{{ articleTitle }}]({{ articleURL }})\n\n{{ articleContent }}',
    notParseableArticleContentType: 'article',
    notParseableArticleNoteTitle: 'Article {{ date }}',
    notParsableArticleNote: '#ReadItNever [[Article]]\n\n[{{ articleURL }}]({{ articleURL }})',
    textSnippetContentType: 'textsnippet',
    textSnippetNoteTitle: 'Note {{ date }}',
    textSnippetNote: '#ReadItNever [[Textsnippet]]\n\n{{ content }}',
    downloadImages: true,
    downloadImagesInArticleDir: false,
    dateTitleFmt: 'YYYY-MM-DD HH-mm-ss',
    dateContentFmt: 'YYYY-MM-DD',
    youtubeApiKey: '',
    extendShareMenu: true,
    filesystemLimitPath: null,
    filesystemLimitFileName: null,
    youtubeChannelContentTypeSlug: 'youtube-channel',
    youtubeChannelNoteTitle: '{{ title }}',
    youtubeChannelNote:
        '#ReadItNever [[YoutubeChannel]]\n\n# [{{ channelTitle }}]({{ channelURL }})\n\n![{{ channelTitle }}|300]({{ channelAvatar }})\n\n[Videos]({{ channelVideosURL }})\n\n{{ channelSubscribersCount|numberLexify }} subscribers',
    fileExistsStrategy: FileExistsStrategy.Ask,
};
