// Minimal runtime stand-ins for the parts of the Obsidian API touched at import time or by pure helpers.
export function normalizePath(path: string): string {
    const normalized = path.replace(/[\\/]+/g, '/').replace(/^\/|\/$/g, '');
    return normalized === '' ? '/' : normalized;
}

export class Notice {
    constructor(public message: string) {}
    setMessage(message: string): void {
        this.message = message;
    }
    hide(): void {}
}

export class FileSystemAdapter {}
export class CapacitorAdapter {}
export class TFile {}
export class TFolder {}
export class Modal {}
export class Setting {}
export class PluginSettingTab {}
export class Plugin {}
export const Platform = { isDesktop: true, isMobile: false };
export const moment = (): unknown => ({ format: () => '', isValid: () => false, toDate: () => new Date() });
export const request = (): Promise<string> => Promise.reject(new Error('network disabled in tests'));
export const requestUrl = (): Promise<unknown> => Promise.reject(new Error('network disabled in tests'));
