import { Notice } from 'obsidian';

const SHOW_DELAY_MS = 400;

/**
 * A persistent notice for long running work. It only appears if the work takes longer than a short
 * delay, so instant operations (e.g. text snippets) don't flash a notice.
 */
export class ProgressNotice {
    private notice: Notice | null = null;
    private timer: number | null;

    constructor(private message: string) {
        this.timer = window.setTimeout(() => {
            this.timer = null;
            this.notice = new Notice(this.message, 0);
        }, SHOW_DELAY_MS);
    }

    public setMessage(message: string): void {
        this.message = message;
        this.notice?.setMessage(message);
    }

    public hide(): void {
        if (this.timer !== null) {
            window.clearTimeout(this.timer);
            this.timer = null;
        }
        this.notice?.hide();
        this.notice = null;
    }
}
