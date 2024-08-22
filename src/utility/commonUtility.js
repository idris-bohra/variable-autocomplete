export function removeAllPreceedingCurlyBracesFromTextNode(textContent) {
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const caretPosition = range.startOffset;
  let startIndex = caretPosition - 1;
  while (startIndex >= 0 && textContent[startIndex] === '{') startIndex--;
  const textBefore = textContent.substring(0, startIndex + 1);
  const textAfter = textContent.substring(caretPosition);
  return { textBefore, textAfter }
}

export function getLeftCharacterBesideCaret() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const { startContainer, startOffset } = range;
    if (startContainer.nodeType === Node.TEXT_NODE && startOffset > 0) {
      return startContainer.textContent[startOffset - 1];
    } else if (startOffset === 0 && startContainer.previousSibling) {
      const previousNode = startContainer.previousSibling;
      if (previousNode.nodeType === Node.TEXT_NODE) {
        return previousNode.textContent[previousNode.textContent.length - 1];
      } else if (previousNode.nodeType === Node.ELEMENT_NODE) {
        return previousNode.textContent[previousNode.textContent.length - 1];
      }
    }
  }
  return null;
}

export function getTextAfterLastOpenCurlyBrace() {
  const selection = window.getSelection();
  const currentNode = selection.anchorNode;
  const text = currentNode.textContent;
  const lastOpenBraceIndex = text.lastIndexOf('{');
  if (lastOpenBraceIndex !== -1) return text.slice(lastOpenBraceIndex + 1);
  return null;
}

export function removeOuterCurlyBraces(str) {
  if (str.startsWith('{{') && str.endsWith('}}')) return str.slice(2, -2);
  return str;
}

export function filterSuggestions(searchWord, suggestions) {
  const filteredSuggestions = {};
  if (!searchWord) return suggestions;
  const lowerCaseSearchWord = searchWord?.toLowerCase();
  for (const key in suggestions) {
    if (key?.toLowerCase()?.includes(lowerCaseSearchWord)) {
      filteredSuggestions[key] = suggestions[key];
    }
  }
  if (Object.keys(filteredSuggestions).length === 0) return suggestions;
  return filteredSuggestions;
}

export function createNewHTMLForTooltip(suggestions, variableKey) {
  return (
    `<div class="__tooltip-container__">
      <span>Initial</span> : <span>${suggestions[variableKey].initial}</span>
      <br />
      <span>Current</span> : <span>${suggestions[variableKey].current}</span>
      <br />
      <span>Scope</span> : <span>${suggestions[variableKey].scope}</span>
    </div>`
  )
}

// function checkIfVariableBlockisFormatted() {
//   const selection = window.getSelection();
//   const currentNode = selection.anchorNode;
//   const parentNode = currentNode.parentNode;
//   const variableBlockText = currentNode.textContent;
//   if (!variableBlockText.startsWith('{{') || !variableBlockText.endsWith('}}')) {
//     parentNode.removeAttribute('variable-block');
//     parentNode.setAttribute('text-block', 'true');
//   }
// }

// const handleVariableBlockConditions = (e) => {
//   const selection = window.getSelection();
//   const range = selection.getRangeAt(0);
//   const currentNode = selection.anchorNode;
//   const parentNode = currentNode.parentNode;
//   const editableDivNode = parentNode.parentNode;
//   if (range.endOffset === currentNode.textContent.length && e.nativeEvent.inputType !== 'deleteContentBackward' && e.nativeEvent.inputType !== 'deleteContentForward') {
//     const textElement = createNewTextNode();
//     textElement.innerText = currentNode.textContent[currentNode.textContent.length - 1];
//     currentNode.parentNode.innerText = currentNode.textContent.slice(0, currentNode.textContent.length - 1);
//     editableDivNode.insertBefore(textElement, parentNode.nextSibling);
//     range.setStart(textElement, textElement.textContent.length);
//     range.collapse(false);
//   }
// }