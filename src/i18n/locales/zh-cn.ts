// 简体中文 locale. Falls back to English for any missing key.
const zhCN: Record<string, string> = {
    // Commands / ribbon / menu
    'command.createFromClipboard': '从剪贴板创建',
    'command.createFromClipboardBatch': '从剪贴板批量创建',
    'command.insertAtCursor': '在光标位置插入',
    'ribbon.createFromClipboard': 'Read It Never：从剪贴板创建',
    'menu.title': 'Read It Never',

    // Notices
    'notice.failedToProcess': 'Read It Never：处理内容失败。{message}',
    'notice.unableToOpen': '无法打开 {file}',
    'notice.noteUpdated': '{file} 已更新。',
    'notice.noteNotUpdated': '{file} 未更新！',
    'notice.noteAlreadyExists': '{file} 已存在。',
    'notice.noteCreated': '{file} 创建成功',
    'notice.unableToEdit': '无法编辑 {file}',
    'notice.notReaderable': '@mozilla/readability 认为此文档不太可能被解析为可读正文。',
    'notice.maxPathLengthNumber': '最大文件路径长度必须是数字。',
    'notice.maxFileNameLengthNumber': '最大文件名长度必须是数字。',
    'notice.checkConsole': '{message} 请查看控制台输出。',

    // Settings
    'settings.inboxDir.name': '收件箱目录',
    'settings.inboxDir.desc':
        '请输入有效的目录名。嵌套目录请使用此格式：目录 A/目录 B。如果未输入目录，新笔记将创建在仓库根目录中。',
    'settings.inboxDir.placeholder': '默认为仓库根目录',
    'settings.assetsDir.name': '资源目录',
    'settings.assetsDir.desc':
        '请输入有效的目录名。嵌套目录请使用此格式：目录 A/目录 B。如果未输入目录，新笔记将创建在仓库根目录中。',
    'settings.assetsDir.placeholder': '默认为仓库根目录',
    'settings.openNewNote.name': '在当前工作区打开新笔记',
    'settings.openNewNote.desc': '启用后，新笔记将在当前工作区中打开',
    'settings.openNewNoteInNewTab.name': '在新标签页打开新笔记',
    'settings.openNewNoteInNewTab.desc': '启用后，新笔记将在新标签页中打开',
    'settings.fileExistsStrategy.name': '重名笔记处理方式',
    'settings.fileExistsStrategy.desc': '当已存在同名笔记时应用此设置',
    'settings.batchProcessDelimiter.name': '批量创建笔记分隔符',
    'settings.batchProcessDelimiter.desc': '批量笔记列表的分隔符',
    'settings.dateTitleFmt.name': '日期格式字符串',
    'settings.dateTitleFmt.desc': '%date% 变量的格式。注意：请勿使用文件名中禁止的符号。',
    'settings.dateTitleFmt.placeholder': '默认为 {fmt}',
    'settings.dateContentFmt.name': '正文中的日期格式字符串',
    'settings.dateContentFmt.desc': '正文中 %date% 变量的格式',
    'settings.dateContentFmt.placeholder': '默认为 {fmt}',
    'settings.extendShareMenu.name': '扩展分享菜单',
    'settings.extendShareMenu.desc':
        '启用后，分享菜单将增加直接从中创建笔记的快捷方式。需要重新加载插件或重启 Obsidian 才能生效。',
    'settings.youtubeApiKey.name': 'Youtube Data API v3 密钥',
    'settings.youtubeApiKey.desc': '如果填写，与 Youtube 相关的内容类型将使用 Youtube API 获取数据。',
    'settings.contentTypes.heading': '内容类型',
    'settings.contentTypes.desc': '各内容类型的设置。点击三角符号展开。',

    // Settings sections
    'settings.section.readableArticle': '可读文章',
    'settings.section.youtubeChannel': 'YouTube 频道',
    'settings.section.nonReadableArticle': '不可读文章',
    'settings.section.textSnippet': '文本片段',

    // Settings — Readable Article
    'settings.readableArticle.slug.name': '可读内容类型标识',
    'settings.readableArticle.title.name': '可读文章笔记标题模板',
    'settings.readableArticle.template.name': '可读文章笔记模板',
    'settings.readableArticle.downloadImages.name': '下载图片',
    'settings.readableArticle.downloadImages.desc':
        '文章中的图片将被下载到资源目录（仅桌面版功能）。如需动态更改目标目录，可使用变量。请查看变量参考了解更多。',
    'settings.readableArticle.downloadImagesInArticleDir.name': '将图片下载到笔记目录',
    'settings.readableArticle.downloadImagesInArticleDir.desc':
        '文章中的图片将被下载到该笔记专属的资源目录（仅桌面版功能）。此设置会覆盖资源目录模板。',

    // Settings — YouTube
    'settings.youtube.slug.name': 'Youtube 内容类型标识',
    'settings.youtube.title.name': 'Youtube 笔记标题模板',
    'settings.youtube.template.name': 'Youtube 笔记模板',
    'settings.youtube.chapter.name': 'Youtube 章节模板',
    'settings.youtube.embedWidth.name': 'Youtube 嵌入播放器宽度',
    'settings.youtube.embedHeight.name': 'Youtube 嵌入播放器高度',
    'settings.youtube.privacyEnhanced.name': '以隐私增强模式嵌入',
    'settings.youtube.privacyEnhanced.desc':
        '启用后，内容将以隐私增强模式嵌入，可避免对其的观看影响观看者在 YouTube 上的浏览体验。',
    'settings.youtube.fetchTranscript.name': '获取视频字幕文稿',
    'settings.youtube.fetchTranscript.desc':
        '启用后，将获取视频的隐藏字幕，并作为 {{ videoTranscript }} 模板变量提供。',
    'settings.youtube.transcriptLanguage.name': '字幕文稿语言',
    'settings.youtube.transcriptLanguage.desc':
        '首选字幕文稿的语言代码（例如 "en"、"zh"）。留空则使用默认/第一条可用的字幕轨道。',
    'settings.youtube.transcriptLine.name': 'Youtube 字幕文稿行模板',
    'settings.youtube.transcriptLine.desc':
        '每行字幕文稿的模板。可用变量：transcriptTimestamp、transcriptText、transcriptSeconds、transcriptUrl。',
    'settings.youtube.transcriptLinesPerBlock.name': 'Youtube 每个字幕文稿块的字幕行数',
    'settings.youtube.transcriptLinesPerBlock.desc': '归入一个带时间戳的字幕文稿块中的字幕行数。',

    // Settings — YouTube channel
    'settings.youtubeChannel.slug.name': 'Youtube 频道内容类型标识',
    'settings.youtubeChannel.title.name': 'Youtube 频道笔记标题模板',
    'settings.youtubeChannel.template.name': 'Youtube 频道笔记模板',

    // Settings — X.com
    'settings.x.slug.name': 'X.com 内容类型标识',
    'settings.x.title.name': 'X.com 笔记标题模板',
    'settings.x.template.name': 'X.com 笔记模板',

    // Settings — Bilibili
    'settings.bilibili.slug.name': 'Bilibili 内容类型标识',
    'settings.bilibili.title.name': 'Bilibili 笔记标题模板',
    'settings.bilibili.template.name': 'Bilibili 笔记模板',
    'settings.bilibili.embedWidth.name': 'Bilibili 嵌入播放器宽度',
    'settings.bilibili.embedHeight.name': 'Bilibili 嵌入播放器高度',

    // Settings — Nonreadable Article
    'settings.nonReadableArticle.slug.name': '不可读内容类型标识',
    'settings.nonReadableArticle.title.name': '不可读文章笔记标题模板',
    'settings.nonReadableArticle.template.name': '不可读文章笔记模板',

    // Settings — Text Snippet
    'settings.textSnippet.slug.name': '文本片段内容类型标识',
    'settings.textSnippet.title.name': '文本片段笔记标题模板',
    'settings.textSnippet.template.name': '文本片段笔记模板',

    // Settings — Advanced
    'settings.advanced.heading': '高级',
    'settings.filesystemLimitPath.name': '最大文件路径长度',
    'settings.filesystemLimitPath.desc': '在您当前的平台上默认为 {limit} 个字符。',
    'settings.filesystemLimitFileName.name': '最大文件名长度',
    'settings.filesystemLimitFileName.desc': '在您当前的平台上默认为 {limit} 个字符。',

    // Settings — template variable reference
    'settings.templateVariableReference.see': '请查看',
    'settings.templateVariableReference.link': '模板变量参考',
};

export default zhCN;
