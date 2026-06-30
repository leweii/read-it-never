import { Parser } from './Parser';
import { Note } from './Note';

class TextSnippetParser extends Parser {
    test(): boolean {
        return true;
    }

    prepareNote(text: string): Promise<Note> {
        const createdAt = new Date();

        const fileNameTemplate = this.templateEngine.render(this.plugin.settings.textSnippetNoteTitle, {
            date: this.getFormattedDateForFilename(createdAt),
        });

        const content = this.templateEngine.render(this.plugin.settings.textSnippetNote, {
            content: text,
            date: this.getFormattedDateForContent(createdAt),
        });
        return Promise.resolve(
            new Note(fileNameTemplate, 'md', content, this.plugin.settings.textSnippetContentType, createdAt),
        );
    }
}

export default TextSnippetParser;
