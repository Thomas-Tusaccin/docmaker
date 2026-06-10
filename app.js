import { marked } from 'marked';

const elementTypes = {
  heading2: { type: "heading", content: "", level: 2 },
  heading3: { type: "heading", content: "", level: 3 },
  heading4: { type: "heading", content: "", level: 4 },
  heading5: { type: "heading", content: "", level: 5 },
  heading6: { type: "heading", content: "", level: 6 },
  paragraph: { type: "paragraph", content: ""},
  image: { type: "image", src: "", alt: "", caption: "", width: 800 },
  note: { type: "admonition", category: "note", title: "", content: "" },
  info: { type: "admonition", category: "info", title: "", content: "" },
  warning: { type: "admonition", category: "warning", title: "", content: "" },
  danger: { type: "admonition", category: "danger", title: "", content: "" },
  example: { type: "admonition", category: "example", title: "", content: "" }, 
  line: { type: "line" },
  code: { type: "code", language: "matlab", content: ""},
  formula: { type: "formula", content: "", caption: ""}
};

let elements = [
    { type: "heading", level: 1, content: "" }
];

const selectAdd = document.getElementById("add");
const fileName = document.getElementById("fileName");
const buttonExport = document.getElementById("export");

// Event listeners

document.addEventListener("DOMContentLoaded", () => {
    renderEditor();
})

selectAdd.addEventListener("input", (e) => {
    if (e.target.value === "") return;

    const object = elementTypes[e.target.value] 
        ? { ...elementTypes[e.target.value] } 
        : null;

    if (object === null) return;

    elements.push(object);
    console.log(elements);
    renderEditor();
});

buttonExport.addEventListener("click", () => {
    download(exportToMarkdown(elements));
});

// Affichage des blocs

function renderEditor() {
    const editor = document.getElementById("editor");
    editor.innerHTML = '';

    let block;
    
    elements.forEach((element, index) => {
        switch (element.type) {
            case "heading":
                block = buildHeading(element, index);
                break;
            case "paragraph":
                block = buildParagraph(element, index);
                break;
            case "image":
                block = buildImage(element, index, count);
                break;
            case "admonition":
                block = buildAdmonition(element, index);
                break;
            case "line":
                block = buildLine(element, index);
                break;
            case "code":
                block = buildCode(element, index);
                break;
            case "formula":
                block = buildFormula(element, index, count);
                break;
            default:
                break;
        }

        block.classList.add("block");
        editor.append(block);
    });
}

/// Export en Markdown

function exportToMarkdown(elements) {
    return elements.map(el => {
        switch (el.type) {
            case 'heading': 
                return `${'#'.repeat(el.level)} ${el.content}\n`;
            case 'paragraph': 
                return `${el.content}\n`;
            case 'image': 
                return `![${el.alt ?? "Image"}](${el.src}){ width="${el.width}" }\n/// caption\n${el.caption}\n///\n`;
            case 'admonition': 
                return `!!! ${el.category} ${el.title ?? ""}\n\n\t${el.content}\n`;
            case 'line':
                return `---\n`;
            case 'code':
                return `\`\`\`${el.language}\n${el.content}\n\`\`\`\n`;
            case 'formula':
                return `$$\n${el.content}\n$$\n/// caption\n${el.caption}\n///\n`;
        }
    }).join('\n');
}

