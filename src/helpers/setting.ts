import { sanitizeHTMLToDom } from 'obsidian';

export function createHTMLDiv(html: string): DocumentFragment {
    return sanitizeHTMLToDom(html);
}
