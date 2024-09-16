export function createNewTextNode() {
    const textBlockElement = document.createElement('span');
    textBlockElement.setAttribute('text-block', true);
    return textBlockElement
}

export function createNewVariableNode() {
    const variableBlockElement = document.createElement('span');
    variableBlockElement.setAttribute('variable-block', true);
    return variableBlockElement
}

export const getTextBeforeAndTextAfterNode = () => {
    const selection = window.getSelection();
    const currentOffset = selection.anchorOffset;
    const currentNode = selection.anchorNode.parentNode;
    const textBefore = currentNode.innerText.substring(0, currentOffset);
    const textAfter = currentNode.innerText.substring(currentOffset);
    const textElementBefore = createNewTextNode();
    const textElementAfter = createNewTextNode();
    textElementBefore.innerText = textBefore;
    textElementAfter.innerText = textAfter;
    return { textElementAfter, textElementBefore };
}


export const convertTextToHTML = (str) => {
    if (str == null || typeof str !== 'string' || str.trim() === '') return str;
    str = str.trim();
    if (str.startsWith('<span')) {
        return str;
    }
    const regex = /(\{\{[^\}]+\}\})/g;
    const parts = str.split(regex).filter(part => part !== '');
    return parts.map(part => {
        if (part.startsWith('{{') && part.endsWith('}}')) {
            return `<span variable-block='true'>${part}</span>`;
        } else {
            return `<span text-block='true'>${part}</span>`;
        }
    }).join('');
};