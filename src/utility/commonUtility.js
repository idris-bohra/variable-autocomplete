export function removeAllPreceedingCurlyBracesFromTextNode(textContent, searchWord) {
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  let textFromRemovedSearchedWord = textContent
  if (searchWord !== null) {
    textFromRemovedSearchedWord = textContent.slice(0, range.startOffset - searchWord?.length) + textContent.slice(range.startOffset)
  }
  const splitedStr = textContent.slice(0, range.startOffset);
  const lastIndexOfBrace = splitedStr.lastIndexOf("{");
  let startIndex = splitedStr.lastIndexOf("{");
  while (startIndex >= 0 && textFromRemovedSearchedWord[startIndex] === '{') startIndex--;
  const textBefore = textFromRemovedSearchedWord.substring(0, startIndex + 1);
  const textAfter = textFromRemovedSearchedWord.substring(lastIndexOfBrace + 1);
  return { textBefore, textAfter }
}

export function saveCaretPosition(contentEditableDivRef) {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(contentEditableDivRef);
  preCaretRange.setEnd(range.endContainer, range.endOffset);

  return preCaretRange?.toString()?.length;
};

export function restoreCaretPosition(contentEditableDivRef, savedPosition) {
  const selection = window.getSelection();
  const range = document.createRange();
  let charCount = 0;
  const traverseNodes = (node) => {
    if (node?.nodeType === Node.TEXT_NODE) {
      const nextCharCount = charCount + node?.length;
      if (savedPosition <= nextCharCount) {
        range.setStart(node, savedPosition - charCount);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        return true;
      }
      charCount = nextCharCount;
    } else {
      for (let i = 0; i < node?.childNodes?.length; i++) {
        if (traverseNodes(node?.childNodes[i])) {
          return true;
        }
      }
    }
    return false;
  };
  traverseNodes(contentEditableDivRef);
};

export function getLeftCharacterBesideCaret() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const { startContainer, startOffset } = range;
    if (startContainer?.nodeType === Node.TEXT_NODE && startOffset > 0) {
      return startContainer.textContent[startOffset - 1];
    } else if (startOffset === 0 && startContainer.previousSibling) {
      const previousNode = startContainer.previousSibling;
      if (previousNode?.nodeType === Node.TEXT_NODE) {
        return previousNode.textContent[previousNode.textContent.length - 1];
      } else if (previousNode?.nodeType === Node.ELEMENT_NODE) {
        return previousNode.textContent[previousNode.textContent.length - 1];
      }
    }
  }
  return null;
}

export function getTextAfterLastOpenCurlyBrace() {
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const currentNode = selection.anchorNode;
  const splitedStr = currentNode.wholeText?.slice(0, range.startOffset);
  const lastOpenBraceIndex = splitedStr?.lastIndexOf("{");
  const text = currentNode.textContent?.slice(lastOpenBraceIndex + 1, range.startOffset);
  if (lastOpenBraceIndex !== -1) return text
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
  if (Object.keys(filteredSuggestions).length === 0) return {};
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

export function isEncodedWithCurlyBraces(str) {
  const regex = /^\{\{.*\}\}$/;
  return regex.test(str);
}

export function extractInnerTextFromHTML(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  return doc.body.innerText.trim();
}

export const setDynamicVariables = (contentEditableDivRef) => {
  let resultHtmlString = '';
  let dynamicVariables = [];
  
  Array.from(contentEditableDivRef.current?.childNodes)?.forEach((node) => {
    resultHtmlString += node.outerHTML;
    if (node.nodeType === Node.ELEMENT_NODE && node.getAttribute('text-block')) {
      let nodeHTML = node.outerHTML;
      let reversedHTML = nodeHTML.split('').reverse().join('');
      let reverseOpenIndex = reversedHTML.lastIndexOf('{{');
      let reverseCloseIndex = reversedHTML.indexOf('}}');
      if (reverseOpenIndex !== -1) {
        let openIndex = resultHtmlString.length - reverseOpenIndex;
        dynamicVariables.push({
          type: 'open',
          index: openIndex,
        });
      }
      if (reverseCloseIndex !== -1) {
        let closeIndex = resultHtmlString.length - reverseCloseIndex;
        dynamicVariables.push({
          type: 'close',
          index: closeIndex,
        });
      }
    }
  });

  dynamicVariables.sort((a, b) => a.index - b.index);
  let startIndex = 0;
  let endIndex = dynamicVariables.length - 1;
  let openIndex, closeIndex;

  while (startIndex <= endIndex) {
    const openTag = dynamicVariables[startIndex];
    const closeTag = dynamicVariables[endIndex];

    if (openTag.type === 'open' && closeTag.type === 'close') {
      openIndex = openTag.index;
      closeIndex = closeTag.index;
      break;
    }

    if (openTag.type !== 'open') {
      startIndex++;
    }

    if (closeTag.type !== 'close') {
      endIndex--;
    }
  }

  if (openIndex > 0 && closeIndex > 0) {
    openIndex = openIndex - 2;
    let extractedString = resultHtmlString.substring(openIndex, closeIndex);
    extractedString = `<span text-block='true'>${extractedString}</span>`;

    let innerText = extractInnerTextFromHTML(extractedString);
    innerText = `</span><span id='dynamic' variable-block='true'>${innerText}</span><span text-block='true'>`;

    resultHtmlString = resultHtmlString.substring(0, openIndex) + innerText + resultHtmlString.substring(closeIndex);
    contentEditableDivRef.current.innerHTML = resultHtmlString;

    const dynamicSpan = contentEditableDivRef.current.querySelector('#dynamic');
    const selection = window.getSelection();
    const range = document.createRange();

    range.setStartAfter(dynamicSpan);
    range.setEndAfter(dynamicSpan);
    range.collapse(false);

    selection.removeAllRanges();
    selection.addRange(range);
    dynamicSpan.removeAttribute('id');
  }
};