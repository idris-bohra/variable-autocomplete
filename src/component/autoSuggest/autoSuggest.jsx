import React, { useCallback, useEffect, useRef, useState } from 'react';
import { filterSuggestions, getTextAfterLastOpenCurlyBrace, isEncodedWithCurlyBraces, removeAllPreceedingCurlyBracesFromTextNode, removeOuterCurlyBraces, saveCaretPosition, restoreCaretPosition, setDynamicVariables } from '../../utility/commonUtility.js';
import { convertTextToHTML, createNewTextNode, createNewVariableNode, getTextBeforeAndTextAfterNode } from '../../utility/createNewNode.js';
import { getCaretPosition } from '../../utility/getCaretPosition.js';
import SuggestionBox from '../suggestionBox/suggestionBox.jsx';
import Tooltip from '../tooltip/tooltip.jsx';
import { createPortal } from 'react-dom';
import './autoSuggest.css';

export default function AutoSuggest({ suggestions, contentEditableDivRef, initial, handleValueChange, disable, placeholder }) {
    const showVariableValueTimeoutRef = useRef(null);
    const latestSuggestionsRef = useRef(suggestions || {});

    const [caretPosition, setCaretPosition] = useState({ left: 0, right: 0, top: 0, bottom: 0 });
    const [tooltipPosition, setTooltipPosition] = useState({ left: 0, right: 0, top: 0, bottom: 0 });
    const [tooltipVariableDetails, setTooltipVariableDetails] = useState(null);
    const [showTooltip, setShowTooltip] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState(suggestions || {});
    const [searchWord, setSearchWord] = useState(null);
    const [suggestionIndex, setSuggestionIndex] = useState(0);
    const [showPlaceholder, setShowPlaceholder] = useState(true);

    useEffect(() => {
        const editableDiv = contentEditableDivRef?.current;
        if (!editableDiv) return;
        editableDiv.addEventListener('blur', handleEditableDivBlur);
        return () => {
            editableDiv.removeEventListener('blur', handleEditableDivBlur);
        };
    }, [contentEditableDivRef]);

    useEffect(() => {
        latestSuggestionsRef.current = suggestions;
    }, [suggestions]);

    useEffect(() => {
        const editableDiv = contentEditableDivRef?.current;
        if (!editableDiv) return;
        editableDiv.innerHTML = initial;
        removeEmptySpans();
        addEventListenersToVariableSpan();
        checkShowPlaceholder();
    }, [initial]);


    function handleEditableDivBlur() {
        setShowSuggestions(false);
        setShowTooltip(false);
        setSuggestionIndex(0);
    }

    const handleVariableSpanHoverEvent = useCallback((event) => {
        const node = event.target;
        const variableKey = removeOuterCurlyBraces(node.innerText || node.textContent);
        const rect = node.getBoundingClientRect();
        setTooltipVariableDetails(latestSuggestionsRef?.current?.[variableKey]);
        setTooltipPosition(rect);
        showVariableValueTimeoutRef.current = setTimeout(() => {
            setShowTooltip(true);
            setShowSuggestions(false);
            setSuggestionIndex(0);
        }, 500);
    }, []);

    const handleVariableSpanDownEvent = useCallback(() => {
        clearTimeout(showVariableValueTimeoutRef.current);
        setShowTooltip(false);
    }, []);

    const addEventListenersToVariableSpan = useCallback(() => {
        removeAllEventListeners();
        const editableDiv = contentEditableDivRef.current;
        if (!editableDiv) return;
        const variableBlocks = editableDiv.querySelectorAll('span[variable-block="true"]')
        if (variableBlocks.length === 0) return;
        Array.from(variableBlocks)?.forEach((variableBlock) => {
            variableBlock.addEventListener('mouseenter', handleVariableSpanHoverEvent);
            variableBlock.addEventListener('mouseleave', handleVariableSpanDownEvent);
        })
    }, [handleVariableSpanHoverEvent, handleVariableSpanDownEvent]);

    const removeAllEventListeners = useCallback(() => {
        const editableDiv = contentEditableDivRef.current;
        if (!editableDiv) return;
        const allSpan = editableDiv.querySelectorAll('span[text-block="true"]');
        Array.from(allSpan)?.forEach((span) => {
            span.removeEventListener('mouseenter', handleVariableSpanHoverEvent);
        });
    }, [handleVariableSpanHoverEvent, handleVariableSpanDownEvent]);

    function insertSuggestion(suggestionText) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const currentTextNode = selection.anchorNode;
        const spanNode = currentTextNode.parentNode;
        const editableDivNode = spanNode.parentNode;
        const { textBefore, textAfter } = removeAllPreceedingCurlyBracesFromTextNode(currentTextNode.wholeText, searchWord);
        const textElementBefore = createNewTextNode();
        const variableElement = createNewVariableNode();
        const textElementAfter = createNewTextNode();
        variableElement.innerText = `{{${suggestionText}}}`;
        textElementBefore.innerText = textBefore;
        textElementAfter.innerText = textAfter;
        if (textBefore) editableDivNode?.insertBefore(textElementBefore, spanNode)
        editableDivNode?.insertBefore(variableElement, spanNode)
        if (textAfter) editableDivNode?.insertBefore(textElementAfter, spanNode)
        editableDivNode?.removeChild(spanNode);
        range.setStartAfter(variableElement, 0);
        range.setEndAfter(variableElement, variableElement.textContent.length);
        selection.removeAllRanges();
        setShowSuggestions(false);
        setSuggestionIndex(0);
        range.collapse(false);
        selection.addRange(range);
        setTimeout(() => contentEditableDivRef.current.focus());
        addEventListenersToVariableSpan();
        removeEmptySpans();
        checkShowPlaceholder();
        handleValueChange && handleValueChange();
    }

    function createFirstNode(content) {
        const selection = window.getSelection();
        const range = document.createRange();
        const textElement = createNewTextNode();
        textElement.innerText = content;
        contentEditableDivRef.current.innerText = '';
        contentEditableDivRef.current.appendChild(textElement);
        range.setStart(textElement, textElement.textContent.length);
        selection.removeAllRanges();
        range.collapse(false);
        selection.addRange(range);
        checkShowPlaceholder();
        handleValueChange && handleValueChange();
        addEventListenersToVariableSpan();
    }

    const handleContentChange = (event) => {
        const prevCaretPosition = saveCaretPosition(contentEditableDivRef.current);
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const currentNode = selection.anchorNode;
        const parentNode = currentNode.parentNode;
        const editableDivNode = parentNode.parentNode;
        const content = event.target.innerText;
        if (content.length === 0) {
            setShowSuggestions(false);
            setShowTooltip(false);
            return;
        }
        if (content.length === 1 && content != '\n') return createFirstNode(content);
        if (currentNode.parentNode.getAttribute('text-block')) getSearchWord();
        if (parentNode.getAttribute('variable-block')) {
            if (isEncodedWithCurlyBraces(currentNode?.textContent?.slice(0, -1))) {
                const textElement = createNewTextNode();
                const variableElement = createNewVariableNode();
                textElement.innerText = currentNode.textContent[currentNode.textContent.length - 1];
                variableElement.innerText = currentNode.textContent.slice(0, -1);
                editableDivNode?.insertBefore(variableElement, parentNode);
                editableDivNode?.insertBefore(textElement, parentNode);
                editableDivNode?.removeChild(parentNode)
                range.setStart(textElement, textElement.textContent.length);
                selection.removeAllRanges();
                range.collapse(false);
                selection.addRange(range);
            }
            else if (isEncodedWithCurlyBraces(currentNode?.textContent?.slice(1))) {
                const textElement = createNewTextNode();
                const variableElement = createNewVariableNode();
                textElement.innerText = currentNode.textContent[0];
                variableElement.innerText = currentNode.textContent.slice(1);
                editableDivNode?.insertBefore(textElement, parentNode);
                editableDivNode?.insertBefore(variableElement, parentNode);
                editableDivNode?.removeChild(parentNode)
                range.setStart(textElement, textElement.textContent.length);
                selection.removeAllRanges();
                range.collapse(true);
                selection.addRange(range);
            }
        }
        let currentText = '';
        Array.from(editableDivNode?.childNodes)?.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.getAttribute('text-block')) return;
                if (!isEncodedWithCurlyBraces(node?.textContent)) {
                    node.setAttribute('text-block', true);
                    node.removeAttribute('variable-block');
                    currentText = node?.textContent;
                }
            }
            removeAllEventListeners();
        });
        if (currentText != '') {
            setDiffVariableBlock(currentText);
        }
        mergeTextBlockSpans();
        setDynamicVariables(contentEditableDivRef);
        restoreCaretPosition(contentEditableDivRef.current, prevCaretPosition);
        addEventListenersToVariableSpan();
        removeEmptySpans();
        checkShowPlaceholder();
        handleValueChange && handleValueChange();
    };

    const setDiffVariableBlock = () => {
        const selection = window.getSelection();
        const currentNode = selection.anchorNode.parentNode;
        const newHTML = convertTextToHTML(currentNode.innerText);
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = newHTML;
        const parentNode = currentNode.parentNode;
        Array.from(tempContainer.childNodes).forEach((newNode) => {
            parentNode.insertBefore(newNode, currentNode);
        });
        parentNode.removeChild(currentNode);
    };

    const mergeTextBlockSpans = () => {
        const editableDivNodeRef = contentEditableDivRef.current;
        const spans = Array.from(editableDivNodeRef.querySelectorAll('span'));
        let newSpans = [];
        let i = 0;
        while (i < spans.length) {
            let currentSpan = spans[i];
            if (currentSpan.attributes[0]?.name === 'text-block' && currentSpan.getAttribute('text-block')) {
                let mergedContent = currentSpan.textContent;
                i++;
                while (i < spans.length && spans[i].attributes[0]?.name === 'text-block' && spans[i].getAttribute('text-block')) {
                    mergedContent += spans[i].textContent;
                    i++;
                }
                let newMergedSpan = document.createElement('span');
                newMergedSpan.setAttribute('text-block', true);
                newMergedSpan.textContent = mergedContent;
                newSpans.push(newMergedSpan);
            } else {
                newSpans.push(currentSpan);
                i++;
            }
        }
        editableDivNodeRef.innerHTML = '';
        newSpans.forEach((span) => {
            editableDivNodeRef.appendChild(span);
        });
    };

    const removeEmptySpans = () => {
        const allSpan = contentEditableDivRef.current.querySelectorAll('span');
        Array.from(allSpan)?.forEach((span) => {
            if (span.querySelector('br')) {
                const brTag = span.querySelector('br');
                if (brTag?.parentNode === span && span.parentNode === contentEditableDivRef.current) {
                    contentEditableDivRef?.current?.removeChild(span);
                }
            }
            if (span.innerText.length === 0 && span.parentNode === contentEditableDivRef.current) {
                contentEditableDivRef?.current?.removeChild(span);
            }
        })
    }

    function getSearchWord() {
        const searchWord = getTextAfterLastOpenCurlyBrace();
        if (searchWord) {
            setShowTooltip(false);
            setSearchWord(searchWord);
            const caretPosition = getCaretPosition();
            setCaretPosition(caretPosition);
            setShowSuggestions(true);
        }
        else {
            setSearchWord(null);
            setShowSuggestions(false);
        }
        const filteredSuggestions = filterSuggestions(searchWord, suggestions) || {};
        setSuggestionIndex(0);
        if (Object.keys(filteredSuggestions || {})?.length === 0) setShowSuggestions(false);
        setFilteredSuggestions(filteredSuggestions || {});
    }

    function arrowUpPress(event) {
        event.preventDefault();
        if (suggestionIndex === 0) return setSuggestionIndex(Object.keys(filteredSuggestions).length - 1);
        setSuggestionIndex((prev) => prev - 1);
    }

    function arrowDownPress(event) {
        event.preventDefault();
        if (suggestionIndex === Object.keys(filteredSuggestions).length - 1) return setSuggestionIndex(0);
        setSuggestionIndex((prev) => prev + 1);
    }

    function enterPress(event) {
        event.preventDefault();
        if (suggestionIndex > -1 && showSuggestions) {
            insertSuggestion(Object.keys(filteredSuggestions)[suggestionIndex])
        }
    }

    const handleKeyDown = (event) => {
        if (event.key === 'ArrowUp') arrowUpPress(event);
        if (event.key === 'ArrowDown') arrowDownPress(event);
        if (event.key === 'Enter') enterPress(event);
    }

    const handleKeyUp = (event) => {
        const selection = window.getSelection();
        const currentNode = selection.anchorNode;
        const parentNode = currentNode.parentNode;

        if (event.key === '{' && currentNode.parentNode.getAttribute('text-block')) {
            const caretPosition = getCaretPosition();
            setCaretPosition(caretPosition);
            setShowTooltip(false);
            setShowSuggestions(true);
            setFilteredSuggestions(suggestions);
        }

        if (!event.key.match(/^[\x20-\x7E]$/) && parentNode.getAttribute('variable-block')) {
            event.preventDefault();
        }
    }

    const handlePaste = (event) => {
        event.preventDefault();
        const selection = window.getSelection();
        const savedCaretPos = saveCaretPosition(contentEditableDivRef.current);
        const currentNode = selection?.anchorNode?.parentNode;
        if (!currentNode) return;
        if (!contentEditableDivRef.current) return;
        let text = (event.clipboardData || window.clipboardData).getData('text');
        if (!text || text.length === 0) return;
        if (!selection.anchorNode?.parentNode?.getAttribute) return;
        let html = convertTextToHTML(text);
        if (!contentEditableDivRef.current.innerHTML || contentEditableDivRef.current.innerHTML.trim() === '') {
            contentEditableDivRef.current.innerHTML = html;
            checkShowPlaceholder();
            addEventListenersToVariableSpan();
            handleValueChange && handleValueChange();
            return;
        }
        const createDiv = document.createElement('div');
        createDiv.innerHTML = html;
        const isVariableBlock = createDiv.querySelectorAll(`span[variable-block='true']`);
        const spans = createDiv.querySelectorAll('span');
        const { textElementAfter, textElementBefore } = getTextBeforeAndTextAfterNode();

        if (!selection.anchorNode.parentNode.getAttribute('variable-block')) {
            if (Array.from(isVariableBlock).length === 0) {
                document.execCommand('insertText', false, text);
            } else {
                if (contentEditableDivRef.current.contains(currentNode)) {
                    contentEditableDivRef.current.insertBefore(textElementBefore, currentNode);
                    Array.from(spans).forEach((span) => {
                        contentEditableDivRef.current.insertBefore(span, currentNode);
                    });
                    contentEditableDivRef.current.insertBefore(textElementAfter, currentNode);
                    contentEditableDivRef.current.removeChild(currentNode);
                }
            }
        } else if (selection.anchorNode.parentNode.getAttribute('variable-block') && selection.anchorOffset > 1 && selection.anchorOffset < selection.anchorNode.parentNode.innerText.length - 1) {
            document.execCommand('insertText', false, text);
        } else if (selection.anchorNode.parentNode.getAttribute('variable-block') && (selection.anchorOffset === 1 || selection.anchorOffset >= selection.anchorNode.parentNode.innerText.length - 1)) {
            if (selection.anchorOffset === 0) {
                Array.from(spans).forEach((span) => {
                    contentEditableDivRef.current.insertBefore(span, selection.anchorNode.parentNode.nextSibling);
                });
            } else if (selection.anchorOffset > selection.anchorNode.parentNode.innerText.length - 1) {
                Array.from(spans).forEach((span) => {
                    contentEditableDivRef.current.insertBefore(span, selection.anchorNode.parentNode.nextSibling || null);
                });
            } else {
                contentEditableDivRef.current.insertBefore(textElementBefore, currentNode);
                Array.from(spans).forEach((span) => {
                    contentEditableDivRef.current.insertBefore(span, currentNode);
                });
                contentEditableDivRef.current.insertBefore(textElementAfter, currentNode);
                contentEditableDivRef.current.removeChild(currentNode);
            }
        }
        removeEmptySpans();
        addEventListenersToVariableSpan();
        restoreCaretPosition(contentEditableDivRef.current, savedCaretPos);
        checkShowPlaceholder();
        handleValueChange && handleValueChange();
    };

    function checkShowPlaceholder() {
        if (contentEditableDivRef?.current?.innerText?.length === 0) return setShowPlaceholder(true);
        if (contentEditableDivRef?.current?.innerText?.length != 0 && showPlaceholder === true) return setShowPlaceholder(false);
    }

    return (
        <React.Fragment>
            <div className="parent-div">
                <div className={`main__div ${disable ? 'disable-div' : ''}`}>
                    {showPlaceholder && !disable ? <div className='placeholder-editable-div'>
                        <span className='placeholder-text'>{placeholder}</span>
                    </div> : null}
                    <div className='auto-suggest'>
                        <div
                            ref={contentEditableDivRef} className={`__custom-autosuggest-block__`}
                            onKeyDown={handleKeyDown}
                            onKeyUp={handleKeyUp}
                            contentEditable={disable === true ? false : true}
                            onInput={handleContentChange}
                            onPaste={handlePaste}
                        >
                        </div>
                    </div>
                </div>
            </div>
            {showSuggestions && createPortal(<SuggestionBox setSuggestionIndex={setSuggestionIndex} suggestionIndex={suggestionIndex} filteredSuggestions={filteredSuggestions} caretPosition={caretPosition} insertSuggestion={insertSuggestion} />, document.getElementById('root'))}
            {showTooltip && createPortal(<Tooltip suggestions={suggestions} tooltipPosition={tooltipPosition} tooltipVariableDetails={tooltipVariableDetails} />, document.getElementById('root'))}
        </React.Fragment>
    )
}