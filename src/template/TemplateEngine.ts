import { lexify } from 'src/helpers/numberUtils';

interface TemplateData {
    [key: string]: unknown;
}

type ModifierFunction = (value: unknown, ...args: unknown[]) => unknown;

interface Modifiers {
    [key: string]: ModifierFunction;
}

export const stringableTypes: string[] = ['string', 'number', 'bigint', 'symbol'];

const tokenRegex = new RegExp(
    [
        /{%\s*for\s+(\w+)\s+in\s+(\w+(?:\.\w+)*)\s*%}([\s\S]*?){%\s*endfor\s*%}/.source,
        /{{(.*?)}}/.source,
        /%(\w+(?:\.\w+)*)%/.source,
    ].join('|'),
    'g',
);

export default class TemplateEngine {
    private modifiers: Modifiers;

    constructor() {
        this.modifiers = {
            blockquote: (value: unknown) => {
                if (!this.validateFilterValueType(value, 'blockquote', stringableTypes)) {
                    return value;
                }
                const stringable = value as string | number | bigint | symbol;
                return String(stringable)
                    .split('\n')
                    .map((line) => `> ${line}`)
                    .join('\n');
            },
            capitalize: (value: unknown) => {
                if (!this.validateFilterValueType(value, 'capitalize', stringableTypes)) {
                    return value;
                }
                const stringable = value as string | number | bigint | symbol;
                const str = String(stringable);
                return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
            },
            join: (value: unknown, separator: unknown = ',') => {
                if (!this.validateFilterValueType(value, 'join', ['array'])) {
                    return value;
                }
                const items = value as (string | number | bigint | symbol)[];
                const sep = separator as string | number | bigint | symbol;
                return items.join(String(sep));
            },
            numberLexify: (value: unknown) => {
                return lexify(value as number);
            },
            lower: (value: unknown) => {
                if (!this.validateFilterValueType(value, 'lower', stringableTypes)) {
                    return value;
                }
                const stringable = value as string | number | bigint | symbol;
                return String(stringable).toLowerCase();
            },
            map: (value: unknown, key: unknown) => {
                if (!this.validateFilterValueType(value, 'map', ['array'])) {
                    return value;
                }
                if (typeof key !== 'string' || key === '') {
                    console.warn('Filter map expects a property name, e.g. map("name").');
                    return value;
                }
                return (value as unknown[]).map((item) => this.resolveValue(key, item as TemplateData));
            },
            replace: (value: unknown, search: unknown, replacement: unknown = '') => {
                if (!this.validateFilterValueType(value, 'replace', stringableTypes)) {
                    return value;
                }
                const stringable = value as string | number | bigint | symbol;
                const searchStringable = search as string | number | bigint | symbol;
                const replacementStringable = replacement as string | number | bigint | symbol;
                return String(stringable).replaceAll(String(searchStringable), String(replacementStringable));
            },
            striptags: (value: unknown, allowedTags: unknown = '') => {
                if (!this.validateFilterValueType(value, 'striptags', stringableTypes)) {
                    return value;
                }
                const allowedTagsStringable = allowedTags as string | number | bigint | symbol;
                const stringable = value as string | number | bigint | symbol;
                const regex = new RegExp(
                    `<(?!/?(${String(allowedTagsStringable).replace(/[<>]/g, '').split(',').join('|')})s*/?)[^>]+>`,
                    'gi',
                );
                return String(stringable).replace(regex, '');
            },
            upper: (value: unknown) => {
                if (!this.validateFilterValueType(value, 'upper', stringableTypes)) {
                    return value;
                }
                const stringable = value as string | number | bigint | symbol;
                return String(stringable).toUpperCase();
            },
        };
    }

    public render(template: string, data: TemplateData): string {
        try {
            // Loops, variables and simple patterns are substituted in a single left-to-right pass so
            // that substituted values (e.g. fetched article text containing "{{" or "%") are never
            // re-interpreted as template syntax.
            return template.replace(
                tokenRegex,
                (
                    match: string,
                    loopItemName: string | undefined,
                    loopArrayPath: string | undefined,
                    loopContent: string | undefined,
                    variable: string | undefined,
                    simplePath: string | undefined,
                ) => {
                    if (loopItemName !== undefined) {
                        return this.processLoop(match, loopItemName, loopArrayPath, loopContent, data);
                    }
                    if (variable !== undefined) {
                        return this.processVariable(match, variable, data);
                    }
                    return this.processSimplePattern(match, simplePath, data);
                },
            );
        } catch (e) {
            console.error('Error rendering template:', e);
            return template; // Return original template on error
        }
    }

    private processSimplePattern(match: string, path: string, data: TemplateData): string {
        try {
            const value = this.resolveValue(path, data);

            if (value === undefined) {
                return match;
            }

            const stringable = value as string | number | bigint | symbol;
            return String(stringable);
        } catch (e) {
            console.warn(`Error processing simple pattern "${match}":`, e);
            return match;
        }
    }

