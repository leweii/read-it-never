import { DropdownEnumOption } from './enum';
import { t } from 'src/i18n';

export enum Delimiter {
    NewLine = 'newLine',
    Comma = 'comma',
    Period = 'period',
    Semicolon = 'semicolon',
}

export function getDelimiterOptions(): DropdownEnumOption[] {
    return [
        { label: t('settings.delimiter.newLine'), option: Delimiter.NewLine },
        { label: t('settings.delimiter.comma'), option: Delimiter.Comma },
        { label: t('settings.delimiter.period'), option: Delimiter.Period },
        { label: t('settings.delimiter.semicolon'), option: Delimiter.Semicolon },
    ];
}

export function getDelimiterValue(type: Delimiter): string {
    switch (type) {
        case Delimiter.NewLine:
            return '\n';
        case Delimiter.Comma:
            return ',';
        case Delimiter.Period:
            return '.';
        case Delimiter.Semicolon:
            return ';';
    }
}
