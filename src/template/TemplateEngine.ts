import { lexify } from 'src/helpers/numberUtils';

interface TemplateData {
    [key: string]: unknown;
}

type ModifierFunction = (value: unknown, ...args: unknown[]) => unknown;

interface Modifiers {
    [key: string]: ModifierFunction;
}

export const stringableTypes: string[] = ['string', 'number', 'bigint', 'symbol'];
export const variableRegex = /{{(.*?)}}/g;

export default class TemplateEngine {
    private modifiers: Modifiers;

    constructor() {
        this.modifiers = {
            blockquote: (value: unknown) => {
                if (!this.validateFilterValueType(value, 'blockquote', stringableTypes)) {
                    return value;
                }
                return String(value)
                    .split('\n')
                    .map((line) => `> ${line}`)
                    .join('\n');
            },
            capitalize: (value: unknown) => {
                if (!this.validateFilterValueType(value, 'capitalize', stringableTypes)) {
                    return value;
                }
                const str = String(value);
                return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
            },
            join: (value: unknown, separator: unknown = ',') => {
                if (!this.validateFilterValueType(value, 'join', ['array'])) {
                    return value;
                }
                return (value as unknown[]).join(String(separator));
            },
            numberLexify: (value: unknown) => {
                return lexify(value as number);
            },
            lower: (value: unknown) => {
                if (!this.validateFilterValueType(value, 'lower', stringableTypes)) {
                    return value;
                }
                String(value).toLowerCase();
            },
            map: (value: unknown, transform: unknown) => {
                if (!this.validateFilterValueType(value, 'map', ['array'])) {
                    return value;
                }
                try {
                    return (value as unknown[]).map(transform as (item: unknown) => unknown);
                } catch (e) {
                    console.warn('Error in map modifier:', e);
                    return value;
                }
            },
            replace: (value: unknown, search: unknown, replacement: unknown = '') => {
                if (!this.validateFilterValueType(value, 'replace', stringableTypes)) {
                    return value;
                }
                return String(value).replaceAll(String(search), String(replacement));
            },
            striptags: (value: unknown, allowedTags: unknown = '') => {
                if (!this.validateFilterValueType(value, 'striptags', stringableTypes)) {
                    return value;
                }
                const regex = new RegExp(
                    `<(?!/?(${String(allowedTags).replace(/[<>]/g, '').split(',').join('|')})s*/?)[^>]+>`,
                    'gi',
                );
                return String(value).replace(regex, '');
            },
            upper: (value: unknown) => {
                if (!this.validateFilterValueType(value, 'upper', stringableTypes)) {
                    return value;
                }
                String(value).toUpperCase();
            },
        };
    }

    public render(template: string, data: TemplateData): string {
        try {
            // First process any loops in the template
            let result = this.processLoops(template, data);

            // Then process variables with modifiers
            result = this.processVariables(result, data);

            // Finally process simple pattern substitutions
            result = this.processSimplePattern(result, data);

            return result;
        } catch (e) {
            console.error('Error rendering template:', e);
            return template; // Return original template on error
        }
    }

    private processSimplePattern(template: string, data: TemplateData): string {
        const simplePatternRegex = /%(\w+(?:\.\w+)*)%/g;

        return template.replace(simplePatternRegex, (match: string, path: string) => {
            try {
                const value = this.resolveValue(path, data);

                if (value === undefined) {
                    console.warn(`Unable to resolve ${path}`);
                    return match;
                }

                return String(value);
            } catch (e) {
                console.warn(`Error processing simple pattern "${match}":`, e);
                return match;
            }
        });
    }

    private processVariables(template: string, data: TemplateData): string {
        return template.replace(variableRegex, (match: string, content: string) => {
            try {
                const [key, ...modifiers] = content.split('|').map((item) => item.trim());

                // check if value is raw string
                const rawStringRegex = /(['"])((?:[^\\]|\\.)*?)\1/;
                const rawStringMatch = rawStringRegex.exec(key);

                let value: unknown;

                // if value is raw string don't resolve value from template data
                if (rawStringMatch !== null) {
                    value = rawStringMatch[2];
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
                return String(processedValue);
            } catch (e) {
                console.warn(`Error processing variable "${match}":`, e);
                return match;
            }
        });
    }

    private processLoops(template: string, data: TemplateData): string {
        const loopRegex = /{%\s*for\s+(\w+)\s+in\s+(\w+(?:\.\w+)*)\s*%}([\s\S]*?){%\s*endfor\s*%}/g;

        return template.replace(loopRegex, (match: string, itemName: string, arrayPath: string, content: string) => {
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
        });
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
        const match = modifierString.match(/(\w+)(?:\((.*?)\))?/);
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