    private processVariable(match: string, content: string, data: TemplateData): string {
        try {
            const [key, ...modifiers] = this.splitModifiers(content).map((item) => item.trim());

            // check if value is raw string
            const rawStringRegex = /^(['"])((?:[^\\]|\\.)*?)\1$/;
            const rawStringMatch = rawStringRegex.exec(key);

            let value: unknown;

            // if value is raw string or number literal don't resolve value from template data
            if (rawStringMatch !== null) {
                value = rawStringMatch[2];
            } else if (/^-?\d+(?:\.\d+)?$/.test(key)) {
                value = Number(key);
            } else {
                value = this.resolveValue(key, data);
            }

            if (value === undefined) {
                console.warn(`Unable to resolve ${key}`);
                return match;
            }

            let processedValue: unknown = value;
            for (const modifier of modifiers) {
                processedValue = this.applyModifier(processedValue, modifier);
            }
            if (processedValue === undefined || processedValue === null) {
                return '';
            }
            const stringable = processedValue as string | number | bigint | symbol;
            return String(stringable);
        } catch (e) {
            console.warn(`Error processing variable "${match}":`, e);
            return match;
        }
    }

    /**
     * Splits `value | filter("a|b") | other` on pipes that are not inside quotes.
     */
    private splitModifiers(content: string): string[] {
        const parts: string[] = [];
        let current = '';
        let quoteChar = '';

        for (const char of content) {
            if (quoteChar !== '') {
                if (char === quoteChar) {
                    quoteChar = '';
                }
                current += char;
            } else if (char === '"' || char === "'") {
                quoteChar = char;
                current += char;
            } else if (char === '|') {
                parts.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        parts.push(current);

        return parts;
    }

    private processLoop(match: string, itemName: string, arrayPath: string, content: string, data: TemplateData) {
        try {
            const arrayValue = this.resolveValue(arrayPath, data);

            if (!Array.isArray(arrayValue)) {
                console.warn(`Value at "${arrayPath}" is not an array`);
                return '';
            }

            return arrayValue
                .map((item: unknown) => {
                    const loopContext: TemplateData = { ...data, [itemName]: item };
                    return this.render(content, loopContext);
                })
                .join('');
        } catch (e) {
            console.warn(`Error processing loop "${match}":`, e);
            return '';
        }
    }

    private resolveValue(path: string, data: TemplateData): unknown {
        const parts = path.trim().split('.');
        let value: unknown = data;

        for (const part of parts) {
            if (value === undefined || value === null) return undefined;
            value = (value as Record<string, unknown>)[part];
        }

        return value;
    }

    public addModifier(name: string, func: ModifierFunction): void {
        if (typeof func !== 'function') {
            throw new Error('Modifier must be a function');
        }
        this.modifiers[name] = func;
    }

    private parseModifier(modifierString: string): { name: string; args: unknown[] } {
        const match = modifierString.match(/^(\w+)(?:\(([\s\S]*)\))?$/);
        if (!match) return { name: modifierString, args: [] };

        const [, name, argsString] = match;
        const args = argsString ? this.parseArguments(argsString) : [];
        return { name, args };
    }

    private parseArguments(argsString: string): unknown[] {
        const args: unknown[] = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';
        let inArrowFunction = false;
        let bracketCount = 0;
        let escapeNext = false;

        const pushArg = () => {
            const trimmed = current.trim();
            if (trimmed || inQuotes) {
                // Consider empty strings when in quotes
                args.push(this.evaluateArgument(current.trim()));
            }
            current = '';
        };

        for (let i = 0; i < argsString.length; i++) {
            const char = argsString[i];

            if (escapeNext) {
                current += char;
                escapeNext = false;
                continue;
            }

            switch (char) {
                case '\\':
                    escapeNext = true;
                    break;
                case '"':
                case "'":
                    if (!inArrowFunction) {
                        if (inQuotes && char === quoteChar) {
                            inQuotes = false;
                        } else if (!inQuotes) {
                            inQuotes = true;
                            quoteChar = char;
                        }
                    }
                    current += char;
                    break;
                case '(':
                    bracketCount++;
                    current += char;
                    break;
                case ')':
                    bracketCount--;
                    current += char;
                    break;
                case '=':
                    if (argsString[i + 1] === '>') {
                        inArrowFunction = true;
                        current += '=>';
                        i++; // Skip next character
                    } else {
                        current += char;
                    }
                    break;
                case ',':
                    if (!inQuotes && !inArrowFunction && bracketCount === 0) {
                        pushArg();
                    } else {
                        current += char;
                    }
                    break;
                default:
                    current += char;
            }
        }

        if (current || inQuotes) {
            // Consider empty strings when in quotes
            pushArg();
        }

        return args;
    }

    private evaluateArgument(arg: string): unknown {
        try {
            // Handle quoted strings
            if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
                return arg.slice(1, -1);
            }

            // Handle empty strings (when quotes were present but removed)
            if (arg === '') {
                return '';
            }

            // Handle numbers
            if (!isNaN(Number(arg))) {
                return Number(arg);
            }

            // Handle arrays
            if (arg.startsWith('[') && arg.endsWith(']')) {
                try {
                    return JSON.parse(arg) as unknown;
                } catch {
                    return arg;
                }
            }

            return arg;
        } catch (e) {
            console.warn('Error evaluating argument:', arg, e);
            return arg;
        }
    }

    private applyModifier(value: unknown, modifierString: string): unknown {
        try {
            const { name, args } = this.parseModifier(modifierString);
            if (this.modifiers[name]) {
                return this.modifiers[name](value, ...args);
            }
            console.warn(`Modifier "${name}" not found`);
            return value;
        } catch (e) {
            console.warn(`Error applying modifier "${modifierString}":`, e);
            return value;
        }
    }

    private validateFilterValueType(value: unknown, filter: string, supportedTypes: string[]): boolean {
        const valueType = typeof value;

        if (supportedTypes.includes(valueType)) {
            return true;
        }

        if (supportedTypes.includes('array')) {
            return Array.isArray(value);
        }

        console.warn(
            `Filter ${filter} supports following types ${supportedTypes.join(', ')}, but ${valueType} was provided.`,
        );
        return false;
    }
}
