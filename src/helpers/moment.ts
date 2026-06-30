import { moment } from 'obsidian';

interface MomentInstance {
    format(format?: string): string;
    toDate(): Date;
    isValid(): boolean;
}

interface MomentFn {
    (input?: Date | string, formats?: string | string[], strict?: boolean): MomentInstance;
    ISO_8601: string;
}

// Obsidian bundles moment and re-exports it, but its type resolves to `any` in
// environments that don't have moment's types installed. Re-export a minimally
// typed callable so every call site stays type-safe regardless of resolution.
export const typedMoment = moment as unknown as MomentFn;
