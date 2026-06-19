import { Renderer, Tokens } from "marked";
import { marked } from "marked";
import * as Blocks from './scripts/Blocks';
import * as Builders from './scripts/Builders';
import * as Exports from './scripts/Exports';
import Sortable from 'sortablejs';


const BLOCK_FACTORY = {
    paragraph: (data: Blocks.ParagraphBlock) => Builders.createParagraphBlock(data, updateBlock),
    heading: (data: Blocks.HeadingBlock) => Builders.createHeadingBlock(data, updateBlock),
    line: (data: Blocks.LineBlock) => Builders.createLineBlock(data, updateBlock),
    admonition: (data: Blocks.AdmonitionBlock) => Builders.createAdmonitionBlock(data, updateBlock),
    image: (data: Blocks.ImageBlock) => Builders.createImageBlock(data, updateBlock, (fileName as HTMLInputElement).value),
    code: (data: Blocks.CodeBlock) => Builders.createCodeBlock(data, updateBlock),
    formula: (data: Blocks.FormulaBlock) => Builders.createFormulaBlock(data, updateBlock),
    list: (data: Blocks.ListBlock) => Builders.createListBlock(data, updateBlock, data.id)
}

const MARKDOWN_FACTORY = {
    paragraph: (data: Blocks.ParagraphBlock) => Exports.exportParagraphBlock(data),
    heading: (data: Blocks.HeadingBlock) => Exports.exportHeadingBlock(data),
    line: (data: Blocks.LineBlock) => Exports.exportLineBlock(data),
    admonition: (data: Blocks.AdmonitionBlock) => Exports.exportAdmonitionBlock(data),
    image: (data: Blocks.ImageBlock) => Exports.exportImageBlock(data),
    code: (data: Blocks.CodeBlock) => Exports.exportCodeBlock(data),
    formula: (data: Blocks.FormulaBlock) => Exports.exportFormulaBlock(data),
    list: (data: Blocks.ListBlock) => Exports.exportListBlock(data, 0)
}

const BLOCK_DEFAULTS = {
    heading1: { type: "heading", content: "", level: 1 },
    heading2: { type: "heading", content: "", level: 2 },
    heading3: { type: "heading", content: "", level: 3 },
    heading4: { type: "heading", content: "", level: 4 },
    heading5: { type: "heading", content: "", level: 5 },
    heading6: { type: "heading", content: "", level: 6 },
    paragraph: { type: "paragraph", content: "" },
    image: { type: "image", src: "img/dossier/dossier-1.png", alt: "", caption: "", width: 800 },
    note: { type: "admonition", category: "note", title: "", content: "", collapsible: false, expanded: false },
    info: { type: "admonition", category: "info", title: "", content: "", collapsible: false, expanded: false },
    warning: { type: "admonition", category: "warning", title: "", content: "", collapsible: false, expanded: false },
    danger: { type: "admonition", category: "danger", title: "", content: "", collapsible: false, expanded: false },
    example: { type: "admonition", category: "example", title: "", content: "", collapsible: false, expanded: false },
    success: { type: "admonition", category: "success", title: "", content: "", collapsible: false, expanded: false },
    line: { type: "line" },
    code: { type: "code", language: "matlab", content: "" },
    formula: { type: "formula", content: "", caption: "" },
    ulist: { type: "list", items: [], ordered: false },
    olist: { type: "list", items: [], ordered: true }
};

let state: Array<Blocks.EditorBlock> = [];
state.push({ id: crypto.randomUUID(), type: "heading", content: "", level: 1 });


// Références DOM

const editor = document.getElementById("editor");
const selectAdd = document.getElementById("add");
const fileName = document.getElementById("fileName") as HTMLInputElement;
const buttonImport = document.getElementById("import");
const inputImport = document.getElementById("input-import");
const buttonExport = document.getElementById("export");
const buttonBold = document.getElementById("bold");
const buttonItalic = document.getElementById("italic");
const buttonHighlight = document.getElementById("highlight");
const buttonCode = document.getElementById("inline-code");

