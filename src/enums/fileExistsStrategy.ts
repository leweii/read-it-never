import { DropdownEnumOption } from './enum';
import { t } from 'src/i18n';

export enum FileExistsStrategy {
    AppendToExisting = 'appendToExisting',
    Ask = 'ask',
    Nothing = 'nothing',
}

export function getFileExistStrategyOptions(): DropdownEnumOption[] {
    return [
        { label: t('settings.fileExistsStrategy.ask'), option: FileExistsStrategy.Ask },
        { label: t('settings.fileExistsStrategy.nothing'), option: FileExistsStrategy.Nothing },
        { label: t('settings.fileExistsStrategy.append'), option: FileExistsStrategy.AppendToExisting },
    ];
}
