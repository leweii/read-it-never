import { Editor, Notice, TFile } from 'obsidian';
import { t } from './i18n';
import ParserCreator from './parsers/ParserCreator';
import { VaultRepository } from './repository/VaultRepository';
import { Note } from './parsers/Note';
import FileExistsError from './error/FileExists';
import FileExistsAsk from './modal/FileExistsAsk';
import { FileExistsStrategy } from './enums/fileExistsStrategy';
import ReadItNeverPlugin from './main';
import { getAndCheckUrls } from './helpers/stringUtils';
import { revealActiveFileInExplorer } from './helpers/workspaceUtils';
import { getErrorMessage } from './helpers/error';
import { ProgressNotice } from './helpers/progressNotice';

type CreatedResult = { status: 'created'; note: Note; file: TFile };
type ExistsResult = { status: 'exists'; note: Note };
type FailedResult = { status: 'failed'; content: string; message: string };
type SaveResult = CreatedResult | ExistsResult | FailedResult;

export class NoteService {
    // Content currently being processed; guards against duplicate work from repeated clicks.
    private inProgress = new Set<string>();

    constructor(
        private parserCreator: ParserCreator,
        private plugin: ReadItNeverPlugin,
        private repository: VaultRepository,
    ) {}

    public async createNote(content: string): Promise<void> {
        const trimmedContent = content.trim();
        if (!this.canProcess(trimmedContent)) {
            return;
        }

        const progress = new ProgressNotice(t('notice.processing', { content: this.shorten(trimmedContent) }));
        this.inProgress.add(trimmedContent);
        try {
            const result = await this.processContent(trimmedContent);

            switch (result.status) {
                case 'created':
                    new Notice(t('notice.noteCreated', { file: result.note.getFullFilename() }));
                    await this.openFile(result.file);
                    break;
                case 'exists':
                    this.handleFileExistsError([result.note]);
                    break;
                case 'failed':
                    new Notice(t('notice.failedToProcess', { message: result.message }), 10000);
                    break;
            }
        } finally {
            this.inProgress.delete(trimmedContent);
            progress.hide();
        }
    }

    public async createNotesFromBatch(contentBatch: string): Promise<void> {
        const trimmedBatch = contentBatch.trim();
        if (!this.canProcess(trimmedBatch)) {
            return;
        }

        const urlCheckResult = getAndCheckUrls(trimmedBatch, this.plugin.settings.batchProcessDelimiter);
        const segments = urlCheckResult.everyLineIsURL ? urlCheckResult.urls.map((url) => url.trim()) : [trimmedBatch];

        const progress = new ProgressNotice(t('notice.processingBatch', { current: 1, total: segments.length }));
        this.inProgress.add(trimmedBatch);

        const results: SaveResult[] = [];
        try {
            // Sequential on purpose: keeps request rate to each site low and the progress meaningful.
            for (const [index, segment] of segments.entries()) {
                progress.setMessage(t('notice.processingBatch', { current: index + 1, total: segments.length }));
                results.push(await this.processContent(segment));
            }
        } finally {
            this.inProgress.delete(trimmedBatch);
            progress.hide();
        }

        const created = results.filter((result): result is CreatedResult => result.status === 'created');
        const existing = results
            .filter((result): result is ExistsResult => result.status === 'exists')
            .map((result) => result.note);
        const failed = results.filter((result): result is FailedResult => result.status === 'failed');

        if (segments.length === 1) {
            if (created.length === 1) {
                new Notice(t('notice.noteCreated', { file: created[0].note.getFullFilename() }));
            }
        } else {
            new Notice(
                t('notice.batchSummary', { created: created.length, existing: existing.length, failed: failed.length }),
            );
        }

        for (const result of failed) {
            console.error(`Read It Never: failed to process ${result.content}: ${result.message}`);
            new Notice(
                t('notice.failedToProcessItem', { content: this.shorten(result.content), message: result.message }),
                10000,
            );
        }

        // Only open one note so batches don't flood the workspace with tabs.
        if (created.length > 0) {
            await this.openFile(created[created.length - 1].file);
        }

        if (existing.length > 0) {
            this.handleFileExistsError(existing);
        }
    }