// Event listeners

document.addEventListener("DOMContentLoaded", () => {
    renderEditor();
    initSortable();
});

fileName?.addEventListener("input", (e: InputEvent) => {
    (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.replace(/\s/, '-');

    const newInput = (e.target as HTMLInputElement).value;
    
    // Si l'input est vide, on peut mettre une valeur par défaut ou laisser vide
    const targetFolder = newInput || "dossier";

    // Notre RegEx magique
    // Elle cherche "img/", puis n'importe quoi jusqu'au dernier "/", puis capture la fin du fichier
    const regexStructure = /img\/[^\/]+\/.*(-[0-9]+\.(?:png|jpg|jpeg|webp))$/i;

    document.querySelectorAll<HTMLInputElement>(".image-path").forEach((input) => {
      const currentPath = input.value;

      // On vérifie si le chemin correspond bien à notre structure attendue
      if (regexStructure.test(currentPath)) {
        // $1 contient le suffixe capturé (ex: "-1.png")
        const newPath = currentPath.replace(
          regexStructure, 
          `img/${targetFolder}/${targetFolder}$1`
        );
        
        // On met à jour le champ
        input.value = newPath;
        const id = input.dataset.id as string;
        updateBlock(id, { src: newPath });
      }
    });
});

selectAdd?.addEventListener("input", (e: InputEvent) => {
    const type = (e.target as HTMLSelectElement).value
    if (type === "") return;
    addBlock(type);
    (e.target as HTMLSelectElement).value = "";
});

export function addBlock(type: string, previous?: string | undefined) {
    const data = structuredClone(BLOCK_DEFAULTS[type]);
    data.id = crypto.randomUUID();

    if (previous) {
        const index = state.findIndex(b => b.id === previous);
        state.splice(index + 1, 0, data);
    } else {
        state.push(data);
    }

    renderEditor();
}

buttonImport?.addEventListener("click", () => {
    inputImport?.click();
})

inputImport?.addEventListener("input", (e: InputEvent) => {
    importMarkdown(e);
});

buttonExport?.addEventListener("click", () => {
    download(exportToMarkdown());
});

document.querySelectorAll(".edit-button").forEach((btn) => {
    btn.addEventListener('mousedown', function(event) {
        event.preventDefault(); 
    });
})

buttonBold?.addEventListener("click", toggleBold);
buttonItalic?.addEventListener("click", toggleItalic);
buttonHighlight?.addEventListener("click", toggleHighlight);
buttonCode?.addEventListener("click", toggleCode);

function toggleBold() {
    document.execCommand('bold', false);
}

function toggleItalic() {
    document.execCommand('italic', false);
}

function toggleHighlight() {
    document.execCommand('hiliteColor', false, 'yellow');
}

function toggleCode() {
    const selection = window.getSelection();

    if (!selection) return;
    if (!selection.rangeCount || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const editor = document.getElementById('editor'); 

    const hasCode = getClosestCode(range.commonAncestorContainer) || 
                    (range.cloneContents().querySelector('code') !== null);

    if (hasCode) {
        // Retirer le code

        const parentCodeNode = getClosestCode(range.commonAncestorContainer);

        if (parentCodeNode) {
        // 1. On mémorise le parent global pour replacer notre structure
        const parentOfCode = parentCodeNode.parentNode;

        // 2. On découpe le code en 3 parties selon la sélection exacte de l'utilisateur
        const beforeRange = document.createRange();
        beforeRange.setStartBefore(parentCodeNode);
        beforeRange.setEnd(range.startContainer, range.startOffset);
        const beforeContent = beforeRange.cloneContents();

        const afterRange = document.createRange();
        afterRange.setStart(range.endContainer, range.endOffset);
        afterRange.setEndAfter(parentCodeNode);
        const afterContent = afterRange.cloneContents();

        // 3. On extrait le texte brut sélectionné (l'ordre est maintenu ici)
        const selectedText = range.toString();
        const normalTextNode = document.createTextNode(selectedText);

        // 4. On reconstruit le DOM dans l'ORDRE STRICT
        const fragment = document.createDocumentFragment();

        // Partie gauche (Reste en code)
        const newCodeBefore = document.createElement('code');
        newCodeBefore.appendChild(beforeContent);
        fragment.appendChild(newCodeBefore);

        // Partie centrale (Devient du texte normal)
        fragment.appendChild(normalTextNode);

        // Partie droite (Reste en code)
        const newCodeAfter = document.createElement('code');
        newCodeAfter.appendChild(afterContent);
        fragment.appendChild(newCodeAfter);

        // On remplace l'ancien bloc par notre suite logique ordonnée
        parentOfCode.replaceChild(fragment, parentCodeNode);

        } else {
            // Si le code était partiel/imbriqué de manière étrange, on extrait et aplatit
            const extractedContent = range.extractContents();
            const innerCodes = extractedContent.querySelectorAll('code');

            innerCodes.forEach(innerCode => {
                const fragment = document.createDocumentFragment();
                while (innerCode.firstChild) fragment.appendChild(innerCode.firstChild);

                innerCode.parentNode?.replaceChild(fragment, innerCode);
            });

            range.insertNode(extractedContent);
        }

        // Nettoyage des balises code
        const allCodes = editor?.querySelectorAll('code');
        allCodes?.forEach(node => {
        if (!node.textContent || node.textContent.trim() === '' || node.innerHTML === '') {
            node.parentNode?.removeChild(node);
        }
        });

    } else {
        // Ajouter le code
        const codeElement = document.createElement('code');
        
        try {
            range.surroundContents(codeElement);
        } catch (e) {
            const extractedContent = range.extractContents();
            const innerCodes = extractedContent.querySelectorAll('code');
            
            innerCodes.forEach(innerCode => {
                const textNode = document.createTextNode(innerCode.textContent);
                innerCode.parentNode?.replaceChild(textNode, innerCode);
            });

            codeElement.appendChild(extractedContent);
            range.insertNode(codeElement);
        }
        
        const newRange = document.createRange();
        newRange.selectNodeContents(codeElement);
        selection.removeAllRanges();
        selection.addRange(newRange);
    }
}

function getClosestCode(node) {
  let current = node;
  while (current && current.id !== 'editor') {
    if (current.nodeName === 'CODE') return current;
    current = current.parentNode;
  }
  return null;
}

// Fonction pour nettoyer les balises devenues vides après l'extraction
function cleanEmptyNodes(parentNode: Node) {
    if (!parentNode) return;
    const nodes = document.querySelectorAll('strong, b, em, i, code');
    nodes.forEach(node => {
        // Si la balise n'a plus de texte ou est vide, on la vire
        if (!node.textContent.trim() || node.innerHTML === "") {
            node.parentNode?.removeChild(node);
        }
    });
}

// Renderer custom Marked (+ extension Admonition)

const blockRenderer = new Renderer();

blockRenderer.paragraph = function({ text }) {
    const htmlInline = marked.parseInline(text) as string;

    state.push({ id: crypto.randomUUID(), type: "paragraph", content: htmlInline });
    return '';
}

blockRenderer.heading = function({ text, depth }) {
    const htmlInline = marked.parseInline(text) as string;

    state.push({ id: crypto.randomUUID(), type: "heading", content: htmlInline, level: depth });
    return '';
}

blockRenderer.hr = function() {
    state.push({ id: crypto.randomUUID(), type: "line" });
    return '';
}

blockRenderer.code = function({ text, lang, escaped }) {
    state.push({ id: crypto.randomUUID(), type: "code", language: lang, content: text });
    return '';
}

blockRenderer.list = function(list) {
    const parseListItems = (items: Tokens.ListItem[]) => {
        return items.map(item => {
            const subListToken = item.tokens.find(t => t.type === 'list') as Tokens.List;
            let children = [];

            if (subListToken) {
                // Récursion si une sous-liste existe
                children = parseListItems(subListToken.items);
            }

            // 2. On extrait le texte/inline de l'item (en excluant la sous-liste pour ne pas la doubler)
            const inlineTokens = item.tokens.filter(t => t.type !== 'list');
            
            // Vous pouvez utiliser le parser de marked pour transformer les tokens inline en HTML
            // ou stocker les tokens directement si votre éditeur les gère.
            const content = this.parser.parseInline(inlineTokens);

            return {
                id: crypto.randomUUID(),
                type: "listitem",
                content: content, // Contenu HTML ou texte enrichi de l'item
                items: children // Sous-liste imbriquée
            };
        }); 
    } 

    state.push({ id: crypto.randomUUID(), type: "list", items: parseListItems(list.items), ordered: list.ordered });
    return '';
}

var admonitionTypes = [
  "abstract",
  "attention",
  "bug",
  "caution",
  "danger",
  "error",
  "example",
  "failure",
  "hint",
  "info",
  "note",
  "question",
  "quote",
  "success",
  "tip",
  "warning"
];

const admonitionExtension = {
    name: 'admonition',
    level: 'block', // C'est un élément de niveau bloc (comme un paragraphe ou une liste)
    
    // Indice pour Marked.js : on cherche le déclencheur "!!!" en début de ligne
    start(src: string) { 
        return src.match(/^!!!/m)?.index; 
    },
    
    tokenizer(src: string) {
        // Regex pour capturer tout le bloc de l'admonition
        // - Ligne 1 : !!! <type> "<titre>"
        // - Lignes suivantes : blocs de texte dont chaque ligne commence par une tabulation (\t) ou 4 espaces
        // - S'arrête dès qu'il y a deux retours à la ligne consécutifs (\n\n) non suivis d'une tabulation/espace.
        const rule = new RegExp(
            `^(?<marker>!!!|\\?\\?\\?\\+?) (?<type>${admonitionTypes.join("|")})(?: "(?<title>[^"\\n]+)")?\\n(?<content>(?:(?:\\t| {4}).*(?:\\n|$)|(?:\\t| {4})?\\n)+)`
        );
        
        const match = rule.exec(src);
        
        if (match) {
            const [raw, marker, type, title, rawContent] = match;

            const collapsible = marker.startsWith('???');
            const expanded = marker === '???+';
        
            // Nettoyage
            const cleanText = rawContent
                .split('\n')
                .map(line => {
                    // On retire l'indentation initiale si elle existe
                    return line.replace(/^(\t| {4})/, '');
                })
                .join('\n')
                .trim();
            
            const htmlInline = marked.parseInline(cleanText) as string;

            const token = {
                type: 'admonition', 
                raw: raw,
                collapsible: collapsible,
                expanded: expanded,  
                category: type,         
                title: title || "", 
                content: htmlInline,    
                titleTokens: [],    
                tokens: [] 
            };

            return token;
        }
    },
    
    renderer(token) {
        state.push({ id: crypto.randomUUID(), type: "admonition", collapsible: token.collapsible, expanded: token.expanded, title: token.title, content: token.content, category: token.category });
        return '';
    }
};

const imageCaptionExtension = {
    name: 'imageCaption',
    level: 'block', // C'est un élément de niveau bloc (comme un paragraphe ou une liste)
    
    // Indice pour Marked.js : on cherche le déclencheur "!!!" en début de ligne
    start(src: string) { 
        return src.match(/^!\[/m)?.index; 
    },
    
    tokenizer(src: string) {
        // Regex pour capturer tout le bloc de l'admonition
        // - Ligne 1 : !!! <type> "<titre>"
        // - Lignes suivantes : blocs de texte dont chaque ligne commence par une tabulation (\t) ou 4 espaces
        // - S'arrête dès qu'il y a deux retours à la ligne consécutifs (\n\n) non suivis d'une tabulation/espace.
        const rule = new RegExp(
            `^!\\[(?<alt>[^\\[\\]"\\n]+)\\]\\((?<src>[^\\)\\s]+)\\)(?:\\s*\\{\\s*width="(?<width>[0-9]{3})"` +
            `\\s*\\})?\\s*(?:\\r?\\n)/// caption\\s*(?:\\r?\\n)Figure\\s*(?<index>[0-9]+)\\.\\s*(?<caption>.+)(?:\\r?\\n)///(?:\\r?\\n|$)`
        );
        
        const match = rule.exec(src);
        
        if (match) {
            const [raw, alt, src, width, index, caption] = match;
            
            const token = {
                type: 'imageCaption', 
                raw: raw,
                alt: alt || "",
                src: src,
                caption: caption,
                index: index,
                width: Number(width)
            };

            return token;
        }
    },
    
    renderer(token) {
        state.push({ id: crypto.randomUUID(), type: "image", alt: token.alt, src: token.src, index: token.index, caption: token.caption, width: token.width });
        return '';
    }
};

const abbreviationExtension = {};

const formulaExtension = {
    name: 'formulaCaption',
    level: 'block', // C'est un élément de niveau bloc (comme un paragraphe ou une liste)
    
    // Indice pour Marked.js : on cherche le déclencheur "$$" en début de ligne
    start(src: string) { 
        // Trouve le premier "$$" qui est soit au début du texte, soit juste après un saut de ligne
        const match = src.match(/(?:^|\n)\$\$/);
        
        // Si on trouve un match, on renvoie l'index exact du début des "$$"
        if (match) {
            return match.index + (match[0].startsWith('\n') ? 1 : 0);
        }
        return undefined;
    },
    
    tokenizer(src: string) {
        const rule = new RegExp(
            `^\\$\\$(?:\\r?\\n)` +
            `(?<math>[\\s\\S]+?)` +
            `(?:\\r?\\n)\\$\\$\\s*` +
            `(?:` +
                `(?:\\r?\\n)/// caption\\s*(?:\\r?\\n)` +
                `Equation\\s*(?<index>[0-9]+)\\.\\s*(?<caption>.+)(?:\\r?\\n)` +
                `///` +
            `)?` +
            `(?:\\r?\\n|$)`
        );
        
        const match = rule.exec(src);
        
        if (match) {
            const [raw, math, index, caption] = match;
            
            const token = {
                type: 'formulaCaption', 
                raw: raw,
                math: math,
                caption: caption || "",
                index: index
            };

            return token;
        }
    },
    
    renderer(token) {
        state.push({ id: crypto.randomUUID(), type: "formula", content: token.math, index: token.index, caption: token.caption });
        return '';
    }
}

const highlightExtension = {
    name: 'highlight',
    level: 'inline', // Indique que c'est du formatage au milieu du texte
    
    // Le "start" aide Marked à trouver le prochain index potentiel pour optimiser les performances
    start(src: string) { 
        return src.indexOf('=='); 
    },
    
    // Le Tokenizer : repère la syntaxe via une Regex
    tokenizer(src: string, tokens) {
        const rule = /^==([^=]+)==/; // Match exactement ==texte== sans autres '=' à l'intérieur
        const match = rule.exec(src);
        
        if (match) {
            return {
                type: 'highlight',           // Doit correspondre au nom de l'extension
                raw: match[0],               // Le texte complet trouvé (ex: ==texte==)
                text: match[1],              // Le contenu capturé (ex: texte)
                tokens: this.lexer.inlineTokens(match[1]) // Permet d'imbriquer d'autres styles (ex: ==texte **gras**==)
            };
        }
    },
    
    renderer(token) {
        return `<span style="background-color: yellow;">${this.parser.parseInline(token.tokens)}</span>`;
    }
};

function expandTabs(str: string, tabSize: number = 4): string {
  return str.replace(/\t/g, (match, offset) => {
    // Calcule le nombre d'espaces nécessaires pour s'aligner sur le prochain "tab stop"
    const spaces = tabSize - (offset % tabSize);
    return ' '.repeat(spaces);
  });
}

marked.use({
  hooks: {
    preprocess(markdown: string): string {
        // 1. On normalise d'abord les retours à la ligne (CRLF Windows vers LF standard)
        let cleanMarkdown = markdown.replace(/\r\n/g, '\n');

        // 2. RegEx robuste : 
        // - On autorise des espaces avant la puce (^[ \t]*) pour gérer l'imbrication
        // - On capture la puce et son texte ($1)
        // - On avale toutes les lignes contenant uniquement des espaces ou des sauts de ligne
        // - On s'assure que la ligne suivante est aussi une puce
        const regexMultiLignesVides = /(^[ \t]*(?:[-*+]|\d+\.)\s+.*)(?:\n[ \t]*)+(?=(?:[-*+]|\d+\.)\s+)/gm;
        
        return cleanMarkdown.replace(regexMultiLignesVides, '$1\n');
    }
  },
  renderer: blockRenderer, 
  extensions: [admonitionExtension, imageCaptionExtension, formulaExtension, highlightExtension]
});



// Drag and drop

function initSortable() {
    if (!editor) return;

    Sortable.create(editor, {
        animation: 150,
        // On écoute l'événement de fin de drag
        onEnd: (evt) => {
            // Sécurité TypeScript : on vérifie que les index existent
            if (evt.oldIndex === undefined || evt.newIndex === undefined) return;
            
            state = reorder(state, evt.oldIndex, evt.newIndex);
            renderEditor();
        }
    });
}

export function reorder<T>(array: T[], oldIndex: number, newIndex: number): T[] {
    const copy = [...array];
    const [block] = copy.splice(oldIndex, 1);

    copy.splice(newIndex, 0, block);

    return copy;
}

// Fonctions

export function getBlocks() {
    return state;
}

export function setBlocks(newBlocks: Array<Blocks.EditorBlock>) {
    state = newBlocks;
}

function findAndDelete(items: any[], idToDelete: string): boolean {
    // 1. On cherche si l'élément à supprimer est directement dans ce tableau
    const index = items.findIndex(item => item.id === idToDelete);
    
    if (index !== -1) {
        items.splice(index, 1); // Supprime l'élément trouvé
        return true; // Indique que la suppression a été effectuée
    }

    // 2. Si non trouvé à ce niveau, on cherche dans les enfants de chaque item
    for (let item of items) {
        if (item.items && item.items.length > 0) {
            const found = findAndDelete(item.items, idToDelete);
            if (found) return true; // Si supprimé plus bas, on arrête la recherche
        }
    }
    
    return false;
}

export function deleteBlockById(id: string) {
    const rootIndex = state.findIndex(b => b.id === id);

    if (rootIndex !== -1) {
        state.splice(rootIndex, 1);
        renderEditor();
        return;
    }

    // Étape B : Sinon, on cherche le sous-élément dans les profondeurs de l'arbre
    for (let rootBlock of state) {
        if (rootBlock.hasOwnProperty("items")) {
            const deleted = findAndDelete(rootBlock.items, id);
            renderEditor();
            if (deleted) break;
        }
    }
}

// Fonction d'aide récursive pour trouver et mettre à jour un élément dans un arbre
function findAndScaleUpdate(items: any[], idToFind: string, fieldsToUpdate: any): boolean {
    for (let item of items) {
        // 1. Si on a trouvé le bon élément (qu'il soit au niveau 1, 2, 3...)
        if (item.id === idToFind) {
            Object.assign(item, fieldsToUpdate);
            return true; // Trouvé et mis à jour ! On arrête la recherche.
        }
        
        // 2. Sinon, si cet élément a des enfants, on cherche récursivement dedans
        if (item.items && item.items.length > 0) {
            const found = findAndScaleUpdate(item.items, idToFind, fieldsToUpdate);
            if (found) return true; // Si trouvé plus bas, on remonte l'info
        }
    }
    return false;
}

function findAndRemoveItem(items: any[], idToFind: string): any | null {
    for (let i = 0; i < items.length; i++) {
        if (items[i].id === idToFind) {
            // On retire l'élément du tableau et on le renvoie
            return items.splice(i, 1)[0];
        }
        if (items[i].items && items[i].items.length > 0) {
            const found = findAndRemoveItem(items[i].items, idToFind);
            if (found) return found;
        }
    }
    return null;
}

function findAndInsertItem(items: any[], parentId: string, itemToInsert: any, index: number): boolean {
    for (let item of items) {
        if (item.id === parentId) {
            if (!item.items) item.items = [];
            // On insère l'élément à l'index désiré chez le parent cible
            item.items.splice(index, 0, itemToInsert);
            return true;
        }
        if (item.items && item.items.length > 0) {
            const inserted = findAndInsertItem(item.items, parentId, itemToInsert, index);
            if (inserted) return true;
        }
    }
    return false;
}

export function moveBlock(itemId: string, targetParentId: string, targetIndex: number) {
    console.log("Id :", itemId);
    console.log("Id du parent cible :", targetParentId);
    console.log("Index d'arrivée :", targetIndex);
    // Étape 1 : Trouver et extraire l'élément de son emplacement actuel
    const itemToMove = findAndRemoveItem(state, itemId);
    
    if (!itemToMove) {
        console.error("Élément introuvable dans le state");
        return;
    }

    // Étape 2 : Insérer l'élément dans son nouveau parent
    // Si targetParentId est nul ou correspond à la racine, on l'insère à la racine du state
    if (!targetParentId || targetParentId === "root") {
        state.splice(targetIndex, 0, itemToMove);
    } else {
        const inserted = findAndInsertItem(state, targetParentId, itemToMove, targetIndex);
        console.log(inserted);
        if (!inserted) {
            console.error("Parent cible introuvable");
        }
    }
}

export function updateBlock(id: string, fields: Partial<Blocks.EditorBlock>) {
    let block = state.find(b => b.id === id);

    if (block) {
        Object.assign(block, fields);
    } else {
        // Étape B : Si ce n'est pas à la racine, c'est un sous-élément imbriqué.
        // On parcourt tous les blocs de premier niveau pour chercher dans leurs enfants.
        for (let rootBlock of state) {
            if (rootBlock.items) {
                const updated = findAndScaleUpdate(rootBlock.items, id, fields);
                if (updated) break; // Trouvé et mis à jour, on sort de la boucle
            }
        }
    }
}

export function renderEditor() {
    if (!editor) return;

    editor.innerHTML = '';
    let imageCount = 0;
    let formulaCount = 0;
    
    state.forEach(blockData => {
        if (blockData.type === "image") {
            imageCount++;
            blockData.index = imageCount;
        } else if (blockData.type === "formula") {
            formulaCount++;
            blockData.index = formulaCount;
            
        }

        const block: HTMLDivElement = BLOCK_FACTORY[blockData.type](blockData);
        
        editor.append(block);
    });
}


/// Import et export en Markdown

function importMarkdown(event: InputEvent) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            const contenu = e.target?.result as string;

            fileName.value = file.name.replace(/\.md$/, '');

            state = [];
            marked.parse(contenu, { async: false });
            renderEditor();
        };

        reader.readAsText(file);
    }
}

function exportToMarkdown() {
    return state.map(data => MARKDOWN_FACTORY[data.type](data)).join('\n');
}

function download(text: string) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/markdown;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', (fileName as HTMLInputElement).value);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}