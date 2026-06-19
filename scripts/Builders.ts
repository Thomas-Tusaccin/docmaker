import * as Blocks from './Blocks';
import { deleteBlockById, getBlocks, renderEditor, moveBlock, addBlock } from '../main';
import Sortable from 'sortablejs';

function wrapBlock(block: HTMLDivElement, data: Blocks.EditorBlock) {
    const newBlock = document.createElement("div");
    newBlock.classList.add("block");
    newBlock.dataset.id = data.id;

    const buttonDiv = document.createElement("div");
    buttonDiv.classList.add("button-list");

    const buttonDelete = document.createElement("button");
    buttonDelete.textContent = "X";
    buttonDelete.className = "icon";

    buttonDelete.addEventListener("click", () => {
        deleteBlockById(data.id);
    });

    buttonDiv.append(buttonDelete);

    const selectAdd = document.getElementById("add");
    const buttonInsertAfter = selectAdd?.cloneNode(true);

    buttonInsertAfter?.addEventListener("input", (e: InputEvent) => {
        const type = (e.target as HTMLSelectElement).value
        if (type === "") return;
        addBlock(type, data.id);
        (e.target as HTMLSelectElement).value = "";
    });

    if (buttonInsertAfter) {
        buttonDiv.append(buttonInsertAfter);
    }

    block.classList.add("block-content");
    newBlock.append(block);
    newBlock.append(buttonDiv);

    return newBlock;
}

export function createParagraphBlock(data: Blocks.ParagraphBlock, onUpdate: (id: string, fields: Partial<Blocks.ParagraphBlock>) => void) {
    const block = document.createElement("div");
    const input = document.createElement("div");

    input.contentEditable = "true";
    input.setAttribute("data-placeholder", "Écrivez votre paragraphe ici...");
    input.innerHTML = data.content ?? "";

    input.addEventListener('input', (e: InputEvent) => {
        if (input.innerHTML === '<br>') {
            input.innerHTML = '';
        }

        onUpdate(data.id, { content: (e.target as HTMLInputElement).innerHTML });
    });

    block.append(input);
    block.classList.add("paragraph");

    return wrapBlock(block, data);
}


export function createHeadingBlock(data: Blocks.HeadingBlock, onUpdate: (id: string, fields: Partial<Blocks.HeadingBlock>) => void) {
    const block = document.createElement("div");
    const input = document.createElement("div");

    input.contentEditable = "true";
    input.setAttribute("data-placeholder", `Titre de niveau ${data.level}`);
    input.innerHTML = data.content ?? "";

    input.addEventListener('input', (e: InputEvent) => {
        onUpdate(data.id, { content: (e.target as HTMLInputElement).innerHTML });
    });

    block.append(input);
    block.classList.add(`heading${data.level}`);

    return wrapBlock(block, data);
}


export function createLineBlock(data: Blocks.LineBlock, _onUpdate: (id: string, fields: Partial<Blocks.HeadingBlock>) => void) {
    const block = document.createElement("div");
    const input = document.createElement("hr");

    block.append(input);
    block.classList.add("line");

    return wrapBlock(block, data);
}


