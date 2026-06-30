import { Editor } from 'obsidian';
import { NoteService } from './NoteService';

export class ReadItLaterApi {
    constructor(private noteService: NoteService) {}

    /**
     * Create single note from provided input.
     */
    public processContent(content: string): Promise<void> {
        return this.noteService.createNote(content);
    }

    /**
     * Create multiple notes from provided input delimited by delimiter defined in plugin settings.
     */
    public processContentBatch(contentBatch: string): Promise<void> {
        return this.noteService.createNotesFromBatch(contentBatch);
    }

    /**
     * Insert processed content from input at current position in editor.
     */
    public insertContentAtEditorCursorPosition(content: string, editor: Editor): Promise<void> {
        return this.noteService.insertContentAtEditorCursorPosition(content, editor);
    }
}
