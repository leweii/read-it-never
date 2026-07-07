import { App } from 'obsidian';

// `commands` is an internal, untyped API (not part of obsidian.d.ts) but is the standard way
// community plugins trigger core commands like revealing the active file in the file explorer.
type AppWithCommands = App & { commands: { executeCommandById(id: string): boolean } };

export function revealActiveFileInExplorer(app: App): void {
    try {
        (app as AppWithCommands).commands.executeCommandById('file-explorer:reveal-active-file');
    } catch (error) {
        console.error(error);
    }
}
