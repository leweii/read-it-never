import { normalizeFilename } from 'src/helpers/fileutils';

/**
 * Transforms the rendered note content right before it is written to the vault (e.g. downloading
 * remote images and rewriting their links). Deferred so that nothing is written to the vault for
 * notes that end up not being saved (duplicate skipped, write failure, ...).
 */
export type NoteContentProcessor = (content: string) => Promise<string>;

export class Note {
    private _filePath: string | null = null;
    private finalizedContent: Promise<string> | null = null;

    constructor(
        public readonly fileName: string,
        public readonly fileExtension: string,
        public readonly content: string,
        public readonly contentType: string,
        public readonly createdAt: Date,
        private readonly contentProcessor: NoteContentProcessor | null = null,
    ) {
        this.fileName = normalizeFilename(this.fileName);
    }

    public getFullFilename(): string {
        return `${this.fileName}.${this.fileExtension}`;
    }

    public get filePath() {
        return this._filePath;
    }

    public set filePath(filePath: string) {
        this._filePath = filePath;
    }

    /**
     * Returns the content to write, running the content processor (once) if there is one.
     */
    public getFinalContent(): Promise<string> {
        if (this.finalizedContent === null) {
            this.finalizedContent =
                this.contentProcessor === null ? Promise.resolve(this.content) : this.contentProcessor(this.content);
        }

        return this.finalizedContent;
    }
}
