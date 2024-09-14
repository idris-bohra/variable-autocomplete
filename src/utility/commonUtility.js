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

export function saveCaretPosition (contentEditableDivRef) {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(contentEditableDivRef);
  preCaretRange.setEnd(range.endContainer, range.endOffset);

  return preCaretRange?.toString()?.length;
};

export function restoreCaretPosition (contentEditableDivRef , savedPosition) {
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