import {
    App,
    Debouncer,
    Platform,
    PluginSettingTab,
    Setting,
    TextAreaComponent,
    TextComponent,
    debounce,
} from 'obsidian';
import { Delimiter, getDelimiterOptions } from 'src/enums/delimiter';
import { FileExistsStrategy, getFileExistStrategyOptions } from 'src/enums/fileExistsStrategy';
import { formatCurrentDate } from 'src/helpers/date';
import { getDefaultFilesystenLimits } from 'src/helpers/fileutils';
import { t } from 'src/i18n';
import ReadItNeverPlugin from 'src/main';
import { DEFAULT_SETTINGS, ReadItNeverSettingValue } from 'src/settings';

const TEMPLATE_REFERENCE_URL = 'https://github.com/leweii/read-it-never#template-engine';
const YOUTUBE_API_KEY_URL = 'https://developers.google.com/youtube/v3/getting-started';

enum SettingsTabId {
    General = 'general',
    ContentTypes = 'contentTypes',
    Integrations = 'integrations',
    Advanced = 'advanced',
}

enum OpenNoteMode {
    DoNotOpen = 'doNotOpen',
    CurrentTab = 'currentTab',
    NewTab = 'newTab',
}

interface ContentTypeDefinition {
    id: string;
    label: () => string;
    slugKey: string;
    titleKey: string;
    noteKey: string;
    titleVariables: string[];
    noteVariables: string[];
    renderExtra?: (containerEl: HTMLElement) => void;
}

type TemplateInput = TextComponent | TextAreaComponent;

export class ReadItNeverSettingsTab extends PluginSettingTab {
    plugin: ReadItNeverPlugin;

    private activeTab: SettingsTabId = SettingsTabId.General;
    private activeContentType = 'article';
    private readonly save: Debouncer<[], void>;

    constructor(app: App, plugin: ReadItNeverPlugin) {
        super(app, plugin);
        this.plugin = plugin;
        // Text fields fire on every keystroke; batch writes to data.json.
        this.save = debounce(() => void this.plugin.saveSettings(), 500, true);
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.addClass('rin-settings');

        this.renderTabBar(containerEl);

        const tabContentEl = containerEl.createDiv({ cls: 'rin-settings-tab-content' });
        switch (this.activeTab) {
            case SettingsTabId.General:
                this.renderGeneralTab(tabContentEl);
                break;
            case SettingsTabId.ContentTypes:
                this.renderContentTypesTab(tabContentEl);
                break;
            case SettingsTabId.Integrations:
                this.renderIntegrationsTab(tabContentEl);
                break;
            case SettingsTabId.Advanced:
                this.renderAdvancedTab(tabContentEl);
                break;
        }
    }

    hide(): void {
        // Flush pending debounced writes when the settings window closes.
        this.save.run();
        super.hide();
    }

    // ---------------------------------------------------------------------------------------------
    // Layout
    // ---------------------------------------------------------------------------------------------

    private renderTabBar(containerEl: HTMLElement): void {
        const tabs: { id: SettingsTabId; label: string }[] = [
            { id: SettingsTabId.General, label: t('settings.tab.general') },
            { id: SettingsTabId.ContentTypes, label: t('settings.tab.contentTypes') },
            { id: SettingsTabId.Integrations, label: t('settings.tab.integrations') },
            { id: SettingsTabId.Advanced, label: t('settings.tab.advanced') },
        ];

        const tabBarEl = containerEl.createDiv({ cls: 'rin-settings-tabs', attr: { role: 'tablist' } });
        for (const tab of tabs) {
            const tabEl = tabBarEl.createEl('button', {
                text: tab.label,
                cls: 'rin-settings-tab',
                attr: { role: 'tab', 'aria-selected': String(tab.id === this.activeTab) },
            });
            tabEl.toggleClass('is-active', tab.id === this.activeTab);
            tabEl.addEventListener('click', () => {
                this.activeTab = tab.id;
                this.display();
            });
        }
    }

    private addSection(containerEl: HTMLElement, title: string, description?: string): HTMLElement {
        const sectionEl = containerEl.createDiv({ cls: 'rin-settings-section' });
        new Setting(sectionEl).setName(title).setHeading();
        if (description) {
            sectionEl.createEl('p', { text: description, cls: 'rin-settings-section-desc setting-item-description' });
        }
        return sectionEl;
    }