export function createImageBlock(data: Blocks.ImageBlock, onUpdate: (id: string, fields: Partial<Blocks.ImageBlock>) => void, fileName: string) {
    const block = document.createElement("div");

    const inputSrc = document.createElement("input");
    const inputAlt = document.createElement("input");
    const inputIndex = document.createElement("input");
    const inputCaption = document.createElement("input");
    const inputWidth = document.createElement("input");

    // 2. Création de la zone cliquable (Label)
    const uploaderLabel = document.createElement('label');
    uploaderLabel.className = 'image-uploader';

    // 3. Création de l'input de fichier (caché)
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.className = 'visually-hidden';

    // 4. Création du placeholder (texte + icône)
    const placeholder = document.createElement('div');
    placeholder.className = 'upload-placeholder';

    const icon = document.createElement('span');
    icon.textContent = '+';
    icon.style.fontSize = "4em";

    const text = document.createElement('p');
    text.textContent = 'Cliquez pour importer une image';

    placeholder.appendChild(icon);
    placeholder.appendChild(text);

    // 5. Création de la balise Image (masquée au départ)
    const imagePreview = document.createElement('img');
    imagePreview.className = 'image-preview hidden';
    imagePreview.alt = 'Aperçu de l\'image';

    // 6. Assemblage de la structure HTML
    uploaderLabel.appendChild(fileInput);
    uploaderLabel.appendChild(placeholder);
    uploaderLabel.appendChild(imagePreview);
    block.appendChild(uploaderLabel);

    // 7. Ajout de l'écouteur d'événements "change" sur l'input
    fileInput.addEventListener('change', (event: Event) => {
        const target = event.target as HTMLInputElement;

        if (target.files && target.files[0]) {
        const fichier = target.files[0];

        // Génération de l'URL locale temporaire
        const urlApercu = URL.createObjectURL(fichier);

        // Mise à jour de l'image et bascule des classes d'affichage
        imagePreview.src = urlApercu;
        imagePreview.classList.remove('hidden');
        placeholder.classList.add('hidden');
        }
    });

    // [Bonus] Ajout d'effets visuels simples lors du Drag & Drop
    uploaderLabel.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploaderLabel.style.borderColor = '#3b82f6';
    });

    uploaderLabel.addEventListener('dragleave', () => {
        uploaderLabel.style.borderColor = '#cbd5e1';
    });

    inputSrc.classList.add("image-path");
    inputSrc.setAttribute("data-id", data.id);
    inputSrc.placeholder = `Lien de l'image`;
    inputSrc.value = `img/${fileName || 'dossier'}/${fileName || 'dossier'}-${data.index}.png`;

    inputSrc.addEventListener('input', (e) => {
        onUpdate(data.id, { src: (e.target as HTMLInputElement).value });
    });

    inputAlt.placeholder = `Texte alternatif de l'image`;
    inputAlt.value = data.alt;

    inputAlt.addEventListener('input', (e) => {
        onUpdate(data.id, { alt: (e.target as HTMLInputElement).value });
    });

    // Légende de l'image

    inputIndex.setAttribute("readonly", "true");
    inputIndex.value = `Figure ${data.index}. `;

    inputCaption.placeholder = `Légende de l'image`;
    inputCaption.value = data.caption ?? "";

    inputCaption.addEventListener('input', (e) => {
        const newCaption = (e.target as HTMLInputElement).value;
        onUpdate(data.id, { caption: newCaption });
        
        inputAlt.value = newCaption;
        onUpdate(data.id, { alt: newCaption });
    });

    // Largeur de l'image (pixels)

    inputWidth.type = "number";
    inputWidth.placeholder = `Largeur de l'image`;
    inputWidth.value = `${data.width || 800}`;

    inputWidth.addEventListener('input', (e) => {
        onUpdate(data.id, { width: Number((e.target as HTMLInputElement).value) || 800 });
    });

    block.append(inputIndex, inputCaption, inputSrc, inputAlt, inputWidth);
    block.classList.add("image");

    return wrapBlock(block, data);
} 


export function createAdmonitionBlock(data: Blocks.AdmonitionBlock, onUpdate: (id: string, fields: Partial<Blocks.AdmonitionBlock>) => void) {
    const block = document.createElement("div");
    const inputTitle = document.createElement("input");
    const input = document.createElement("div");

    input.contentEditable = "true";
    input.setAttribute("data-placeholder", `Encadré ${data.category}`);
    input.innerHTML = data.content ?? "";

    input.addEventListener('input', (e) => {
        onUpdate(data.id, { content: (e.target as HTMLInputElement).innerHTML });
    });

    inputTitle.placeholder = "Titre";
    inputTitle.value = data.title ?? "";

    inputTitle.addEventListener('input', (e) => {
        onUpdate(data.id, { title: (e.target as HTMLInputElement).value });
    });

    block.append(inputTitle, input);
    block.classList.add("admonition", `${data.category}`);

    return wrapBlock(block, data);
}


export function createCodeBlock(data: Blocks.CodeBlock, onUpdate: (id: string, fields: Partial<Blocks.CodeBlock>) => void) {
    const block = document.createElement("div");

    const inputLanguage = document.createElement("input");
    const inputContent = document.createElement("div");

    inputLanguage.placeholder = `Langage utilisé (optionnel)`;
    inputLanguage.value = data.language ?? "";

    inputLanguage.addEventListener('input', (e) => {
        onUpdate(data.id, { language: (e.target as HTMLInputElement).value });
    });

    inputContent.contentEditable = "true";
    inputContent.setAttribute("data-placeholder", `Écrivez votre code ici...`);
    inputContent.innerHTML = data.content ?? "";

    inputContent.addEventListener('input', (e) => {
        onUpdate(data.id, { content: (e.target as HTMLInputElement).innerHTML });
    });

    block.append(inputLanguage, inputContent);
    block.classList.add("code");

    return wrapBlock(block, data);
}


export function createFormulaBlock(data: Blocks.FormulaBlock, onUpdate: (id: string, fields: Partial<Blocks.FormulaBlock>) => void) {
    const block = document.createElement("div");

    const inputContent = document.createElement("input");
    const inputCaption = document.createElement("input");
    const inputIndex = document.createElement("input");

    inputContent.placeholder = `Écrivez votre formule LaTeX ici...`;
    inputContent.value = data.content ?? "";

    inputContent.addEventListener('input', (e) => {
        onUpdate(data.id, { content: (e.target as HTMLInputElement).value });
    });

    inputIndex.value = `Equation ${data.index}. `;

    inputCaption.placeholder = `Écrivez votre légende ici...`;
    inputCaption.value = data.caption ?? "";

    inputCaption.addEventListener('input', (e) => {
        onUpdate(data.id, { caption: (e.target as HTMLInputElement).value });
    });

    block.append(inputContent, inputIndex, inputCaption);
    block.classList.add("formula");

    return wrapBlock(block, data);
}

