# Read It Never Plugin for Obsidian

> A rebranded fork of [ReadItLater](https://github.com/DominikPieper/obsidian-ReadItLater) by Dominik Pieper.

## Table of contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Content Types](#content-types)
    - [Website Article](#website-article)
    - [Youtube](#youtube)
    - [Youtube Channel](#youtube-channel)
    - [Twitter](#twitter)
    - [Bilibili](#bilibili)
    - [Text Snippet](#text-snippet)
- [API](#api)

## Introduction

Save the web with Read It Never plugin for Obsidian. Archive web pages for reading later, referencing in your second brain or for other flexible use case Obsidian provides.

Read It Never can do a lot more than converting web pages to markdown. For every content type there is specific template with carefully selected variables to ease up your archiving process.

### What makes Read It Never plugin great?

- Simple, but powerful template engine
- Carefully selected predefined template variables to straightforward archiving process
- Compatibility with Obsidian iOS and Android apps
- Downloading images from articles to your Vault
- Batch processing of URLs list

## Installation

This plugin is distributed outside the Obsidian community store.

**Via [BRAT](https://github.com/TfTHacker/obsidian42-brat) (recommended):** add the beta plugin `leweii/read-it-never`.

**Manual:** download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/leweii/read-it-never/releases/latest) into `<vault>/.obsidian/plugins/read-it-never/`, then enable **Read It Never** in Settings → Community plugins.

### How to use Read It Never plugin?

To create single note you can either click on the plugin ribbon icon, select `Read It Never: Create from clipboard` from command palette or click on `Read It Never` shortcut in context or share menu. You can also create multiple notes from batch of URLs, delimited by selected delimiter in plugin settings using `Read It Never: Create from batch in clipboard` command.

If you want just add content to existing note, you can use `Read It Never: Insert at the cursor position` command to insert content after the current cursor position.

## Template engine

Read It Never provides for every content type dedicated template that can be edited in plugin settings.

### Variables

Variables are rendered in template using familiar syntax `{{ content }}`. Nested data types can be accessed using dot notation `{{ author.name }}`.

### Filters

Variables output can be modified using filters. Filters are separated by `|` symbol. Filters can be chained, so output of the previous is passed to the next.

<details>
<summary>blockquote</summary>

Adds quote prefix to each line of value.
</details>

<details>
<summary>capitalize</summary>

Modifies first character to uppercase and others to lowercase.

```
{{ 'hello world'|capitalize}}

outputs: Hello world
```
</details>

<details>
<summary>numberLexify</summary>

Converts number to lexified format.

```
{{ 12682|numberLexify}}

outputs: 12.6K
```
</details>

<details>
<summary>lower</summary>

Converts value to lowercase.

```
{{ 'Hello World'|lower}}

outputs: hello world
```
</details>

<details>
<summary>replace</summary>

Replaces all occurrences in input value.

```
{{ 'Hello world'|replace('o') }}

outputs: Hell wrld
```
</details>

<details>
<summary>upper</summary>

Converts value to uppercase.

```
{{ 'Hello World'|upper}}

outputs: HELLO WORLD
```
</details>

## Inbox and Assets directories

You can use template variables in `Inbox dir` and `Assets dir` settings to better distribute content in your Vault.

| Directory template variable | Description                                        |
| --------------------------- | -------------------------------------------------- |
| date                        | Current date in format from plguin settins         |
| fileName                    | Filename of new note                               |
| contentType                 | Slug of detected content type from plugin settings |

## Content Types

Structure of note content is determined by URL. Currenty plugin supports saving content of websites and embedding content from multiple services. Each content type has title and note template with replacable variables, which can be edited in plugin settings.

Available content types are ordered by URL detection priority.

### Website Article

Will be parsed to readable form using [Mozilla Readability](https://github.com/mozilla/readability) and then converted to markdown. In case website content is marked by [Readbility](https://github.com/mozilla/readability) as not readable, empty note with URL will be created.

If enabled, images will be downloaded to folder (default is `Read It Never Inbox/assets`) configured in plugin settings. (Supported only on desktop for now)

| Title template variable | Description                                 |
| ------------------------| ----------------------------------------    |
| title                   | Article title from `<title>` HTML tag       |
| date                    | Current date in format from plugin settings |

| Content template variable | Description                                                                                                                                                                               |
|---------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| articleTitle              | Article title from `<title>` HTML tag                                                                                                                                                     |
| articleURL                | Article URL                                                                                                                                                                               |
| articleReadingTime        | Estimated reading time in minutes by Readbility.js                                                                                                                                        |
| articleContent            | Article content                                                                                                                                                                           |
| date                      | Current date in format from plugin settings                                                                                                                                               |
| previewURL                | Aritlce preview image URL parsed from [OpenGraph](https://ogp.me/) or [Twitter](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/markup) image `<meta>` property |
| publishedTime             | Article publish time parsed from [OpenGraph](https://ogp.me/) `<meta>` property or [Schema.org](https://schema.org/) JSON and formatted in content format from plugin settings            |

### Youtube

| Title template variable | Description                                 |
| ----------------------- | ------------------------------------------- |
| title                   | Video title                                 |
| date                    | Current date in format from plugin settings |

| Content template variable | Description                                                          |
| ------------------------- | -------------------------------------------------------------------- |
| videoTitle                | Video title                                                          |
| date                      | Current date in format from plugin settings                          |
| videoDescription          | Video description                                                    |
| videoURL                  | Video URL on Youtube.com                                             |
| videoId                   | Video ID                                                             |
| videoPlayer               | Embeded player generated by plugin                                   |
| channelId                 | Channel ID                                                           |
| channelName               | Channel name                                                         |
| channelURL                | Channel URL on Youtube.com                                           |
| videoThumbnail            | Video thumbnail image URL                                            |
| videoChapters             | List of video chapters with linked timestamps                        |
| videoTranscript           | Video transcript (closed captions), one timestamped line per caption |
| videoPublishDate          | Video plublish date formatted in content format from plugin settings |
| videoViewsCount           | Video views count                                                    |

| Chapter template variable | Description                   |
| ------------------------- | ----------------------------- |
| chapterTitle              | Chapter title                 |
| chapterTimestamp          | Chapter start time in mm:ss   |
| chapterSeconds            | Chapter start time in seconds |
| chapterUrl                | Url to chapter start          |

| Transcript line template variable | Description                          |
| --------------------------------- | ------------------------------------ |
| transcriptText                    | Caption text for the line            |
| transcriptTimestamp               | Line start time in mm:ss             |
| transcriptSeconds                 | Line start time in seconds           |
| transcriptUrl                     | Url to the video at the line's start |

Parsing of HTML DOM has its limitations thus additional data can be fetched only from [Google API](https://developers.google.com/youtube/v3/getting-started). Retrieved API key can be set in plugin settings and then plugin will use the Google API for fetching data.

| Content template variable | Description                                                          |
| ------------------------- | -------------------------------------------------------------------- |
| videoDuration             | Video duration in seconds                                            |
| videoDurationFormatted    | Formatted video duration (1h 25m 23s)                                |
| videoTags                 | Formatted list of tags delimited by space                            |

### Youtube Channel

| Title template variable | Description                                  |
| ----------------------- | -------------------------------------------- |
| title                   | Channel title.                               |
| date                    | Current date in format from plugin settings. |

| Content template variable | Description                                          |
| ------------------------- | ---------------------------------------------------- |
| date                      | Current date in format from plugin settings.         |
| channelId                 | Channel ID.                                          |
| channelTitle              | Channel title.                                       |
| channelDescription        | Channel description.                                 |
| channelURL                | Channel URL on Youtube.com.                          |
| channelAvatar             | URL of channel's avatar (thumbnail) image.           |
| channelBanner             | URL of channel's banner image.                       |
| channelSubscribersCount   | The number of subscribers that the channel has.      |
| channelVideosCount        | The number of public videos uploaded to the channel. |
| channelVideosURL          | URL to channel's videos on Youtube.com               |
| channelShortsURL          | URL to channel's shorts on Youtube.com               |

### X.com (Twitter)

Parser use [X Publish API](https://publish.twitter.com/) to fetch data.

| Title template variable | Description                                 |
| ----------------------- | ------------------------------------------- |
| tweetAuthorName         | Post author name                            |
| date                    | Current date in format from plugin settings |

| Content template variable | Description                                                        |
| ------------------------- | ------------------------------------------------------------------ |
| tweetAuthorName           | Post author name                                                   |
| date                      | Current date in format from plugin settings                        |
| tweetURL                  | Post URL on X.com                                                  |
| tweetContent              | Post content                                                       |
| tweetPublishDate          | Post publish date formatted in content format from plugin settings |

### Bilibili

| Title template variable | Description                                 |
| ----------------------- | ------------------------------------------- |
| title                   | Video title                                 |
| date                    | Current date in format from plugin settings |

| Content template variable | Description                                                |
| ------------------------- | ---------------------------------------------------------- |
| videoTitle                | Video title                                                |
| date                      | Current date in format from plugin settings                |
| videoURL                  | Video URL on Bilibili.com                                  |
| videoId                   | Video ID (BV id)                                           |
| videoPlayer               | Embeded player generated by plugin                         |
| videoDescription          | Video description                                          |
| videoThumbnail            | Video cover image URL                                      |
| channelName               | Uploader (UP主) name                                       |
| channelURL                | Uploader space URL on Bilibili.com                         |
| videoPublishDate          | Video publish date formatted in content format from settings |
| videoViewsCount           | Video views count                                          |
| videoDuration             | Video duration in seconds                                  |
| videoDurationFormatted    | Formatted video duration (1h 25m 23s)                      |
| videoPartsCount           | Number of parts (分P) in the video                         |
| videoParts                | Markdown list of parts (分P), empty for single-part videos |

Metadata is fetched from Bilibili's public `x/web-interface/view` API (no login required).

### Text Snippet

If your clipboard content is not recognized by any of above parsers plugin will create note with unformatted clipboard content.

| Title template variable | Description                                 |
| ------------------------| ------------------------------------------- |
| date                    | Current date in format from plugin settings |

| Content template variable | Description                                 |
| ------------------------- | ------------------------------------------- |
| content                   | Clipboard content                           |
| date                      | Current date in format from plugin settings |

## API

To invoke functionality from other plugins we provide an API. You can access it via `this.app.plugins.plugins['read-it-never'].api` which is an instance of `ReadItNeverApi` class defined in [src/ReadItNeverApi.ts](https://github.com/leweii/read-it-never/blob/master/src/ReadItNeverApi.ts).