    // ---------------------------------------------------------------------------------------------
    // Tabs
    // ---------------------------------------------------------------------------------------------

    private renderGeneralTab(containerEl: HTMLElement): void {
        const storageEl = this.addSection(containerEl, t('settings.section.storage'));
        this.addTextSetting(storageEl, 'inboxDir', t('settings.inboxDir.name'), t('settings.inboxDir.desc'), {
            placeholder: t('settings.inboxDir.placeholder'),
        });
        this.addTextSetting(storageEl, 'assetsDir', t('settings.assetsDir.name'), t('settings.assetsDir.desc'), {
            placeholder: t('settings.assetsDir.placeholder'),
        });

        const afterEl = this.addSection(containerEl, t('settings.section.afterCreating'));
        new Setting(afterEl)
            .setName(t('settings.openNote.name'))
            .setDesc(t('settings.openNote.desc'))
            .addDropdown((dropdown) =>
                dropdown
                    .addOption(OpenNoteMode.DoNotOpen, t('settings.openNote.doNotOpen'))
                    .addOption(OpenNoteMode.CurrentTab, t('settings.openNote.currentTab'))
                    .addOption(OpenNoteMode.NewTab, t('settings.openNote.newTab'))
                    .setValue(this.getOpenNoteMode())
                    .onChange(async (value) => {
                        this.plugin.settings.openNewNote = value === OpenNoteMode.CurrentTab;
                        this.plugin.settings.openNewNoteInNewTab = value === OpenNoteMode.NewTab;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(afterEl)
            .setName(t('settings.fileExistsStrategy.name'))
            .setDesc(t('settings.fileExistsStrategy.desc'))
            .addDropdown((dropdown) => {
                getFileExistStrategyOptions().forEach((option) => dropdown.addOption(option.option, option.label));
                dropdown
                    .setValue(this.plugin.settings.fileExistsStrategy ?? DEFAULT_SETTINGS.fileExistsStrategy)
                    .onChange(async (value) => {
                        this.plugin.settings.fileExistsStrategy = value as FileExistsStrategy;
                        await this.plugin.saveSettings();
                    });
            });

        const datesEl = this.addSection(containerEl, t('settings.section.dates'));
        this.addDateFormatSetting(
            datesEl,
            'dateTitleFmt',
            t('settings.dateTitleFmt.name'),
            t('settings.dateTitleFmt.desc'),
        );
        this.addDateFormatSetting(
            datesEl,
            'dateContentFmt',
            t('settings.dateContentFmt.name'),
            t('settings.dateContentFmt.desc'),
        );

        const inputEl = this.addSection(containerEl, t('settings.section.input'));
        new Setting(inputEl)
            .setName(t('settings.batchProcessDelimiter.name'))
            .setDesc(t('settings.batchProcessDelimiter.desc'))
            .addDropdown((dropdown) => {
                getDelimiterOptions().forEach((option) => dropdown.addOption(option.option, option.label));
                dropdown
                    .setValue(this.plugin.settings.batchProcessDelimiter ?? DEFAULT_SETTINGS.batchProcessDelimiter)
                    .onChange(async (value) => {
                        this.plugin.settings.batchProcessDelimiter = value as Delimiter;
                        await this.plugin.saveSettings();
                    });
            });
        this.addToggleSetting(
            inputEl,
            'extendShareMenu',
            t('settings.extendShareMenu.name'),
            t('settings.extendShareMenu.desc'),
        );
    }

    private renderContentTypesTab(containerEl: HTMLElement): void {
        const definitions = this.getContentTypeDefinitions();
        const active = definitions.find((definition) => definition.id === this.activeContentType) ?? definitions[0];

        containerEl.createEl('p', {
            text: t('settings.contentTypes.desc'),
            cls: 'setting-item-description rin-settings-section-desc',
        });

        const pillsEl = containerEl.createDiv({ cls: 'rin-content-type-pills' });
        for (const definition of definitions) {
            const pillEl = pillsEl.createEl('button', { text: definition.label(), cls: 'rin-content-type-pill' });
            pillEl.toggleClass('is-active', definition.id === active.id);
            pillEl.addEventListener('click', () => {
                this.activeContentType = definition.id;
                this.display();
            });
        }

        const noteEl = this.addSection(containerEl, t('settings.section.noteTemplate'));
        noteEl.createEl('p', { cls: 'setting-item-description rin-settings-section-desc' }, (descEl) => {
            descEl.appendText(t('settings.templateVariableReference.see'));
            descEl.createEl('a', { text: t('settings.templateVariableReference.link'), href: TEMPLATE_REFERENCE_URL });
        });

        this.addTemplateSetting(noteEl, active.titleKey, t('settings.contentType.title.name'), active.titleVariables, {
            multiline: false,
        });
        this.addTemplateSetting(noteEl, active.noteKey, t('settings.contentType.template.name'), active.noteVariables, {
            multiline: true,
        });
        this.addTextSetting(
            noteEl,
            active.slugKey,
            t('settings.contentType.slug.name'),
            t('settings.contentType.slug.desc'),
            {
                placeholder: String(DEFAULT_SETTINGS[active.slugKey]),
                resettable: true,
            },
        );

        active.renderExtra?.(containerEl);
    }

    private renderIntegrationsTab(containerEl: HTMLElement): void {
        const youtubeEl = this.addSection(containerEl, 'YouTube');
        const youtubeKeyDesc = createFragment((fragment) => {
            fragment.appendText(t('settings.youtubeApiKey.desc'));
            fragment.createEl('br');
            fragment.createEl('a', { text: t('settings.youtubeApiKey.howTo'), href: YOUTUBE_API_KEY_URL });
        });
        this.addSecretSetting(youtubeEl, 'youtubeApiKey', t('settings.youtubeApiKey.name'), youtubeKeyDesc);

        const bilibiliEl = this.addSection(containerEl, t('settings.section.bilibili'));
        this.addSecretSetting(
            bilibiliEl,
            'bilibiliSessdata',
            t('settings.bilibili.sessdata.name'),
            t('settings.bilibili.sessdata.desc'),
        );

        containerEl.createEl('p', {
            text: t('settings.integrations.storageNote'),
            cls: 'setting-item-description rin-settings-section-desc',
        });
    }

    private renderAdvancedTab(containerEl: HTMLElement): void {
        const defaultLimits = getDefaultFilesystenLimits(Platform);
        const limitsEl = this.addSection(
            containerEl,
            t('settings.section.filesystemLimits'),
            t('settings.filesystemLimits.desc'),
        );

        this.addOptionalNumberSetting(
            limitsEl,
            'filesystemLimitPath',
            t('settings.filesystemLimitPath.name'),
            t('settings.filesystemLimitPath.desc', { limit: defaultLimits.path }),
            defaultLimits.path,
        );
        this.addOptionalNumberSetting(
            limitsEl,
            'filesystemLimitFileName',
            t('settings.filesystemLimitFileName.name'),
            t('settings.filesystemLimitFileName.desc', { limit: defaultLimits.fileName }),
            defaultLimits.fileName,
        );
    }

    // ---------------------------------------------------------------------------------------------
    // Content type definitions
    // ---------------------------------------------------------------------------------------------

    private getContentTypeDefinitions(): ContentTypeDefinition[] {
        const titleVariables = ['title', 'date'];

        return [
            {
                id: 'article',
                label: () => t('settings.section.readableArticle'),
                slugKey: 'parseableArticleContentType',
                titleKey: 'parseableArticleNoteTitle',
                noteKey: 'parsableArticleNote',
                titleVariables,
                noteVariables: [
                    'articleTitle',
                    'articleURL',
                    'articleContent',
                    'articleReadingTime',
                    'siteName',
                    'author',
                    'previewURL',
                    'publishedTime',
                    'articleOgDescription',
                    'date',
                ],
                renderExtra: (containerEl) => this.renderImageSettings(containerEl),
            },
            {
                id: 'youtube',
                label: () => 'YouTube',
                slugKey: 'youtubeContentTypeSlug',
                titleKey: 'youtubeNoteTitle',
                noteKey: 'youtubeNote',
                titleVariables,
                noteVariables: [
                    'videoTitle',
                    'videoURL',
                    'videoPlayer',
                    'videoChapters',
                    'videoTranscript',
                    'videoDescription',
                    'videoThumbnail',
                    'videoDurationFormatted',
                    'videoPublishDate',
                    'videoViewsCount',
                    'videoTags',
                    'channelName',
                    'channelURL',
                    'date',
                ],
                renderExtra: (containerEl) => this.renderYoutubeSettings(containerEl),
            },
            {
                id: 'youtubeChannel',
                label: () => t('settings.section.youtubeChannel'),
                slugKey: 'youtubeChannelContentTypeSlug',
                titleKey: 'youtubeChannelNoteTitle',
                noteKey: 'youtubeChannelNote',
                titleVariables,
                noteVariables: [
                    'channelTitle',
                    'channelURL',
                    'channelDescription',
                    'channelAvatar',
                    'channelBanner',
                    'channelSubscribersCount',
                    'channelVideosCount',
                    'channelVideosURL',
                    'channelShortsURL',
                    'date',
                ],
            },
            {
                id: 'bilibili',
                label: () => t('settings.section.bilibili'),
                slugKey: 'bilibiliContentTypeSlug',
                titleKey: 'bilibiliNoteTitle',
                noteKey: 'bilibiliNote',
                titleVariables,
                noteVariables: [
                    'videoTitle',
                    'videoURL',
                    'videoPlayer',
                    'videoParts',
                    'videoTranscript',
                    'videoDescription',
                    'videoThumbnail',
                    'videoDurationFormatted',
                    'videoPublishDate',
                    'videoViewsCount',
                    'channelName',
                    'channelURL',
                    'date',
                ],
                renderExtra: (containerEl) => this.renderBilibiliSettings(containerEl),
            },
            {
                id: 'x',
                label: () => 'X (Twitter)',
                slugKey: 'twitterContentTypeSlug',
                titleKey: 'twitterNoteTitle',
                noteKey: 'twitterNote',
                titleVariables: ['tweetAuthorName', 'date'],
                noteVariables: ['tweetAuthorName', 'tweetURL', 'tweetContent', 'tweetPublishDate', 'date'],
            },
            {
                id: 'xiaoyuzhou',
                label: () => t('settings.section.xiaoyuzhou'),
                slugKey: 'xiaoyuzhouContentTypeSlug',
                titleKey: 'xiaoyuzhouNoteTitle',
                noteKey: 'xiaoyuzhouNote',
                titleVariables,
                noteVariables: [
                    'episodeTitle',
                    'episodeURL',
                    'episodePlayer',
                    'episodeDescription',
                    'episodeThumbnail',
                    'episodeDurationFormatted',
                    'episodePublishDate',
                    'podcastName',
                    'podcastAuthor',
                    'podcastURL',
                    'audioURL',
                    'date',
                ],
            },
            {
                id: 'podcast',
                label: () => t('settings.section.podcast'),
                slugKey: 'podcastContentTypeSlug',
                titleKey: 'podcastNoteTitle',
                noteKey: 'podcastNote',
                titleVariables,
                noteVariables: [
                    'episodeTitle',
                    'episodeURL',
                    'episodePlayer',
                    'episodeDescription',
                    'episodeThumbnail',
                    'episodeDurationFormatted',
                    'episodePublishDate',
                    'podcastName',
                    'podcastAuthor',
                    'feedURL',
                    'audioURL',
                    'date',
                ],
            },
            {
                id: 'nonReadableArticle',
                label: () => t('settings.section.nonReadableArticle'),
                slugKey: 'notParseableArticleContentType',
                titleKey: 'notParseableArticleNoteTitle',
                noteKey: 'notParsableArticleNote',
                titleVariables,
                noteVariables: ['articleURL', 'articleTitle', 'articleOgDescription', 'siteName', 'previewURL'],
            },
            {
                id: 'textSnippet',
                label: () => t('settings.section.textSnippet'),
                slugKey: 'textSnippetContentType',
                titleKey: 'textSnippetNoteTitle',
                noteKey: 'textSnippetNote',
                titleVariables: ['date'],
                noteVariables: ['content', 'date'],
            },
        ];
    }

    private renderImageSettings(containerEl: HTMLElement): void {
        const imagesEl = this.addSection(containerEl, t('settings.section.images'));
        this.addToggleSetting(
            imagesEl,
            'downloadImages',
            t('settings.readableArticle.downloadImages.name'),
            t('settings.readableArticle.downloadImages.desc'),
            { rerender: true },
        );

        if (this.plugin.settings.downloadImages) {
            this.addToggleSetting(
                imagesEl,
                'downloadImagesInArticleDir',
                t('settings.readableArticle.downloadImagesInArticleDir.name'),
                t('settings.readableArticle.downloadImagesInArticleDir.desc'),
            );
        }
    }

    private renderYoutubeSettings(containerEl: HTMLElement): void {
        const playerEl = this.addSection(containerEl, t('settings.section.player'));
        this.addEmbedSizeSetting(playerEl, 'youtubeEmbedWidth', 'youtubeEmbedHeight');
        this.addToggleSetting(
            playerEl,
            'youtubeUsePrivacyEnhancedEmbed',
            t('settings.youtube.privacyEnhanced.name'),
            t('settings.youtube.privacyEnhanced.desc'),
        );

        const chaptersEl = this.addSection(containerEl, t('settings.section.chapters'));
        this.addTemplateSetting(
            chaptersEl,
            'youtubeChapter',
            t('settings.youtube.chapter.name'),
            ['chapterTimestamp', 'chapterTitle', 'chapterUrl', 'chapterSeconds'],
            { multiline: false },
        );

        this.renderTranscriptSettings(containerEl, 'youtube', 'en');
    }

    private renderBilibiliSettings(containerEl: HTMLElement): void {
        const playerEl = this.addSection(containerEl, t('settings.section.player'));
        this.addEmbedSizeSetting(playerEl, 'bilibiliEmbedWidth', 'bilibiliEmbedHeight');

        this.renderTranscriptSettings(containerEl, 'bilibili', 'zh-CN');

        if (this.plugin.settings.bilibiliFetchTranscript && !this.plugin.settings.bilibiliSessdata) {
            containerEl.createDiv({ cls: 'rin-settings-callout' }, (calloutEl) => {
                calloutEl.appendText(t('settings.bilibili.sessdataMissing'));
                calloutEl
                    .createEl('a', { text: t('settings.tab.integrations'), href: '#' })
                    .addEventListener('click', (event) => {
                        event.preventDefault();
                        this.activeTab = SettingsTabId.Integrations;
                        this.display();
                    });
            });
        }
    }

    private renderTranscriptSettings(
        containerEl: HTMLElement,
        prefix: 'youtube' | 'bilibili',
        languagePlaceholder: string,
    ): void {
        const transcriptEl = this.addSection(containerEl, t('settings.section.transcript'));
        this.addToggleSetting(
            transcriptEl,
            `${prefix}FetchTranscript`,
            t(`settings.${prefix}.fetchTranscript.name`),
            t(`settings.${prefix}.fetchTranscript.desc`),
            { rerender: true },
        );

        if (!this.plugin.settings[`${prefix}FetchTranscript`]) {
            return;
        }

        this.addTextSetting(
            transcriptEl,
            `${prefix}TranscriptLanguage`,
            t(`settings.${prefix}.transcriptLanguage.name`),
            t(`settings.${prefix}.transcriptLanguage.desc`),
            { placeholder: languagePlaceholder, trim: true },
        );
        this.addTemplateSetting(
            transcriptEl,
            `${prefix}TranscriptLine`,
            t(`settings.${prefix}.transcriptLine.name`),
            ['transcriptTimestamp', 'transcriptText', 'transcriptUrl', 'transcriptSeconds'],
            { multiline: false },
        );
        this.addNumberSetting(
            transcriptEl,
            `${prefix}TranscriptLinesPerBlock`,
            t(`settings.${prefix}.transcriptLinesPerBlock.name`),
            t(`settings.${prefix}.transcriptLinesPerBlock.desc`),
        );
    }

    // ---------------------------------------------------------------------------------------------
    // Setting builders
    // ---------------------------------------------------------------------------------------------

    private getOpenNoteMode(): OpenNoteMode {
        if (this.plugin.settings.openNewNoteInNewTab) {
            return OpenNoteMode.NewTab;
        }
        return this.plugin.settings.openNewNote ? OpenNoteMode.CurrentTab : OpenNoteMode.DoNotOpen;
    }

    private getValue(key: string): ReadItNeverSettingValue {
        return this.plugin.settings[key] ?? DEFAULT_SETTINGS[key];
    }

    private setValue(key: string, value: ReadItNeverSettingValue): void {
        this.plugin.settings[key] = value;
        this.save();
    }

    private addTextSetting(
        containerEl: HTMLElement,
        key: string,
        name: string,
        desc: string | DocumentFragment,
        options: { placeholder?: string; trim?: boolean; resettable?: boolean } = {},
    ): Setting {
        let input: TextComponent;
        const setting = new Setting(containerEl)
            .setName(name)
            .setDesc(desc)
            .addText((text) => {
                input = text;
                text.setPlaceholder(options.placeholder ?? '')
                    .setValue(String(this.getValue(key) ?? ''))
                    .onChange((value) => this.setValue(key, options.trim ? value.trim() : value));
            });

        if (options.resettable) {
            this.addResetButton(setting, key, () => input.setValue(String(DEFAULT_SETTINGS[key])));
        }

        return setting;
    }

    private addSecretSetting(containerEl: HTMLElement, key: string, name: string, desc: string | DocumentFragment) {
        let input: TextComponent;
        new Setting(containerEl)
            .setName(name)
            .setDesc(desc)
            .addText((text) => {
                input = text;
                text.inputEl.type = 'password';
                text.inputEl.autocomplete = 'off';
                text.setValue(String(this.getValue(key) ?? '')).onChange((value) => this.setValue(key, value.trim()));
            })
            .addExtraButton((button) =>
                button
                    .setIcon('eye')
                    .setTooltip(t('settings.secret.toggleVisibility'))
                    .onClick(() => {
                        const hidden = input.inputEl.type === 'password';
                        input.inputEl.type = hidden ? 'text' : 'password';
                        button.setIcon(hidden ? 'eye-off' : 'eye');
                    }),
            );
    }

    private addTemplateSetting(
        containerEl: HTMLElement,
        key: string,
        name: string,
        variables: string[],
        options: { multiline: boolean },
    ): void {
        let input: TemplateInput;
        const setting = new Setting(containerEl).setName(name);
        setting.settingEl.addClass('rin-setting-template');

        if (options.multiline) {
            setting.settingEl.addClass('rin-setting-stacked');
            setting.addTextArea((textarea) => {
                input = textarea;
                textarea.inputEl.rows = 10;
                textarea.inputEl.addClass('rin-template-input');
            });
        } else {
            setting.addText((text) => {
                input = text;
                text.inputEl.addClass('rin-template-input');
            });
        }

        input
            .setPlaceholder(String(DEFAULT_SETTINGS[key]))
            .setValue(String(this.getValue(key) ?? ''))
            .onChange((value) => this.setValue(key, value));

        this.addResetButton(setting, key, () => input.setValue(String(DEFAULT_SETTINGS[key])));

        // An empty template would produce empty notes or nameless files; restore the default instead.
        input.inputEl.addEventListener('blur', () => {
            if (input.getValue().trim() === '') {
                input.setValue(String(DEFAULT_SETTINGS[key]));
                this.setValue(key, DEFAULT_SETTINGS[key]);
            }
        });

        if (variables.length > 0) {
            const variablesEl = setting.descEl.createDiv({ cls: 'rin-variable-chips' });
            variablesEl.createSpan({ text: t('settings.template.variables'), cls: 'rin-variable-chips-label' });
            for (const variable of variables) {
                const chipEl = variablesEl.createEl('button', {
                    text: variable,
                    cls: 'rin-variable-chip',
                    attr: { 'aria-label': t('settings.template.insertVariable', { variable }) },
                });
                chipEl.addEventListener('click', (event) => {
                    event.preventDefault();
                    this.insertAtCursor(input.inputEl, `{{ ${variable} }}`);
                });
            }
        }
    }

    private insertAtCursor(inputEl: HTMLInputElement | HTMLTextAreaElement, text: string): void {
        const start = inputEl.selectionStart ?? inputEl.value.length;
        const end = inputEl.selectionEnd ?? inputEl.value.length;
        inputEl.setRangeText(text, start, end, 'end');
        inputEl.focus();
        // Notify the Setting component so the change is persisted.
        inputEl.dispatchEvent(new Event('input'));
    }

    private addResetButton(setting: Setting, key: string, onReset: () => void): void {
        setting.addExtraButton((button) =>
            button
                .setIcon('rotate-ccw')
                .setTooltip(t('settings.resetToDefault'))
                .onClick(() => {
                    this.setValue(key, DEFAULT_SETTINGS[key]);
                    onReset();
                }),
        );
    }

    private addToggleSetting(
        containerEl: HTMLElement,
        key: string,
        name: string,
        desc: string,
        options: { rerender?: boolean } = {},
    ): void {
        new Setting(containerEl)
            .setName(name)
            .setDesc(desc)
            .addToggle((toggle) =>
                toggle.setValue(Boolean(this.getValue(key))).onChange(async (value) => {
                    this.plugin.settings[key] = value;
                    await this.plugin.saveSettings();
                    if (options.rerender) {
                        this.display();
                    }
                }),
            );
    }

    private addNumberSetting(containerEl: HTMLElement, key: string, name: string, desc: string): void {
        new Setting(containerEl)
            .setName(name)
            .setDesc(desc)
            .addText((text) => {
                text.inputEl.type = 'number';
                text.inputEl.min = '1';
                text.setPlaceholder(String(DEFAULT_SETTINGS[key]))
                    .setValue(String(this.getValue(key)))
                    .onChange((value) => {
                        const parsed = parseInt(value, 10);
                        this.setValue(key, Number.isNaN(parsed) || parsed < 1 ? DEFAULT_SETTINGS[key] : parsed);
                    });
            });
    }

    private addOptionalNumberSetting(
        containerEl: HTMLElement,
        key: string,
        name: string,
        desc: string,
        defaultValue: number,
    ): void {
        new Setting(containerEl)
            .setName(name)
            .setDesc(desc)
            .addText((text) => {
                text.inputEl.type = 'number';
                text.inputEl.min = '1';
                const current = this.plugin.settings[key];
                text.setPlaceholder(String(defaultValue))
                    .setValue(current === null || current === undefined ? '' : String(current))
                    .onChange((value) => {
                        const parsed = parseInt(value.trim(), 10);
                        // Empty or invalid input falls back to the platform default.
                        this.setValue(key, Number.isNaN(parsed) || parsed < 1 ? null : parsed);
                    });
            });
    }

    private addDateFormatSetting(containerEl: HTMLElement, key: string, name: string, desc: string): void {
        const previewEl = createSpan({ cls: 'rin-date-preview' });
        const updatePreview = (format: string) =>
            previewEl.setText(t('settings.dateFormat.preview', { preview: formatCurrentDate(format) }));

        const descFragment = createFragment((fragment) => {
            fragment.appendText(desc);
            fragment.createEl('br');
            fragment.append(previewEl);
        });

        new Setting(containerEl)
            .setName(name)
            .setDesc(descFragment)
            .addMomentFormat((format) =>
                format
                    .setDefaultFormat(String(DEFAULT_SETTINGS[key]))
                    .setValue(String(this.getValue(key)))
                    .onChange((value) => {
                        this.setValue(key, value);
                        updatePreview(value || String(DEFAULT_SETTINGS[key]));
                    }),
            );

        updatePreview(String(this.getValue(key)) || String(DEFAULT_SETTINGS[key]));
    }

    private addEmbedSizeSetting(containerEl: HTMLElement, widthKey: string, heightKey: string): void {
        new Setting(containerEl)
            .setName(t('settings.embedSize.name'))
            .setDesc(t('settings.embedSize.desc'))
            .addText((text) => {
                text.inputEl.addClass('rin-embed-size-input');
                text.setPlaceholder(String(DEFAULT_SETTINGS[widthKey]))
                    .setValue(String(this.getValue(widthKey)))
                    .onChange((value) => this.setValue(widthKey, value.trim()));
            })
            .addText((text) => {
                text.inputEl.addClass('rin-embed-size-input');
                text.setPlaceholder(String(DEFAULT_SETTINGS[heightKey]))
                    .setValue(String(this.getValue(heightKey)))
                    .onChange((value) => this.setValue(heightKey, value.trim()));
            });
    }
}
