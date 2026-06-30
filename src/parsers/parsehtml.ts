import TurndownService from 'turndown';
import * as turndownPluginGfm from '@guyplusplus/turndown-plugin-gfm';

export async function parseHtmlContent(content: string) {
    const gfm = turndownPluginGfm.gfm;
    const turndownService = new TurndownService({
        headingStyle: 'atx',
        hr: '---',
        bulletListMarker: '-',
        codeBlockStyle: 'fenced',
        emDelimiter: '*',
    });

    turndownService.use(gfm);

    turndownService.addRule('torchlightCodeBlock', {
        filter: (node) => {
            return (
                node.nodeName === 'PRE' &&
                node.firstChild.nodeName === 'CODE' &&
                node.firstChild.firstChild.nodeName === 'P'
            );
        },
        replacement: function (_content, node, options) {
            const codeBlock = node as HTMLElement;
            codeBlock.querySelectorAll('p').forEach((codeLine) => {
                codeLine.append('\n');
            });
            const codeNode = codeBlock.firstChild as HTMLElement;
            return (
                '\n\n' +
                options.fence +
                codeNode.getAttribute('data-lang') +
                '\n' +
                codeNode.textContent +
                '\n' +
                options.fence +
                '\n\n'
            );
        },
    });

    turndownService.addRule('fencedCodeLangBlock', {
        filter: (node) => {
            return (
                node.nodeName == 'PRE' &&
                (!node.firstChild || node.firstChild.nodeName != 'CODE') &&
                !node.querySelector('img')
            );
        },
        replacement: function (_content, node, options) {
            const codeBlock = node as HTMLElement;
            codeBlock
                .querySelectorAll('br-keep')
                .forEach((br) => br.replaceWith(codeBlock.ownerDocument.createElement('br')));
            const langMatch = codeBlock.id?.match(/code-lang-(.+)/);
            const language = langMatch?.length > 0 ? langMatch[1] : '';
            const code = codeBlock.textContent;

            const fenceChar = options.fence.charAt(0);
            let fenceSize = 3;
            const fenceInCodeRegex = new RegExp('^' + fenceChar + '{3,}', 'gm');

            let match;
            while ((match = fenceInCodeRegex.exec(code))) {
                if (match[0].length >= fenceSize) {
                    fenceSize = match[0].length + 1;
                }
            }

            const fence = Array(fenceSize + 1).join(fenceChar);

            return '\n\n' + fence + language + '\n' + code.replace(/\n$/, '') + '\n' + fence + '\n\n';
        },
    });

    const articleContent = turndownService.turndown(content);

    return articleContent;
}
