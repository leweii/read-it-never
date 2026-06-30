import { Notice } from 'obsidian';

export function handleError(error: unknown, noticeMessage: string): never {
    new Notice(`${noticeMessage} Check the console output.`);
    throw error;
}
