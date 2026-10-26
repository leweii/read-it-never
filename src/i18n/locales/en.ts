// English locale — also the fallback. Keys are dot-namespaced by area.
const en: Record<string, string> = {
    // Commands / ribbon / menu
    'command.createFromClipboard': 'Create from clipboard',
    'command.createFromClipboardBatch': 'Create from batch in clipboard',
    'command.insertAtCursor': 'Insert at the cursor position',
    'ribbon.createFromClipboard': 'Read It Never: Create from clipboard',
    'menu.title': 'Read It Never',

    // Notices
    'notice.processing': 'Read It Never: Saving {content}…',
    'notice.processingBatch': 'Read It Never: Saving {current} of {total}…',
    'notice.batchSummary': 'Read It Never: {created} created, {existing} already existed, {failed} failed.',
    'notice.failedToProcess': 'Read It Never: Failed to process content. {message}',
    'notice.failedToProcessItem': 'Read It Never: Failed to process {content}. {message}',
    'notice.unableToSave': 'Unable to save {file}: {message}',
    'notice.unableToOpen': 'Unable to open {file}',
    'notice.noteUpdated': '{file} was updated.',
    'notice.noteNotUpdated': '{file} was not updated!',
    'notice.noteAlreadyExists': '{file} already exists.',
    'notice.notesAlreadyExist': '{count} notes already exist and were skipped.',
    'notice.noteCreated': '{file} created successfully',
    'notice.notReaderable': '@mozilla/readability considers this document to unlikely be readerable.',
    'notice.emptyContent': 'Read It Never: Nothing to save, the clipboard is empty.',
    'notice.clipboardUnavailable': 'Read It Never: Unable to read the clipboard.',
    'notice.alreadyProcessing': 'Read It Never: This content is already being saved.',

    // Duplicate note modal
    'modal.fileExists.title': 'Duplicate notes detected',
    'modal.fileExists.desc': 'Notes with these names already exist ({count}):',
    'modal.fileExists.doNotAskAgain': 'Remember my choice',
    'modal.fileExists.append': 'Append to existing',
    'modal.fileExists.skip': 'Skip',

    // Settings — tabs and sections
    'settings.tab.general': 'General',
    'settings.tab.contentTypes': 'Content types',
    'settings.tab.integrations': 'Accounts & API',
    'settings.tab.advanced': 'Advanced',
    'settings.section.storage': 'Storage',
    'settings.section.afterCreating': 'After saving',
    'settings.section.dates': 'Date formats',
    'settings.section.input': 'Input',
    'settings.section.noteTemplate': 'Note',
    'settings.section.images': 'Images',
    'settings.section.player': 'Embedded player',
    'settings.section.chapters': 'Chapters',
    'settings.section.transcript': 'Transcript',
    'settings.section.filesystemLimits': 'File system limits',
    'settings.section.readableArticle': 'Article',
    'settings.section.youtubeChannel': 'YouTube channel',
    'settings.section.bilibili': 'Bilibili',
    'settings.section.xiaoyuzhou': 'Xiaoyuzhou',
    'settings.section.podcast': 'Podcast (RSS)',
    'settings.section.nonReadableArticle': 'Unreadable page',
    'settings.section.textSnippet': 'Text snippet',

    // Settings — General
    'settings.inboxDir.name': 'Inbox directory',
    'settings.inboxDir.desc':
        'Where new notes are created, e.g. "Reading/Inbox". Supports {{ date }}, {{ contentType }} and {{ fileName }}. Leave empty for the vault root.',
    'settings.inboxDir.placeholder': 'Vault root',
    'settings.assetsDir.name': 'Assets directory',
    'settings.assetsDir.desc':
        'Where downloaded images are stored. Supports {{ date }}, {{ contentType }} and {{ fileName }}. Leave empty for the vault root.',
    'settings.assetsDir.placeholder': 'Vault root',
    'settings.openNote.name': 'Open the new note',
    'settings.openNote.desc': 'What to do with a note after it has been saved.',
    'settings.openNote.doNotOpen': "Don't open",
    'settings.openNote.currentTab': 'Open in current tab',
    'settings.openNote.newTab': 'Open in new tab',
    'settings.fileExistsStrategy.name': 'When a note with the same name exists',
    'settings.fileExistsStrategy.desc': 'Applied when a note with the same file name already exists.',
    'settings.fileExistsStrategy.ask': 'Ask every time',
    'settings.fileExistsStrategy.nothing': 'Skip',
    'settings.fileExistsStrategy.append': 'Append to the existing note',
    'settings.dateTitleFmt.name': 'Date format in file names',
    'settings.dateTitleFmt.desc':
        'Moment.js format of {{ date }} in title templates. Avoid characters not allowed in file names.',
    'settings.dateContentFmt.name': 'Date format in notes',
    'settings.dateContentFmt.desc': 'Moment.js format of dates inside note content.',
    'settings.dateFormat.preview': 'Preview: {preview}',
    'settings.batchProcessDelimiter.name': 'Batch delimiter',
    'settings.batchProcessDelimiter.desc': 'Separates links when using "Create from batch in clipboard".',
    'settings.delimiter.newLine': 'New line',
    'settings.delimiter.comma': 'Comma',
    'settings.delimiter.period': 'Period',
    'settings.delimiter.semicolon': 'Semicolon',
    'settings.extendShareMenu.name': 'Add to share menu',
    'settings.extendShareMenu.desc':
        'Adds "Read It Never" to the share menu on mobile. Requires reloading the plugin or restarting Obsidian.',

    // Settings — Content types
    'settings.contentTypes.desc': 'Choose a content type to customise how its notes are named and what they contain.',
    'settings.contentType.title.name': 'File name template',
    'settings.contentType.template.name': 'Note template',
    'settings.contentType.slug.name': 'Content type slug',
    'settings.contentType.slug.desc': 'Available as {{ contentType }} in the inbox and assets directory paths.',
    'settings.template.variables': 'Variables:',
    'settings.template.insertVariable': 'Insert {variable}',
    'settings.templateVariableReference.see': 'Templates support variables, filters and loops. See the ',
    'settings.templateVariableReference.link': 'template reference',
    'settings.resetToDefault': 'Reset to default',
    'settings.readableArticle.downloadImages.name': 'Download images',
    'settings.readableArticle.downloadImages.desc':
        'Save article images into the assets directory so notes work offline (desktop only).',
    'settings.readableArticle.downloadImagesInArticleDir.name': 'Separate folder per note',
    'settings.readableArticle.downloadImagesInArticleDir.desc':
        "Store each article's images in a subfolder named after the note inside the assets directory.",
    'settings.embedSize.name': 'Player size',
    'settings.embedSize.desc': 'Width and height of the embedded player in pixels.',
    'settings.youtube.privacyEnhanced.name': 'Privacy-enhanced mode',
    'settings.youtube.privacyEnhanced.desc':
        'Embed via youtube-nocookie.com so watching in Obsidian does not affect your YouTube recommendations.',
    'settings.youtube.chapter.name': 'Chapter line template',
    'settings.youtube.fetchTranscript.name': 'Fetch transcript',
    'settings.youtube.fetchTranscript.desc': 'Make the closed captions available as {{ videoTranscript }}.',
    'settings.youtube.transcriptLanguage.name': 'Transcript language',
    'settings.youtube.transcriptLanguage.desc':
        'Preferred language code, e.g. "en" or "zh". Leave empty for the default track.',
    'settings.youtube.transcriptLine.name': 'Transcript line template',
    'settings.youtube.transcriptLinesPerBlock.name': 'Caption lines per block',
    'settings.youtube.transcriptLinesPerBlock.desc': 'Number of caption lines grouped under one timestamp.',
    'settings.bilibili.fetchTranscript.name': 'Fetch subtitles',
    'settings.bilibili.fetchTranscript.desc':
        'Make the subtitles available as {{ videoTranscript }}. Requires a SESSDATA cookie.',
    'settings.bilibili.transcriptLanguage.name': 'Subtitle language',
    'settings.bilibili.transcriptLanguage.desc':
        'Preferred language code, e.g. "zh-CN" or "en". Leave empty to prefer human subtitles over AI-generated ones.',
    'settings.bilibili.transcriptLine.name': 'Subtitle line template',
    'settings.bilibili.transcriptLinesPerBlock.name': 'Subtitle lines per block',
    'settings.bilibili.transcriptLinesPerBlock.desc': 'Number of subtitle lines grouped under one timestamp.',
    'settings.bilibili.sessdataMissing': 'Bilibili only returns subtitles to logged-in users. Add your SESSDATA in ',

    // Settings — Accounts & API
    'settings.youtubeApiKey.name': 'YouTube Data API v3 key',
    'settings.youtubeApiKey.desc':
        'Optional. With a key, YouTube metadata (duration, tags, exact dates) is fetched from the official API.',
    'settings.youtubeApiKey.howTo': 'How to get an API key',
    'settings.bilibili.sessdata.name': 'SESSDATA cookie',
    'settings.bilibili.sessdata.desc':
        'Log in at bilibili.com, open developer tools → Application → Cookies and copy the SESSDATA value.',
    'settings.secret.toggleVisibility': 'Show / hide',
    'settings.integrations.storageNote':
        "Keys are stored in plain text in this plugin's data.json inside your vault. Be careful when syncing or sharing your vault.",

    // Settings — Advanced
    'settings.filesystemLimits.desc':
        'Long titles are shortened to fit these limits (measured in bytes). Leave empty to use the platform default.',
    'settings.filesystemLimitPath.name': 'Maximum file path length',
    'settings.filesystemLimitPath.desc': 'Platform default: {limit}.',
    'settings.filesystemLimitFileName.name': 'Maximum file name length',
    'settings.filesystemLimitFileName.desc': 'Platform default: {limit}.',
};

export default en;