    public async insertContentAtEditorCursorPosition(content: string, editor: Editor): Promise<void> {
        const trimmedContent = content.trim();
        if (!this.canProcess(trimmedContent)) {
            return;
        }

        const progress = new ProgressNotice(t('notice.processing', { content: this.shorten(trimmedContent) }));
        this.inProgress.add(trimmedContent);
        try {
            const note = await this.makeNote(trimmedContent);
            editor.replaceRange(await note.getFinalContent(), editor.getCursor());
        } catch (error) {
            console.error(error);
            new Notice(t('notice.failedToProcess', { message: getErrorMessage(error) }), 10000);
        } finally {
            this.inProgress.delete(trimmedContent);
            progress.hide();
        }
    }

    private canProcess(content: string): boolean {
        if (content === '') {
            new Notice(t('notice.emptyContent'));
            return false;
        }
        if (this.inProgress.has(content)) {
            new Notice(t('notice.alreadyProcessing'));
            return false;
        }
        return true;
    }

    private async processContent(content: string): Promise<SaveResult> {
        let note: Note;
        try {
            note = await this.makeNote(content);
        } catch (error) {
            console.error(error);
            return { status: 'failed', content, message: getErrorMessage(error) };
        }

        try {
            const file = await this.repository.saveNote(note);
            return { status: 'created', note, file };
        } catch (error) {
            if (error instanceof FileExistsError) {
                return { status: 'exists', note };
            }
            console.error(error);
            return {
                status: 'failed',
                content,
                message: t('notice.unableToSave', { file: note.getFullFilename(), message: getErrorMessage(error) }),
            };
        }
    }

    private async makeNote(content: string): Promise<Note> {
        const parser = await this.parserCreator.createParser(content);
        return await parser.prepareNote(content);
    }

    private shorten(content: string, maxLength = 60): string {
        const singleLine = content.replace(/\s+/g, ' ');
        return singleLine.length > maxLength ? `${singleLine.substring(0, maxLength - 1)}…` : singleLine;
    }

    private async openFile(file: TFile): Promise<void> {
        const { openNewNote, openNewNoteInNewTab } = this.plugin.settings;
        if (!openNewNote && !openNewNoteInNewTab) {
            return;
        }

        try {
            await this.plugin.app.workspace.getLeaf(openNewNoteInNewTab ? 'tab' : false).openFile(file);
            revealActiveFileInExplorer(this.plugin.app);
        } catch (error) {
            console.error(error);
            new Notice(t('notice.unableToOpen', { file: file.name }));
        }
    }

    private openNote(note: Note): void {
        try {
            void this.openFile(this.repository.getFileByPath(note.filePath));
        } catch (error) {
            console.error(error);
            new Notice(t('notice.unableToOpen', { file: note.getFullFilename() }));
        }
    }

    private handleFileExistsError(notes: Note[]): void {
        switch (this.plugin.settings.fileExistsStrategy) {
            case FileExistsStrategy.Ask:
                new FileExistsAsk(this.plugin.app, notes, (strategy, doNotAskAgain) => {
                    void this.handleFileAskModalResponse(strategy, doNotAskAgain, notes);
                }).open();
                break;
            case FileExistsStrategy.Nothing:
                this.handleFileExistsStrategyNothing(notes);
                break;
            case FileExistsStrategy.AppendToExisting:
                void this.handleFileExistsStrategyAppend(notes);
                break;
        }
    }

    private async handleFileAskModalResponse(
        strategy: FileExistsStrategy,
        doNotAskAgain: boolean,
        notes: Note[],
    ): Promise<void> {
        if (doNotAskAgain) {
            await this.plugin.saveSetting('fileExistsStrategy', strategy);
        }

        switch (strategy) {
            case FileExistsStrategy.Nothing:
                this.handleFileExistsStrategyNothing(notes);
                break;
            case FileExistsStrategy.AppendToExisting:
                await this.handleFileExistsStrategyAppend(notes);
                break;
        }

        if (notes.length === 1) {
            this.openNote(notes[0]);
        }
    }

    private async handleFileExistsStrategyAppend(notes: Note[]): Promise<void> {
        for (const note of notes) {
            try {
                await this.repository.appendToExistingNote(note);
                new Notice(t('notice.noteUpdated', { file: note.getFullFilename() }));
            } catch (error) {
                console.error(error);
                new Notice(t('notice.noteNotUpdated', { file: note.getFullFilename() }), 0);
            }
        }
    }

    private handleFileExistsStrategyNothing(notes: Note[]): void {
        if (notes.length > 3) {
            new Notice(t('notice.notesAlreadyExist', { count: notes.length }));
            return;
        }
        for (const note of notes) {
            new Notice(t('notice.noteAlreadyExists', { file: note.getFullFilename() }));
        }
    }
}
