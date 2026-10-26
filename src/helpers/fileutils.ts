import { CapacitorAdapter, FileSystemAdapter, Platform, normalizePath } from 'obsidian';
import mime from 'mime';
import { ReadItNeverSettings } from 'src/settings';

export interface FilesystemLimits {
    path: number;
    fileName: number;
}

export function isValidUrl(url: string, allowedProtocols: string[] = []): boolean {
    let urlObject;
    try {
        urlObject = new URL(url);
    } catch {
        return false;
    }

    if (allowedProtocols.length === 0) {
        return true;
    }

    return allowedProtocols.includes(urlObject.protocol);
}

export function getBaseUrl(url: string, origin: string): string {
    const baseURL = new URL(url, origin);
    return baseURL.href;
}

const FALLBACK_FILENAME = 'Untitled';

/**
 * Removes characters that are invalid in file names on any supported platform or that break
 * Obsidian wikilinks (`[`, `]`, `#`, `^`, `|`), collapses whitespace and strips leading/trailing
 * dots and spaces (Windows rejects trailing ones, leading dots create hidden files).
 */
export function normalizeFilename(fileName: string, preserveUnicode = true): string {
    // Control characters (newlines, tabs, ...) are invalid in file names on Windows.
    /* eslint-disable no-control-regex */
    const forbidden = preserveUnicode
        ? /[:#/\\|?*<>"[\]^\u0000-\u001F\u007F]/gu
        : /[:#/\\()|?*<>"[\]^\u0000-\u001F\u007F\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu;
    /* eslint-enable no-control-regex */

    const normalized = fileName
        .replace(/\s+/g, ' ')
        .replace(forbidden, '')
        .replace(/^[\s.]+|[\s.]+$/g, '');

    return normalized === '' ? FALLBACK_FILENAME : normalized;
}

/**
 * Length of a string in UTF-8 bytes. Most file systems (ext4, APFS, Android) limit file names to
 * 255 bytes rather than 255 characters, and a CJK character takes three bytes.
 */
export function byteLength(value: string): number {
    return new TextEncoder().encode(value).length;
}

/**
 * Truncates a string so it fits in `maxBytes` UTF-8 bytes without splitting a code point.
 */
export function truncateToByteLength(value: string, maxBytes: number): string {
    if (byteLength(value) <= maxBytes) {
        return value;
    }

    let result = '';
    let bytes = 0;
    for (const char of value) {
        const charBytes = byteLength(char);
        if (bytes + charBytes > maxBytes) {
            break;
        }
        result += char;
        bytes += charBytes;
    }

    return result;
}

export function getOsOptimizedPath(
    path: string,
    fileName: string,
    dataAdapter: CapacitorAdapter | FileSystemAdapter,
    filesystemLimits: FilesystemLimits,
): string {
    const extension = getFileExtension(fileName);
    const fileExtension = extension === '' ? '' : `.${extension}`;
    let baseName = fileName.substring(0, fileName.length - fileExtension.length);

    // Limits are measured in UTF-8 bytes so that long CJK titles don't exceed the file system limit.
    const maxBaseNameBytes = filesystemLimits.fileName - byteLength(fileExtension);
    baseName = truncateToByteLength(baseName, maxBaseNameBytes).trimEnd();

    const directory = normalizePath(path);
    const fullPathOverflow =
        byteLength(dataAdapter.getFullPath(normalizePath(`${directory}/${baseName}${fileExtension}`))) -
        filesystemLimits.path;
    if (fullPathOverflow > 0) {
        // Only shorten the file name itself, never the directory part of the path.
        baseName = truncateToByteLength(baseName, Math.max(1, byteLength(baseName) - fullPathOverflow)).trimEnd();
    }

    return normalizePath(`${directory}/${baseName}${fileExtension}`);
}

export function getFileSystemLimits(platform: typeof Platform, settings: ReadItNeverSettings): FilesystemLimits {
    const defaultFilesystenLimits = getDefaultFilesystenLimits(platform);

    return {
        path: settings.filesystemLimitPath ?? defaultFilesystenLimits.path,
        fileName: settings.filesystemLimitFileName ?? defaultFilesystenLimits.fileName,
    };
}

export function getDefaultFilesystenLimits(platform: typeof Platform): FilesystemLimits {
    if (platform.isLinux) {
        return createFilesystemLimits(4096, 255);
    }
    if (platform.isMacOS || platform.isIosApp || platform.isAndroidApp || platform.isMobile) {
        return createFilesystemLimits(1024, 255);
    }

    return createFilesystemLimits(256, 256);
}

export function getFileExtension(fileName: string): string {
    if (!fileName.includes('.')) {
        return '';
    }

    return fileName.split('.').pop();
}

export function getFileExtensionFromMimeType(mimeType: string): string {
    return mime.getExtension(mimeType) ?? '';
}

function createFilesystemLimits(path: number, fileName: number): FilesystemLimits {
    return { path: path, fileName: fileName };
}
