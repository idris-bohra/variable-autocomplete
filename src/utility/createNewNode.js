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