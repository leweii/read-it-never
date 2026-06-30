import en from './locales/en';
import zhCN from './locales/zh-cn';

type Translations = Record<string, string>;

// Obsidian stores the active display language in localStorage under 'language'.
// English is represented by 'en' or an absent value; Simplified Chinese by 'zh'.
const locales: Record<string, Translations> = {
    en,
    zh: zhCN,
};

function resolveLocale(): Translations {
    const language = window.localStorage.getItem('language') ?? 'en';
    return locales[language] ?? en;
}

/**
 * Translate a key for the active Obsidian language, falling back to English.
 * Interpolates `{name}` placeholders from `vars`.
 */
export function t(key: string, vars?: Record<string, string | number>): string {
    const locale = resolveLocale();
    let value = locale[key] ?? en[key] ?? key;

    if (vars) {
        for (const [name, replacement] of Object.entries(vars)) {
            value = value.split(`{${name}}`).join(String(replacement));
        }
    }

    return value;
}
