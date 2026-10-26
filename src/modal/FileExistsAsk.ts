import { App, Modal, Setting } from 'obsidian';
import { FileExistsStrategy } from 'src/enums/fileExistsStrategy';
import { t } from 'src/i18n';
import { Note } from 'src/parsers/Note';

export default class FileExistsAsk extends Modal {
    constructor(app: App, notes: Note[], onSubmit: (strategy: FileExistsStrategy, doNotAskAgain: boolean) => void) {
        super(app);

        this.setTitle(t('modal.fileExists.title'));

        this.contentEl.createEl('p', { text: t('modal.fileExists.desc', { count: notes.length }) });
        const list = this.contentEl.createEl('ul');
        for (const note of notes) {
            list.createEl('li', { text: note.getFullFilename() });
        }

        let doNotAskAgain = false;

        new Setting(this.contentEl).setName(t('modal.fileExists.doNotAskAgain')).addToggle((toggle) => {
            toggle.setValue(false).onChange((value) => (doNotAskAgain = value));
        });

        new Setting(this.contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText(t('modal.fileExists.append'))
                    .setCta()
                    .onClick(() => {
                        this.close();
                        onSubmit(FileExistsStrategy.AppendToExisting, doNotAskAgain);
                    }),
            )
            .addButton((btn) =>
                btn.setButtonText(t('modal.fileExists.skip')).onClick(() => {
                    this.close();
                    onSubmit(FileExistsStrategy.Nothing, doNotAskAgain);
                }),
            );
    }
}
