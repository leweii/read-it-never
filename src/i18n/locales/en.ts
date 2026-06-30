// English locale — also the fallback. Keys are dot-namespaced by area.
const en: Record<string, string> = {
    // Commands / ribbon / menu
    'command.createFromClipboard': 'Create from clipboard',
    'command.createFromClipboardBatch': 'Create from batch in clipboard',
    'command.insertAtCursor': 'Insert at the cursor position',
    'ribbon.createFromClipboard': 'Read It Never: Create from clipboard',
    'menu.title': 'Read It Never',

    // Notices
    'notice.failedToProcess': 'Read It Never: Failed to process content. {message}',
    'notice.unableToOpen': 'Unable to open {file}',
    'notice.noteUpdated': '{file} was updated.',
    'notice.noteNotUpdated': '{file} was not updated!',
    'notice.noteAlreadyExists': '{file} already exists.',
    'notice.noteCreated': '{file} created successfully',
    'notice.unableToEdit': 'Unable to edit {file}',
    'notice.notReaderable': '@mozilla/readability considers this document to unlikely be readerable.',
    'notice.maxPathLengthNumber': 'Maximum file path length must be a number.',
    'notice.maxFileNameLengthNumber': 'Maximum file name length must be a number.',
    'notice.checkConsole': '{message} Check the console output.',

    // Settings
    'settings.inboxDir.name': 'Inbox directory',
    'settings.inboxDir.desc':
        'Enter valid directory name. For nested directory use this format: Directory A/Directory B. If no directory is entered, new note will be created in vault root.',
    'settings.inboxDir.placeholder': 'Defaults to vault root directory',
    'settings.assetsDir.name': 'Assets directory',
    'settings.assetsDir.desc':
        'Enter valid directory name. For nested directory use this format: Directory A/Directory B. If no directory is entered, new note will be created in Vault root.',
    'settings.assetsDir.placeholder': 'Defaults to vault root directory',
    'settings.openNewNote.name': 'Open new note in current workspace',
    'settings.openNewNote.desc': 'If enabled, new note will open in current workspace',
    'settings.openNewNoteInNewTab.name': 'Open new note in new tab',
    'settings.openNewNoteInNewTab.desc': 'If enabled, new note will open in new tab',
    'settings.fileExistsStrategy.name': 'Duplicate note filename behavior',
    'settings.fileExistsStrategy.desc': 'Applied when note with the same filename already exists',
    'settings.batchProcessDelimiter.name': 'Batch note creation delimiter',
    'settings.batchProcessDelimiter.desc': 'Delimiter for batch list of notes',
    'settings.dateTitleFmt.name': 'Date format string',
    'settings.dateTitleFmt.desc': 'Format of the %date% variable. NOTE: do not use symbols forbidden in file names.',
    'settings.dateTitleFmt.placeholder': 'Defaults to {fmt}',
    'settings.dateContentFmt.name': 'Date format string in content',
    'settings.dateContentFmt.desc': 'Format of the %date% variable for content',
    'settings.dateContentFmt.placeholder': 'Defaults to {fmt}',
    'settings.extendShareMenu.name': 'Extend share menu',
    'settings.extendShareMenu.desc':
        'If enabled, share menu will be extended with shortcut to create note directly from it. Requires plugin reload or Obsidian restart to apply change.',
    'settings.youtubeApiKey.name': 'Youtube Data API v3 key',
    'settings.youtubeApiKey.desc': 'If entered, Youtube related content types will use Youtube API to fetc the data.',
    'settings.contentTypes.heading': 'Content Types',
    'settings.contentTypes.desc': 'Settings for each content. Click on caret to expand.',

    // Settings sections
    'settings.section.readableArticle': 'Readable Article',
    'settings.section.youtubeChannel': 'YouTube channel',
    'settings.section.nonReadableArticle': 'Nonreadable Article',
    'settings.section.textSnippet': 'Text Snippet',

    // Settings — Readable Article
    'settings.readableArticle.slug.name': 'Readable content type slug',
    'settings.readableArticle.title.name': 'Readable article note template title',
    'settings.readableArticle.template.name': 'Readable article note template',
    'settings.readableArticle.downloadImages.name': 'Download images',
    'settings.readableArticle.downloadImages.desc':
        'Images from article will be downloaded to the assets directory (Desktop App feature only). To dynamically change destination directory you can use variables. Check variables reference to learn more.',
    'settings.readableArticle.downloadImagesInArticleDir.name': 'Download images to note directory',
    'settings.readableArticle.downloadImagesInArticleDir.desc':
        'Images from article will be downloaded to the dedicated note assets directory (Desktop App feature only). Overrides assets directory template.',

    // Settings — YouTube
    'settings.youtube.slug.name': 'Youtube content type slug',
    'settings.youtube.title.name': 'Youtube note template title',
    'settings.youtube.template.name': 'Youtube note template',
    'settings.youtube.chapter.name': 'Youtube chapter template',
    'settings.youtube.embedWidth.name': 'Youtube embed player width',
    'settings.youtube.embedHeight.name': 'Youtube embed player height',
    'settings.youtube.privacyEnhanced.name': 'Embed in privacy enhanced mode',
    'settings.youtube.privacyEnhanced.desc':
        'If enabled, content will be embeded in privacy enhanced mode, which prevents the use of views of it from influencing the viewer’s browsing experience on YouTube.',
    'settings.youtube.fetchTranscript.name': 'Fetch video transcript',
    'settings.youtube.fetchTranscript.desc':
        'If enabled, the video closed captions are fetched and made available as the {{ videoTranscript }} template variable.',
    'settings.youtube.transcriptLanguage.name': 'Transcript language',
    'settings.youtube.transcriptLanguage.desc':
        'Preferred transcript language code (e.g. "en", "zh"). Leave empty to use the default/first available track.',
    'settings.youtube.transcriptLine.name': 'Youtube transcript line template',
    'settings.youtube.transcriptLine.desc':
        'Template for each transcript line. Available variables: transcriptTimestamp, transcriptText, transcriptSeconds, transcriptUrl.',
    'settings.youtube.transcriptLinesPerBlock.name': 'Youtube transcript caption lines per block',
    'settings.youtube.transcriptLinesPerBlock.desc':
        'Number of caption lines grouped into one timestamped transcript block.',

    // Settings — YouTube channel
    'settings.youtubeChannel.slug.name': 'Youtube channel content type slug',
    'settings.youtubeChannel.title.name': 'Youtube channel note template title',
    'settings.youtubeChannel.template.name': 'Youtube channel note template',

    // Settings — X.com
    'settings.x.slug.name': 'X.com content type slug',
    'settings.x.title.name': 'X.com note template title',
    'settings.x.template.name': 'X.com note template',

    // Settings — Bilibili
    'settings.bilibili.slug.name': 'Bilibili content type slug',
    'settings.bilibili.title.name': 'Bilibili note template title',
    'settings.bilibili.template.name': 'Bilibili note template',
    'settings.bilibili.embedWidth.name': 'Bilibili embed player width',
    'settings.bilibili.embedHeight.name': 'Bilibili embed player height',

    // Settings — Nonreadable Article
    'settings.nonReadableArticle.slug.name': 'Nonreadable content type slug',
    'settings.nonReadableArticle.title.name': 'Nonreadable article note template title',
    'settings.nonReadableArticle.template.name': 'Nonreadable article note template',

    // Settings — Text Snippet
    'settings.textSnippet.slug.name': 'Text Snippet content type slug',
    'settings.textSnippet.title.name': 'Text snippet note template title',
    'settings.textSnippet.template.name': 'Text snippet note template',

    // Settings — Advanced
    'settings.advanced.heading': 'Advanced',
    'settings.filesystemLimitPath.name': 'Maximum file path length',
    'settings.filesystemLimitPath.desc': 'Defaults to {limit} characters on your current platform.',
    'settings.filesystemLimitFileName.name': 'Maximum file name length',
    'settings.filesystemLimitFileName.desc': 'Defaults to {limit} characters on your current platform.',

    // Settings — template variable reference
    'settings.templateVariableReference.see': 'See the ',
    'settings.templateVariableReference.link': 'template variables reference',
};

export default en;