const reorder = <T>(list: T[], oldIndex: number, newIndex: number): T[] => {
    const result = Array.from(list);
    const [removed] = result.splice(oldIndex, 1);
    result.splice(newIndex, 0, removed);
    return result;
};

export function createListBlock(
    data: Blocks.ListBlock | Blocks.ListItem, 
    onUpdate: (id: string, updatedData: any) => void
) {
    const container = document.createElement("div");
    const listElement = document.createElement(data.ordered ? "ol" : "ul");
    listElement.setAttribute("data-id", data.id);

    // 2. Génération des items
    data.items.forEach((liData, index) => {
        const liElement = document.createElement("li");
        liElement.setAttribute("data-id", liData.id);

        // Wrapper pour le contenu de la ligne (Texte + Boutons d'action)
        const itemContentWrapper = document.createElement("div");
        itemContentWrapper.classList.add("item-content-wrapper");

        // Champ de saisie de texte (Input pour la simplicité, ou contenteditable)
        const input = document.createElement("div");

        input.contentEditable = "true";
        input.setAttribute("data-placeholder", "Élément de liste");
        input.innerHTML = liData.content ?? "";
        
        // Événement de modification du texte
        input.addEventListener("input", (e) => {
            const liContent = (e.target as HTMLInputElement).innerHTML;
            liData.content = liContent;
            onUpdate(liData.id, { content: liContent }); // On déclenche la mise à jour du state
        });

        // Bouton Supprimer
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Supprimer";

        deleteBtn.addEventListener("click", () => {
            data.items.splice(index, 1);
            deleteBlockById(liData.id);
        });

        // Bouton Ajouter une sous-liste / un sous-élément
        const addSubBtn = document.createElement("button");
        addSubBtn.textContent = "Ajouter";

        addSubBtn.addEventListener("click", () => {
            if (!liData.items) liData.items = [];
            const newItem = { id: crypto.randomUUID(), type: "listitem", content: "", items: [] } as Blocks.ListItem;

            const updatedItems = [...liData.items, newItem];
            liData.items = updatedItems;

            onUpdate(liData.id, { items: updatedItems });
            renderEditor();

            console.log(getBlocks());
        });

        // Assemblage du contenu de l'item
        itemContentWrapper.append(input, addSubBtn, deleteBtn);
        liElement.append(itemContentWrapper);

        // 3. Gestion récursive des sous-listes (Contenues DANS le LI)
        if (liData.items && liData.items.length > 0) {
            const subListBlock = createListBlock(liData, onUpdate);
            subListBlock.setAttribute("data-id", liData.id);
            liElement.append(subListBlock);
        }

        listElement.append(liElement);
    });

    // 4. Bouton pour ajouter un élément au niveau actuel
    const addItemBtn = document.createElement("button");
    addItemBtn.textContent = "+ Ajouter à la liste";
    addItemBtn.style.flexGrow = "1";

    addItemBtn.addEventListener("click", () => {
        const newItem = { id: crypto.randomUUID(), type: "listitem", content: "", items: [] } as Blocks.ListItem;

        const updatedItems = [...data.items, newItem];
        data.items = updatedItems;

        onUpdate(data.id, { items: updatedItems });
        renderEditor();
    });

    // 5. Initialisation de SortableJS avec support du nesting (imbrication)
    Sortable.create(listElement, {
        group: "nested-lists", // Permet de glisser-déposer d'une sous-liste à une autre !
        animation: 150,
        fallbackOnBody: true,
        swapThreshold: 0.65,
        handle: ".item-content-wrapper", // Évite le conflit de drag si on clique sur l'input ou les boutons
        onEnd: (evt) => {
            if (evt.oldIndex === undefined || evt.newIndex === undefined) return;
            
            // 1. Récupérer l'ID de l'item qui vient d'être déplacé
            const itemId = evt.item.getAttribute("data-id");
            if (!itemId) return;

            // 2. Récupérer l'ID du conteneur de destination
            // Si ton conteneur racine n'a pas de data-id, on utilise "root" par défaut
            const targetParentId = evt.to.getAttribute("data-id") || "root";
            const newIndex = evt.newIndex;

            // 3. Cas A : Le déplacement se fait au sein de la même liste
            if (evt.to === evt.from) {
                // Tu peux réutiliser moveBlock ici aussi ! C'est plus simple et unifié :
                moveBlock(itemId, targetParentId, newIndex);
            } 
            // 4. Cas B : Déplacement ENTRE deux listes différentes
            else {
                moveBlock(itemId, targetParentId, newIndex);
            }

            console.log(getBlocks());
            renderEditor();
        }
    });

    container.append(listElement, addItemBtn);
    
    // Si c'est le bloc racine, on le wrap. Sinon on renvoie juste le container
    return (data.type === "list") ? wrapBlock(container, data) : container;
}