function download(text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/markdown;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', fileName.value);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

// Création des blocs modifiables

function buildParagraph(element, index) {
    const block = document.createElement("div");
    const input = document.createElement("textarea");

    input.placeholder = "Écrivez votre paragraphe ici...";
    input.value = element.content ?? "";

    input.addEventListener('input', (e) => {
        elements[index].content = e.target.value;
    });

    block.append(input);
    block.classList.add("paragraph");

    return block;
}

function buildHeading(element, index) {
    const block = document.createElement("div");
    const input = document.createElement("input");

    input.placeholder = `Titre de niveau ${element.level}`;
    input.value = element.content ?? "";

    if (element.level === 1) {
        input.addEventListener("input", (e) => {
            fileName.value = e.target.value.toLowerCase().replace(/ /g, '-');
        })
    }

    input.addEventListener('input', (e) => {
        elements[index].content = e.target.value;
    });

    block.append(input);
    block.classList.add(`heading${element.level}`);

    return block;
}

function buildImage(element, index, count) {
    const block = document.createElement("div");

    const inputSrc = document.createElement("input");
    const inputAlt = document.createElement("input");
    const inputCaption = document.createElement("input");
    const inputWidth = document.createElement("input");

    inputSrc.placeholder = `Lien de l'image`;
    inputSrc.value = element.src || (fileName.value ? `img/${fileName.value}/${fileName.value}-${count}.png` : '');

    inputSrc.addEventListener('input', (e) => {
        elements[index].src = e.target.value;
    });

    inputAlt.placeholder = `Texte alternatif de l'image`;
    inputAlt.value = element.alt;

    inputAlt.addEventListener('input', (e) => {
        elements[index].alt = e.target.value;
    });

    // Légende de l'image

    inputCaption.placeholder = `Légende de l'image`;
    inputCaption.value = element.caption ?? "";

    inputCaption.addEventListener('input', (e) => {
        elements[index].caption = e.target.value;
    });

    // Largeur de l'image (pixels)

    inputWidth.type = "number";
    inputWidth.placeholder = `Largeur de l'image`;
    inputWidth.value = element.width ?? 800;

    inputWidth.addEventListener('input', (e) => {
        elements[index].width = e.target.value;
    });

    block.append(inputCaption, inputSrc, inputAlt, inputWidth);
    block.classList.add("image");

    return block;
}

function buildAdmonition(element, index) {
    const block = document.createElement("div");
    const input = document.createElement("textarea");

    input.placeholder = `Encadré ${element.category}`;
    input.value = element.content ?? "";

    input.addEventListener('input', (e) => {
        elements[index].content = e.target.value;
    });

    block.append(input);
    block.classList.add(element.category);

    return block;
}

function buildLine(element, index) {
    const block = document.createElement("div");
    const line = document.createElement("hr");

    block.append(line);
    block.classList.add("line");

    return block;
}

function buildCode(element, index) {
    const block = document.createElement("div");

    const inputLanguage = document.createElement("input");
    const inputContent = document.createElement("textarea");

    inputLanguage.placeholder = `Langage utilisé (optionnel)`;
    inputLanguage.value = element.language ?? "";

    inputLanguage.addEventListener('input', (e) => {
        elements[index].language = e.target.value;
    });

    inputContent.placeholder = `Écrivez votre code ici...`;
    inputContent.value = element.content ?? "";

    inputContent.addEventListener('input', (e) => {
        elements[index].content = e.target.value;
    });

    block.append(inputLanguage, inputContent);
    block.classList.add("code");

    return block;
}

function buildFormula(element, index) {
    const block = document.createElement("div");

    const inputContent = document.createElement("input");
    const inputCaption = document.createElement("input");

    inputContent.placeholder = `Écrivez votre formule ici...`;
    inputContent.value = element.content ?? "";

    inputContent.addEventListener('input', (e) => {
        elements[index].content = e.target.value;
    });

    inputCaption.placeholder = `Écrivez votre légende ici...`;
    inputCaption.value = element.caption ?? "";

    inputCaption.addEventListener('input', (e) => {
        elements[index].caption = e.target.value;
    });

    block.append(inputContent, inputCaption);
    block.classList.add("formula");

    return block;
}


document.querySelectorAll(".remove").forEach(button => {
    button.addEventListener("click", () => {
        removeElement(button.parentElement);
    })
});

function buildBlock(tag) {
    const block = document.createElement("div");
    block.classList.add("element");

    const input = document.createElement("input");
    input.classList.add(tag);
    input.type = "text";
    input.placeholder = tag;

    block.append(input, buildButtonList());

    return block;
}

function buildButton(text, event) {
    const button = document.createElement("button");
    button.texteditor = text;
    button.onclick = event;

    return button;
}

function buildButtonList() {
    const buttonList = document.createElement("div");
    buttonList.classList.add("button-list");

    const selectAddBelow = buildButton("Add below", () => { addElementBelow("h2", selectAddBelow.parentElement.parentElement); }); 
    const buttonRemove = buildButton("Remove element", () => { removeElement(buttonRemove.parentElement.parentElement); });
    const buttonUp = buildButton("Move up", () => { moveUp(buttonRemove.parentElement.parentElement); }); 
    const buttonDown = buildButton("Move down", () => { moveDown(buttonRemove.parentElement.parentElement); });

    buttonList.append(selectAddBelow, buttonRemove, buttonUp, buttonDown);

    return buttonList;
}

function addElementBelow(tag, element) {
    const elt = buildElement(tag);
    
    element.after(elt);
}

function removeElement(element) {
    element.remove();
}

function moveUp(element) {
    var upperSibling = element.previousElementSibling;
    if (upperSibling === null) return;
    upperSibling.insertAdjacentElement("beforebegin", element);
}

function moveDown(element) {
    var lowerSibling = element.nextElementSibling;
    if (lowerSibling === null) return;
    lowerSibling.insertAdjacentElement("afterend", element);
}

function addElement(tag) {
    editor.append(buildElement(tag));
}
