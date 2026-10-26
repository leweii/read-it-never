import { TFile } from 'obsidian';
import { Note } from 'src/parsers/Note';

export interface VaultRepository {
    /**
     * Writes the note to the vault. Throws `FileExistsError` if a note with the same path exists.
     */
    saveNote(note: Note): Promise<TFile>;

    createDirectory(directoryPath: string): Promise<void>;

    exists(filePath: string): Promise<boolean>;

    getFileByPath(filePath: string): TFile;

    appendToExistingNote(note: Note): Promise<TFile>;
}
