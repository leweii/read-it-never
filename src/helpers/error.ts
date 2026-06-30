import { Notice } from 'obsidian';
import { t } from 'src/i18n';

export function handleError(error: unknown, noticeMessage: string): never {
    new Notice(t('notice.checkConsole', { message: noticeMessage }));
    throw error;
}
