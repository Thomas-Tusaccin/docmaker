import TurndownService from 'turndown';
import * as Blocks from './Blocks';

const t = new TurndownService();

// Ajouter une règle personnalisée pour le surlignage (<mark> ou span jaune)
t.addRule('highlight', {
    filter: function (node) {
        // Cas 1 : C'est une balise <mark> native
        if (node.nodeName === 'MARK') return true;

        // Cas 2 : C'est un <span> avec la couleur de fond jaune
        if (node.nodeName === 'SPAN') {
            const backgroundColor = node.style.backgroundColor.toLowerCase();
            // On vérifie "yellow" ou son équivalent RGB selon le navigateur
            return backgroundColor === 'yellow' || backgroundColor === 'rgb(255, 255, 0)';
        }

        return false;
    },
    replacement: function (content: string) {
        return '==' + content + '=='; // Syntaxe Markdown pour le surligné
    }
});

export function exportParagraphBlock(data: Blocks.ParagraphBlock) {
    return `${t.turndown(data.content)}\n`;
}


export function exportHeadingBlock(data: Blocks.HeadingBlock) {
    return `${'#'.repeat(data.level)} ${t.turndown(data.content)}\n`;
}


export function exportImageBlock(data: Blocks.ImageBlock) {
    return `![${data.alt ?? "Image"}](${data.src}){ width="${data.width || 800}" }\n/// caption\nFigure ${data.index}. ${data.caption}\n///\n`;
}


export function exportAdmonitionBlock(data: Blocks.AdmonitionBlock) {
    let lines = t.turndown(data.content).split("\n");

    let indentedLines = lines.map(l => {
        let cleanLine = l.replace(/^[\t ]+/, '');
        return `\t${cleanLine}`;
    });

    const marker = data.collapsible ? ('???' + (data.expanded ? '+' : '')) : '!!!';

    return `${marker} ${data.category} ${data.title ? '"' + data.title + '"' : ''}\n\n${indentedLines.join("\n")}\n`;
}


export function exportLineBlock(data: Blocks.LineBlock) {
    return `---\n`;
}


export function exportCodeBlock(data: Blocks.CodeBlock) {
    return `\`\`\`${data.language}\n${data.content}\n\`\`\`\n`;
}


export function exportFormulaBlock(data: Blocks.FormulaBlock) {
    return `$$\n${data.content}\n$$\n` + (data.caption ? `/// caption\nEquation ${data.index}. ${data.caption}\n///\n` : '');
}


export function exportListBlock(data: Blocks.ListBlock | Blocks.ListItem, level: number) {
    if (!data.items) return ``;

    let result = '';
    let itemCount = 0;

    data.items.forEach(li => {
        itemCount++;
        result += `\t`.repeat(level) + `${data.ordered ? itemCount + '.' : "-"} ${t.turndown(li.content)}\n`;

        if (li.items && li.items.length > 0) {
            result += exportListBlock(li, level + 1);
        }
    });

    return result;
}