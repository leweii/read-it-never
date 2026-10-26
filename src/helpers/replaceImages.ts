import { CapacitorAdapter, DataAdapter, FileSystemAdapter, normalizePath, requestUrl } from 'obsidian';
import { FilesystemLimits, getFileExtensionFromMimeType, getOsOptimizedPath, isValidUrl } from './fileutils';
import { createRandomString } from './stringUtils';
import { HTTPS_PROTOCOL, HTTP_PROTOCOL } from 'src/constants/urlProtocols';
import ReadItNeverPlugin from 'src/main';

// Matches `![anchor](link)` and `![anchor](link "title")`.
const EXTERNAL_MEDIA_LINK_PATTERN = /!\[(?<anchor>[^\]]*?)\]\((?<link>[^\s)]+)(?:\s+"[^"]*")?\)/g;
const CREATE_FILENAME_ATTEMPTS = 5;
const MAX_FILENAME_INDEX = 1000;
const MAX_CONCURRENT_DOWNLOADS = 4;

interface ImageMatch {
    match: string;
    anchor: string;
    link: string;
}

export async function replaceImages(
    plugin: ReadItNeverPlugin,
    noteFileName: string,
    content: string,
    assetsDir: string,
): Promise<string> {
    const matches: ImageMatch[] = Array.from(content.matchAll(EXTERNAL_MEDIA_LINK_PATTERN)).map((match) => ({
        match: match[0],
        anchor: match.groups?.anchor ?? '',
        link: match.groups?.link ?? '',
    }));

    const downloadable = matches.filter((image) => isValidUrl(image.link, [HTTP_PROTOCOL, HTTPS_PROTOCOL]));
    if (downloadable.length === 0) {
        return content;
    }

    // Create the directory once up front instead of racing per image.
    await plugin.getVaultRepository().createDirectory(assetsDir);

    // The same image is often referenced several times (e.g. preview image + inline); download once.
    const uniqueLinks = Array.from(new Set(downloadable.map((image) => image.link)));
    const localPaths = new Map<string, string | null>();

    await runWithConcurrency(uniqueLinks, MAX_CONCURRENT_DOWNLOADS, async (link) => {
        localPaths.set(link, await downloadImageToVault(plugin, noteFileName, assetsDir, link));
    });

    return content.replace(EXTERNAL_MEDIA_LINK_PATTERN, (match: string, anchor: string, link: string) => {
        const localPath = localPaths.get(link);
        return localPath ? `![${anchor}](${localPath})` : match;
    });
}

async function runWithConcurrency<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
    let index = 0;
    const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (index < items.length) {
            const item = items[index++];
            await worker(item);
        }
    });
    await Promise.all(runners);
}

/**
 * Downloads an image and stores it in the assets directory. Returns the link to use in markdown, or
 * `null` when the image could not be downloaded (the original remote link is kept in that case).
 */
async function downloadImageToVault(
    plugin: ReadItNeverPlugin,
    noteFileName: string,
    assetsDir: string,
    link: string,
): Promise<string | null> {
    try {
        const { fileContent, fileExtension } = await downloadImage(new URL(link));

        for (let attempt = 0; attempt < CREATE_FILENAME_ATTEMPTS; attempt++) {
            try {
                const fileName = await chooseFileName(
                    plugin.app.vault.adapter,
                    plugin.getFileSystemLimits(),
                    assetsDir,
                    noteFileName,
                    fileExtension,
                );

                if (fileName === '') {
                    return null;
                }

                await plugin.app.vault.createBinary(fileName, fileContent);
                return fileName.replace(/\s/g, '%20');
            } catch (error) {
                console.warn(error);
            }
        }
    } catch (error) {
        console.warn(error);
    }

    return null;
}

async function chooseFileName(
    dataAdapter: DataAdapter,
    filesystemLimits: FilesystemLimits,
    assetsDir: string,
    noteFileName: string,
    fileExtension: string,
): Promise<string> {
    if (fileExtension === '') {
        return '';
    }

    for (let index = 0; index < MAX_FILENAME_INDEX; index++) {
        let suggestedName;
        if (dataAdapter instanceof CapacitorAdapter || dataAdapter instanceof FileSystemAdapter) {
            suggestedName = getOsOptimizedPath(
                assetsDir,
                `${noteFileName}-${createRandomString(10)}.${fileExtension}`,
                dataAdapter,
                filesystemLimits,
            );
        } else {
            suggestedName = normalizePath(`${assetsDir}/${noteFileName}-${createRandomString(10)}.${fileExtension}`);
        }

        if (!(await dataAdapter.exists(normalizePath(suggestedName), false))) {
            return suggestedName;
        }
    }

    return '';
}

async function downloadImage(url: URL): Promise<{ fileContent: ArrayBuffer; fileExtension: string }> {
    const res = await requestUrl({
        url: url.href,
        method: 'get',
    });

    const mimeType = (res.headers['content-type'] || '').split(';')[0].trim();

    return {
        fileContent: res.arrayBuffer,
        fileExtension: getFileExtensionFromMimeType(mimeType) || getImageExtensionFromUrl(url),
    };
}

function getImageExtensionFromUrl(url: URL): string {
    const match = url.pathname.match(/\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i);
    return match ? match[1].toLowerCase() : '';
}
