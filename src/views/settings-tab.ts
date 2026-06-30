import { App, Notice, Platform, PluginSettingTab, Setting } from 'obsidian';
import { Delimiter, getDelimiterOptions } from 'src/enums/delimiter';
import { FileExistsStrategy, getFileExistStrategyOptions } from 'src/enums/fileExistsStrategy';
import { getDefaultFilesystenLimits } from 'src/helpers/fileutils';
import { createHTMLDiv } from 'src/helpers/setting';
import { t } from 'src/i18n';
import ReadItNeverPlugin from 'src/main';
import { DEFAULT_SETTINGS } from 'src/settings';

enum DetailsItem {
    ReadableArticle = 'readableArticle',
    Youtube = 'youtube',
    YoutubeChannel = 'youtubeChannel',
    X = 'x',
    Bilibili = 'bilibili',
    NonReadableArticle = 'nonReadableArticle',
    TextSnippet = 'textSnippet',
}

export class ReadItNeverSettingsTab extends PluginSettingTab {
    plugin: ReadItNeverPlugin;

    private activeDetatils: DetailsItem[] = [];

    constructor(app: App, plugin: ReadItNeverPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName(t('settings.inboxDir.name'))
            .setDesc(t('settings.inboxDir.desc'))
            .addText((text) =>
                text
                    .setPlaceholder(t('settings.inboxDir.placeholder'))
                    .setValue(
                        typeof this.plugin.settings.inboxDir === 'undefined'
                            ? DEFAULT_SETTINGS.inboxDir
                            : this.plugin.settings.inboxDir,
                    )
                    .onChange(async (value) => {
                        this.plugin.settings.inboxDir = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName(t('settings.assetsDir.name'))
            .setDesc(t('settings.assetsDir.desc'))
            .addText((text) =>
                text
                    .setPlaceholder(t('settings.assetsDir.placeholder'))
                    .setValue(
                        typeof this.plugin.settings.assetsDir === 'undefined'
                            ? DEFAULT_SETTINGS.inboxDir + '/assets'
                            : this.plugin.settings.assetsDir,
                    )
                    .onChange(async (value) => {
                        this.plugin.settings.assetsDir = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName(t('settings.openNewNote.name'))
            .setDesc(t('settings.openNewNote.desc'))
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.openNewNote || DEFAULT_SETTINGS.openNewNote)
                    .onChange(async (value) => {
                        this.plugin.settings.openNewNote = value;
                        if (value === true) {
                            this.plugin.settings.openNewNoteInNewTab = false;
                        }
                        await this.plugin.saveSettings();
                        this.display();
                    }),
            );

        new Setting(containerEl)
            .setName(t('settings.openNewNoteInNewTab.name'))
            .setDesc(t('settings.openNewNoteInNewTab.desc'))
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.openNewNoteInNewTab || DEFAULT_SETTINGS.openNewNoteInNewTab)
                    .onChange(async (value) => {
                        this.plugin.settings.openNewNoteInNewTab = value;
                        if (value === true) {
                            this.plugin.settings.openNewNote = false;
                        }
                        await this.plugin.saveSettings();
                        this.display();
                    }),
            );

        new Setting(containerEl)
            .setName(t('settings.fileExistsStrategy.name'))
            .setDesc(t('settings.fileExistsStrategy.desc'))
            .addDropdown((dropdown) => {
                getFileExistStrategyOptions().forEach((fileExistsStrategyOption) => {
                    dropdown.addOption(fileExistsStrategyOption.option, fileExistsStrategyOption.label);
                });

                dropdown.setValue(this.plugin.settings.fileExistsStrategy || DEFAULT_SETTINGS.fileExistsStrategy);

                dropdown.onChange(async (value) => {
                    this.plugin.settings.fileExistsStrategy = value as FileExistsStrategy;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName(t('settings.batchProcessDelimiter.name'))
            .setDesc(t('settings.batchProcessDelimiter.desc'))
            .addDropdown((dropdown) => {
                getDelimiterOptions().forEach((delimiterOption) => {
                    dropdown.addOption(delimiterOption.option, delimiterOption.label);
                });

                dropdown.setValue(this.plugin.settings.batchProcessDelimiter || DEFAULT_SETTINGS.batchProcessDelimiter);

                dropdown.onChange(async (value) => {
                    this.plugin.settings.batchProcessDelimiter = value as Delimiter;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName(t('settings.dateTitleFmt.name'))
            .setDesc(t('settings.dateTitleFmt.desc'))
            .addText((text) =>
                text
                    .setPlaceholder(t('settings.dateTitleFmt.placeholder', { fmt: DEFAULT_SETTINGS.dateTitleFmt }))
                    .setValue(
                        typeof this.plugin.settings.dateTitleFmt === 'undefined'
                            ? DEFAULT_SETTINGS.dateTitleFmt
                            : this.plugin.settings.dateTitleFmt,
                    )
                    .onChange(async (value) => {
                        this.plugin.settings.dateTitleFmt = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName(t('settings.dateContentFmt.name'))
            .setDesc(t('settings.dateContentFmt.desc'))
            .addText((text) =>
                text
                    .setPlaceholder(t('settings.dateContentFmt.placeholder', { fmt: DEFAULT_SETTINGS.dateContentFmt }))
                    .setValue(
                        typeof this.plugin.settings.dateContentFmt === 'undefined'
                            ? DEFAULT_SETTINGS.dateContentFmt
                            : this.plugin.settings.dateContentFmt,
                    )
                    .onChange(async (value) => {
                        this.plugin.settings.dateContentFmt = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName(t('settings.extendShareMenu.name'))
            .setDesc(t('settings.extendShareMenu.desc'))
            .addToggle((toggle) =>
                toggle
                    .setValue(
                        Object.prototype.hasOwnProperty.call(this.plugin.settings, 'extendShareMenu')
                            ? this.plugin.settings.extendShareMenu
                            : DEFAULT_SETTINGS.extendShareMenu,
                    )
                    .onChange(async (value) => {
                        this.plugin.settings.extendShareMenu = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName(t('settings.youtubeApiKey.name'))
            .setDesc(t('settings.youtubeApiKey.desc'))
            .addText((text) =>
                text
                    .setPlaceholder('')
                    .setValue(this.plugin.settings.youtubeApiKey || DEFAULT_SETTINGS.youtubeApiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.youtubeApiKey = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl).setName(t('settings.contentTypes.heading')).setHeading();
        containerEl.createDiv({ text: t('settings.contentTypes.desc') });

        let detailsEl: HTMLElement;

        containerEl.createEl('hr', { cls: 'readitnever-setting-hr' });
        detailsEl = this.createDetailsElement(containerEl, DetailsItem.ReadableArticle);
        detailsEl.createEl('summary', {
            text: t('settings.section.readableArticle'),
            cls: 'readitnever-setting-h3',
        });

        new Setting(detailsEl)
            .setName(t('settings.readableArticle.slug.name'))
            .setDesc(this.createTemplateVariableReferenceDiv())
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.parseableArticleContentType)
                    .setValue(
                        typeof this.plugin.settings.parseableArticleContentType === 'undefined'
                            ? DEFAULT_SETTINGS.parseableArticleContentType
                            : this.plugin.settings.parseableArticleContentType,
                    )
                    .onChange(async (value) => {
                        this.plugin.settings.parseableArticleContentType = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(detailsEl)
            .setName(t('settings.readableArticle.title.name'))
            .setDesc(this.createTemplateVariableReferenceDiv())
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.parseableArticleNoteTitle)
                    .setValue(
                        this.plugin.settings.parseableArticleNoteTitle || DEFAULT_SETTINGS.parseableArticleNoteTitle,
                    )
                    .onChange(async (value) => {
                        this.plugin.settings.parseableArticleNoteTitle = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(detailsEl)
            .setName(t('settings.readableArticle.template.name'))
            .setDesc(this.createTemplateVariableReferenceDiv())
            .addTextArea((textarea) => {
                textarea
                    .setValue(this.plugin.settings.parsableArticleNote || DEFAULT_SETTINGS.parsableArticleNote)
                    .onChange(async (value) => {
                        this.plugin.settings.parsableArticleNote = value;
                        await this.plugin.saveSettings();
                    });
                textarea.inputEl.rows = 10;
                textarea.inputEl.cols = 25;
            });

        new Setting(detailsEl)
            .setName(t('settings.readableArticle.downloadImages.name'))
            .setDesc(t('settings.readableArticle.downloadImages.desc'))
            .addToggle((toggle) =>
                toggle
                    .setValue(
                        Object.prototype.hasOwnProperty.call(this.plugin.settings, 'downloadImages')
                            ? this.plugin.settings.downloadImages
                            : DEFAULT_SETTINGS.downloadImages,
                    )
                    .onChange(async (value) => {
                        this.plugin.settings.downloadImages = value;
                        if (value === false) {
                            this.plugin.settings.downloadImagesInArticleDir = false;
                        }
                        await this.plugin.saveSettings();
                        this.display();
                    }),
            );

        new Setting(detailsEl)
            .setName(t('settings.readableArticle.downloadImagesInArticleDir.name'))
            .setDesc(t('settings.readableArticle.downloadImagesInArticleDir.desc'))
            .addToggle((toggle) =>
                toggle
                    .setValue(
                        Object.prototype.hasOwnProperty.call(this.plugin.settings, 'downloadImagesInArticleDir')
                            ? this.plugin.settings.downloadImagesInArticleDir
                            : DEFAULT_SETTINGS.downloadImagesInArticleDir,
                    )
                    .onChange(async (value) => {
                        this.plugin.settings.downloadImagesInArticleDir = value;
                        if (value === true) {
                            this.plugin.settings.downloadImages = true;
                        }
                        await this.plugin.saveSettings();
                        this.display();
                    }),
            );

        containerEl.createEl('hr', { cls: 'readitnever-setting-hr' });
        detailsEl = this.createDetailsElement(containerEl, DetailsItem.Youtube);
        detailsEl.createEl('summary', {
            text: 'YouTube',
            cls: 'readitnever-setting-h3',
        });

        new Setting(detailsEl)
            .setName(t('settings.youtube.slug.name'))
            .setDesc(this.createTemplateVariableReferenceDiv())
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.youtubeContentTypeSlug)
                    .setValue(
                        typeof this.plugin.settings.youtubeContentTypeSlug === 'undefined'
                            ? DEFAULT_SETTINGS.youtubeContentTypeSlug
                            : this.plugin.settings.youtubeContentTypeSlug,
                    )
                    .onChange(async (value) => {
                        this.plugin.settings.youtubeContentTypeSlug = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(detailsEl)
            .setName(t('settings.youtube.title.name'))
            .setDesc(this.createTemplateVariableReferenceDiv())
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.youtubeNoteTitle)
                    .setValue(this.plugin.settings.youtubeNoteTitle || DEFAULT_SETTINGS.youtubeNoteTitle)
                    .onChange(async (value) => {
                        this.plugin.settings.youtubeNoteTitle = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(detailsEl)
            .setName(t('settings.youtube.template.name'))
            .setDesc(this.createTemplateVariableReferenceDiv())
            .addTextArea((textarea) => {
                textarea
                    .setValue(this.plugin.settings.youtubeNote || DEFAULT_SETTINGS.youtubeNote)
                    .onChange(async (value) => {
                        this.plugin.settings.youtubeNote = value;
                        await this.plugin.saveSettings();
                    });
                textarea.inputEl.rows = 10;
                textarea.inputEl.cols = 25;
            });

        new Setting(detailsEl)
            .setName(t('settings.youtube.chapter.name'))
            .setDesc(this.createTemplateVariableReferenceDiv())
            .addTextArea((textarea) => {
                textarea
                    .setValue(this.plugin.settings.youtubeChapter || DEFAULT_SETTINGS.youtubeChapter)
                    .onChange(async (value) => {
                        this.plugin.settings.youtubeChapter = value;
                        await this.plugin.saveSettings();
                    });
                textarea.inputEl.rows = 10;
                textarea.inputEl.cols = 25;
            });

        new Setting(detailsEl).setName(t('settings.youtube.embedWidth.name')).addText((text) =>
            text
                .setPlaceholder(DEFAULT_SETTINGS.youtubeEmbedWidth)
                .setValue(this.plugin.settings.youtubeEmbedWidth || DEFAULT_SETTINGS.youtubeEmbedWidth)
                .onChange(async (value) => {
                    this.plugin.settings.youtubeEmbedWidth = value;
                    await this.plugin.saveSettings();
                }),
        );

        new Setting(detailsEl).setName(t('settings.youtube.embedHeight.name')).addText((text) =>
            text
                .setPlaceholder(DEFAULT_SETTINGS.youtubeEmbedHeight)
                .setValue(this.plugin.settings.youtubeEmbedHeight || DEFAULT_SETTINGS.youtubeEmbedHeight)
                .onChange(async (value) => {
                    this.plugin.settings.youtubeEmbedHeight = value;
                    await this.plugin.saveSettings();
                }),
        );

        new Setting(detailsEl)
            .setName(t('settings.youtube.privacyEnhanced.name'))
            .setDesc(t('settings.youtube.privacyEnhanced.desc'))
            .addToggle((toggle) =>
                toggle
                    .setValue(
                        Object.prototype.hasOwnProperty.call(this.plugin.settings, 'youtubeUsePrivacyEnhancedEmbed')
                            ? this.plugin.settings.youtubeUsePrivacyEnhancedEmbed
                            : DEFAULT_SETTINGS.youtubeUsePrivacyEnhancedEmbed,
                    )
                    .onChange(async (value) => {
                        this.plugin.settings.youtubeUsePrivacyEnhancedEmbed = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(detailsEl)
            .setName(t('settings.youtube.fetchTranscript.name'))
            .setDesc(t('settings.youtube.fetchTranscript.desc'))
            .addToggle((toggle) =>
                toggle
                    .setValue(
                        Object.prototype.hasOwnProperty.call(this.plugin.settings, 'youtubeFetchTranscript')
                            ? this.plugin.settings.youtubeFetchTranscript
                            : DEFAULT_SETTINGS.youtubeFetchTranscript,
                    )
                    .onChange(async (value) => {
                        this.plugin.settings.youtubeFetchTranscript = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(detailsEl)
            .setName(t('settings.youtube.transcriptLanguage.name'))
            .setDesc(t('settings.youtube.transcriptLanguage.desc'))
            .addText((text) =>
                text
                    .setPlaceholder('en')
                    .setValue(
                        this.plugin.settings.youtubeTranscriptLanguage || DEFAULT_SETTINGS.youtubeTranscriptLanguage,
                    )
                    .onChange(async (value) => {
                        this.plugin.settings.youtubeTranscriptLanguage = value.trim();
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(detailsEl)
            .setName(t('settings.youtube.transcriptLine.name'))
            .setDesc(t('settings.youtube.transcriptLine.desc'))
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.youtubeTranscriptLine)
                    .setValue(this.plugin.settings.youtubeTranscriptLine || DEFAULT_SETTINGS.youtubeTranscriptLine)
                    .onChange(async (value) => {
                        this.plugin.settings.youtubeTranscriptLine = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(detailsEl)
            .setName(t('settings.youtube.transcriptLinesPerBlock.name'))
            .setDesc(t('settings.youtube.transcriptLinesPerBlock.desc'))
            .addText((text) =>
                text
                    .setPlaceholder(String(DEFAULT_SETTINGS.youtubeTranscriptLinesPerBlock))
                    .setValue(
                        String(
                            this.plugin.settings.youtubeTranscriptLinesPerBlock ||
                                DEFAULT_SETTINGS.youtubeTranscriptLinesPerBlock,
                        ),
                    )
                    .onChange(async (value) => {
                        const parsed = parseInt(value, 10);
                        this.plugin.settings.youtubeTranscriptLinesPerBlock =
                            Number.isNaN(parsed) || parsed < 1
                                ? DEFAULT_SETTINGS.youtubeTranscriptLinesPerBlock
                                : parsed;
                        await this.plugin.saveSettings();
                    }),
            );

        containerEl.createEl('hr', { cls: 'readitnever-setting-hr' });
        detailsEl = this.createDetailsElement(containerEl, DetailsItem.YoutubeChannel);
        detailsEl.createEl('summary', {
            text: t('settings.section.youtubeChannel'),
            cls: 'readitnever-setting-h3',
        });

        new Setting(detailsEl)
            .setName(t('settings.youtubeChannel.slug.name'))
            .setDesc(this.createTemplateVariableReferenceDiv())
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.youtubeChannelContentTypeSlug)
                    .setValue(
                        typeof this.plugin.settings.youtubeChannelContentTypeSlug === 'undefined'
                            ? DEFAULT_SETTINGS.youtubeChannelContentTypeSlug
                            : this.plugin.settings.youtubeChannelContentTypeSlug,
                    )
                    .onChange(async (value) => {
                        this.plugin.settings.youtubeChannelContentTypeSlug = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(detailsEl)
            .setName(t('settings.youtubeChannel.title.name'))
            .setDesc(this.createTemplateVariableReferenceDiv())
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.youtubeChannelNoteTitle)
                    .setValue(this.plugin.settings.youtubeChannelNoteTitle || DEFAULT_SETTINGS.youtubeChannelNoteTitle)
                    .onChange(async (value) => {
                        this.plugin.settings.youtubeChannelNoteTitle = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(detailsEl)
            .setName(t('settings.youtubeChannel.template.name'))
            .setDesc(this.createTemplateVariableReferenceDiv())
            .addTextArea((textarea) => {
                textarea
                    .setValue(this.plugin.settings.youtubeChannelNote || DEFAULT_SETTINGS.youtubeChannelNote)
                    .onChange(async (value) => {
                        this.plugin.settings.youtubeChannelNote = value;
                        await this.plugin.saveSettings();
                    });
                textarea.inputEl.rows = 10;
                textarea.inputEl.cols = 25;
            });

        containerEl.createEl('hr', { cls: 'readitnever-setting-hr' });
        detailsEl = this.createDetailsElement(containerEl, DetailsItem.X);
        detailsEl.createEl('summary', {
            text: 'X.com',
            cls: 'readitnever-setting-h3',
        });

        new Setting(detailsEl)
            .setName(t('settings.x.slug.name'))
            .setDesc(this.createTemplateVariableReferenceDiv())
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.twitterContentTypeSlug)
                    .setValue(
                        typeof this.plugin.settings.twitterContentTypeSlug === 'undefined'
                            ? DEFAULT_SETTINGS.twitterContentTypeSlug
                            : this.plugin.settings.twitterContentTypeSlug,
                    )
                    .onChange(async (value) => {
                        this.plugin.settings.twitterContentTypeSlug = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(detailsEl)
            .setName(t('settings.x.title.name'))
            .setDesc(this.createTemplateVariableReferenceDiv())
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.twitterNoteTitle)
                    .setValue(this.plugin.settings.twitterNoteTitle || DEFAULT_SETTINGS.twitterNoteTitle)
                    .onChange(async (value) => {
                        this.plugin.settings.twitterNoteTitle = value;
                        await this.plugin.saveSettings();
                    }),
            );
        new Setting(detailsEl)
            .setName(t('settings.x.template.name'))
            .setDesc(this.createTemplateVariableReferenceDiv())
            .addTextArea((textarea) => {
                textarea
                    .setValue(this.plugin.settings.twitterNote || DEFAULT_SETTINGS.twitterNote)
                    .onChange(async (value) => {
                        this.plugin.settings.twitterNote = value;
                        await this.plugin.saveSettings();
                    });
                textarea.inputEl.rows = 10;
                textarea.inputEl.cols = 25;
            });

        containerEl.createEl('hr', { cls: 'readitnever-setting-hr' });
        detailsEl = this.createDetailsElement(containerEl, DetailsItem.Bilibili);
        detailsEl.createEl('summary', {
            text: 'Bilibili',
            cls: 'readitnever-setting-h3',
        });

        new Setting(detailsEl)
            .setName(t('settings.bilibili.slug.name'))
            .setDesc(this.createTemplateVariableReferenceDiv())
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.bilibiliContentTypeSlug)
                    .setValue(
                        typeof this.plugin.settings.bilibiliContentTypeSlug === 'undefined'
                            ? DEFAULT_SETTINGS.bilibiliContentTypeSlug
                            : this.plugin.settings.bilibiliContentTypeSlug,
                    )
                    .onChange(async (value) => {
                        this.plugin.settings.bilibiliContentTypeSlug = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(detailsEl)
            .setName(t('settings.bilibili.title.name'))
            .setDesc(this.createTemplateVariableReferenceDiv())
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.bilibiliNoteTitle)
                    .setValue(this.plugin.settings.bilibiliNoteTitle || DEFAULT_SETTINGS.bilibiliNoteTitle)
                    .onChange(async (value) => {
                        this.plugin.settings.bilibiliNoteTitle = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(detailsEl)
            .setName(t('settings.bilibili.template.name'))
            .setDesc(this.createTemplateVariableReferenceDiv())
            .addTextArea((textarea) => {
                textarea
                    .setValue(this.plugin.settings.bilibiliNote || DEFAULT_SETTINGS.bilibiliNote)
                    .onChange(async (value) => {
                        this.plugin.settings.bilibiliNote = value;
                        await this.plugin.saveSettings();
                    });
                textarea.inputEl.rows = 10;
                textarea.inputEl.cols = 25;
            });

        new Setting(detailsEl).setName(t('settings.bilibili.embedWidth.name')).addText((text) =>
            text
                .setPlaceholder(DEFAULT_SETTINGS.bilibiliEmbedWidth)
                .setValue(this.plugin.settings.bilibiliEmbedWidth || DEFAULT_SETTINGS.bilibiliEmbedWidth)
                .onChange(async (value) => {
                    this.plugin.settings.bilibiliEmbedWidth = value;
                    await this.plugin.saveSettings();
                }),
        );

        new Setting(detailsEl).setName(t('settings.bilibili.embedHeight.name')).addText((text) =>
            text
                .setPlaceholder(DEFAULT_SETTINGS.bilibiliEmbedHeight)
                .setValue(this.plugin.settings.bilibiliEmbedHeight || DEFAULT_SETTINGS.bilibiliEmbedHeight)
                .onChange(async (value) => {
                    this.plugin.settings.bilibiliEmbedHeight = value;
                    await this.plugin.saveSettings();
                }),
        );

        containerEl.createEl('hr', { cls: 'readitnever-setting-hr' });
        detailsEl = this.createDetailsElement(containerEl, DetailsItem.NonReadableArticle);
        detailsEl.createEl('summary', {
            text: t('settings.section.nonReadableArticle'),
            cls: 'readitnever-setting-h3',
        });

        new Setting(detailsEl)
            .setName(t('settings.nonReadableArticle.slug.name'))
            .setDesc(this.createTemplateVariableReferenceDiv())
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.notParseableArticleContentType)
                    .setValue(
                        typeof this.plugin.settings.notParseableArticleContentType === 'undefined'
                            ? DEFAULT_SETTINGS.notParseableArticleContentType
                            : this.plugin.settings.notParseableArticleContentType,
                    )
                    .onChange(async (value) => {
                        this.plugin.settings.notParseableArticleContentType = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(detailsEl)
            .setName(t('settings.nonReadableArticle.title.name'))
            .setDesc(this.createTemplateVariableReferenceDiv())
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.notParseableArticleNoteTitle)
                    .setValue(
                        this.plugin.settings.notParseableArticleNoteTitle ||
                            DEFAULT_SETTINGS.notParseableArticleNoteTitle,
                    )
                    .onChange(async (value) => {
                        this.plugin.settings.notParseableArticleNoteTitle = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(detailsEl)
            .setName(t('settings.nonReadableArticle.template.name'))
            .setDesc(this.createTemplateVariableReferenceDiv())
            .addTextArea((textarea) => {
                textarea
                    .setValue(this.plugin.settings.notParsableArticleNote || DEFAULT_SETTINGS.notParsableArticleNote)
                    .onChange(async (value) => {
                        this.plugin.settings.notParsableArticleNote = value;
                        await this.plugin.saveSettings();
                    });
                textarea.inputEl.rows = 10;
                textarea.inputEl.cols = 25;
            });

        containerEl.createEl('hr', { cls: 'readitnever-setting-hr' });
        detailsEl = this.createDetailsElement(containerEl, DetailsItem.TextSnippet);
        detailsEl.createEl('summary', {
            text: t('settings.section.textSnippet'),
            cls: 'readitnever-setting-h3',
        });

        new Setting(detailsEl)
            .setName(t('settings.textSnippet.slug.name'))
            .setDesc(this.createTemplateVariableReferenceDiv())
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.textSnippetContentType)
                    .setValue(
                        typeof this.plugin.settings.textSnippetContentType === 'undefined'
                            ? DEFAULT_SETTINGS.textSnippetContentType
                            : this.plugin.settings.textSnippetContentType,
                    )
                    .onChange(async (value) => {
                        this.plugin.settings.textSnippetContentType = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(detailsEl)
            .setName(t('settings.textSnippet.title.name'))
            .setDesc(this.createTemplateVariableReferenceDiv())
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.textSnippetNoteTitle)
                    .setValue(this.plugin.settings.textSnippetNoteTitle || DEFAULT_SETTINGS.textSnippetNoteTitle)
                    .onChange(async (value) => {
                        this.plugin.settings.textSnippetNoteTitle = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(detailsEl)
            .setName(t('settings.textSnippet.template.name'))
            .setDesc(this.createTemplateVariableReferenceDiv())
            .addTextArea((textarea) => {
                textarea
                    .setValue(this.plugin.settings.textSnippetNote || DEFAULT_SETTINGS.textSnippetNote)
                    .onChange(async (value) => {
                        this.plugin.settings.textSnippetNote = value;
                        await this.plugin.saveSettings();
                    });
                textarea.inputEl.rows = 10;
                textarea.inputEl.cols = 25;
            });

        new Setting(containerEl).setName(t('settings.advanced.heading')).setHeading();

        const defaultFilesystemLimits = getDefaultFilesystenLimits(Platform);

        new Setting(containerEl)
            .setName(t('settings.filesystemLimitPath.name'))
            .setDesc(t('settings.filesystemLimitPath.desc', { limit: defaultFilesystemLimits.path }))
            .addText((text) =>
                text.setPlaceholder(String(defaultFilesystemLimits.path)).onChange(async (value) => {
                    const trimmedValue = value.trim();
                    if (trimmedValue !== '' && Number.isNaN(Number(trimmedValue))) {
                        new Notice(t('notice.maxPathLengthNumber'));
                        return;
                    }
                    if (trimmedValue === '') {
                        this.plugin.settings.filesystemLimitPath = null;
                    } else {
                        this.plugin.settings.filesystemLimitPath = Number(trimmedValue);
                    }
                    await this.plugin.saveSettings();
                }),
            );

        new Setting(containerEl)
            .setName(t('settings.filesystemLimitFileName.name'))
            .setDesc(t('settings.filesystemLimitFileName.desc', { limit: defaultFilesystemLimits.fileName }))
            .addText((text) =>
                text.setPlaceholder(String(defaultFilesystemLimits.fileName)).onChange(async (value) => {
                    const trimmedValue = value.trim();
                    if (trimmedValue !== '' && Number.isNaN(Number(trimmedValue))) {
                        new Notice(t('notice.maxFileNameLengthNumber'));
                        return;
                    }
                    if (trimmedValue === '') {
                        this.plugin.settings.filesystemLimitFileName = null;
                    } else {
                        this.plugin.settings.filesystemLimitFileName = Number(trimmedValue);
                    }
                    await this.plugin.saveSettings();
                }),
            );
    }

    private createDetailsElement(parentElement: HTMLElement, itemId: DetailsItem): HTMLElement {
        const details = parentElement.createEl('details');
        details.addEventListener('toggle', () => {
            if (details.open) {
                this.activeDetatils.push(itemId);
            } else {
                this.activeDetatils = this.activeDetatils.filter((item) => item !== itemId);
            }
        });

        if (this.activeDetatils.includes(itemId)) {
            details.setAttribute('open', '');
        }

        return details;
    }

    private createTemplateVariableReferenceDiv(prepend = ''): DocumentFragment {
        return createHTMLDiv(
            `<p>${prepend} ${t(
                'settings.templateVariableReference.see',
            )}<a href="https://github.com/DominikPieper/obsidian-ReadItNever?tab=readme-ov-file#template-engine">${t(
                'settings.templateVariableReference.link',
            )}</a></p>`,
        );
    }
}
