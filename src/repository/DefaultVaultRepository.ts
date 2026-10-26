import { CapacitorAdapter, FileSystemAdapter, TFile, TFolder, normalizePath } from 'obsidian';
import FileExistsError from '../error/FileExists';
import { VaultRepository } from './VaultRepository';
import { Note } from 'src/parsers/Note';
import ReadItNeverPlugin from 'src/main';
import { getOsOptimizedPath } from 'src/helpers/fileutils';
import TemplateEngine from 'src/template/TemplateEngine';
import { formatDate } from 'src/helpers/date';
import FileNotFoundError from 'src/error/FileNotFound';

export default class DefaultVaultRepository implements VaultRepository {
    private plugin: ReadItNeverPlugin;
    private templateEngine: TemplateEngine;

    constructor(plugin: ReadItNeverPlugin, templateEngine: TemplateEngine) {
        this.plugin = plugin;
        this.templateEngine = templateEngine;
    }

    public async saveNote(note: Note): Promise<TFile> {
        let directory = '/';

        if (this.plugin.settings.inboxDir) {
            directory = this.templateEngine.render(this.plugin.settings.inboxDir, {
                date: formatDate(note.createdAt, this.plugin.settings.dateTitleFmt),
                fileName: note.fileName,
                contentType: note.contentType,
            });
            await this.createDirectory(directory);
        }

        note.filePath = this.getFilePath(directory, note.getFullFilename());

        if (await this.exists(note.filePath)) {
            throw new FileExistsError(`${note.getFullFilename()} already exists!`);
        }

        return await this.plugin.app.vault.create(note.filePath, await note.getFinalContent());
    }

    public async createDirectory(directoryPath: string): Promise<void> {
        const normalizedPath = normalizePath(directoryPath);
        if (normalizedPath === '/' || this.plugin.app.vault.getAbstractFileByPath(normalizedPath) instanceof TFolder) {
            return;
        }

        try {
            await this.plugin.app.vault.createFolder(normalizedPath);
        } catch (error) {
            // Another note/image created the same folder concurrently.
            if (!(this.plugin.app.vault.getAbstractFileByPath(normalizedPath) instanceof TFolder)) {
                throw error;
            }
        }
    }

    public async exists(filePath: string): Promise<boolean> {
        return await this.plugin.app.vault.adapter.exists(filePath);
    }

    public getFileByPath(filePath: string): TFile {
        const file = this.plugin.app.vault.getFileByPath(filePath);

        if (file === null) {
            throw new FileNotFoundError(`File not found: ${filePath}`);
        }

        return file;
    }

    public async appendToExistingNote(note: Note): Promise<TFile> {
        const file = this.getFileByPath(note.filePath);
        const content = await note.getFinalContent();

        await this.plugin.app.vault.process(file, (data) => {
            return `${data}\n\n${content}`;
        });

        return file;
    }

    private getFilePath(directory: string, fileName: string): string {
        const adapter = this.plugin.app.vault.adapter;

        if (adapter instanceof CapacitorAdapter || adapter instanceof FileSystemAdapter) {
            return getOsOptimizedPath(directory, fileName, adapter, this.plugin.getFileSystemLimits());
        }

        return normalizePath(`${directory}/${fileName}`);
    }
}
