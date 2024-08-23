import React, { useCallback, useEffect, useRef, useState } from 'react';
import { filterSuggestions, getLeftCharacterBesideCaret, getTextAfterLastOpenCurlyBrace, isEncodedWithCurlyBraces, removeAllPreceedingCurlyBracesFromTextNode, removeOuterCurlyBraces } from '../../utility/commonUtility.js';
import { createNewTextNode, createNewVariableNode } from '../../utility/createNewNode.js';
import { getCaretPosition } from '../../utility/getCaretPosition.js';
import SuggestionBox from '../suggestionBox/suggestionBox.jsx';
import Tooltip from '../tooltip/tooltip.jsx';
import './autoSuggest.css';

export default function AutoSuggest({ suggestions, contentEditableDivRef }) {

    const showVariableValueTimeoutRef = useRef(null);

    const [caretPosition, setCaretPosition] = useState({ left: 0, right: 0, top: 0, bottom: 0 });
    const [tooltipPosition, setTooltipPosition] = useState({ left: 0, right: 0, top: 0, bottom: 0 });
    const [tooltipVariableDetails, setTooltipVariableDetails] = useState(null);
    const [showTooltip, setShowTooltip] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState(suggestions);
    const [searchWord, setSearchWord] = useState(null);
    const [suggestionIndex, setSuggestionIndex] = useState(0);

    useEffect(() => {
        if (!contentEditableDivRef?.current) return;
        const editableDiv = contentEditableDivRef.current;
        if (editableDiv) {
            editableDiv.addEventListener('blur', handleEditableDivBlur);
        }
        return () => {
            if (editableDiv) {
                editableDiv.removeEventListener('blur', handleEditableDivBlur);
            }
        };
    }, [contentEditableDivRef]);

    useEffect(() => {
        if (contentEditableDivRef?.current) {
            setTimeout(() => {
                addEventListenersToVariableSpan();
            }, 100);
        }
    }, [contentEditableDivRef?.current?.innerHTML]);

    const handleEditableDivBlur = () => {
        setShowSuggestions(false);
        setShowTooltip(false);
        setSuggestionIndex(0);
    }

    const handleVariableSpanHoverEvent = useCallback((event) => {
        const node = event.target;
        const variableKey = removeOuterCurlyBraces(node.innerText || node.textContent);
        const rect = node.getBoundingClientRect();
        setTooltipVariableDetails(suggestions[variableKey]);
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
        const variableBlocks = document.querySelectorAll('span[variable-block="true"]')
        if (variableBlocks.length === 0) return;
        Array.from(variableBlocks).forEach((variableBlock) => {
            variableBlock.addEventListener('mouseenter', handleVariableSpanHoverEvent);
            variableBlock.addEventListener('mouseleave', handleVariableSpanDownEvent);
        })
    }, [handleVariableSpanHoverEvent, handleVariableSpanDownEvent]);

    const removeAllEventListeners = useCallback(() => {
        const allSpan = document.querySelectorAll('span[text-block="true"]');
        Array.from(allSpan).forEach((span) => {
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
        if (textBefore) editableDivNode.insertBefore(textElementBefore, spanNode)
        editableDivNode.insertBefore(variableElement, spanNode)
        if (textAfter) editableDivNode.insertBefore(textElementAfter, spanNode)
        editableDivNode.removeChild(spanNode);
        range.setStartAfter(variableElement, 0);
        range.setEndAfter(variableElement, variableElement.textContent.length);
        selection.removeAllRanges();
        setShowSuggestions(false);
        setSuggestionIndex(0);
        range.collapse(false);
        selection.addRange(range);
        setTimeout(() => contentEditableDivRef.current.focus());
        addEventListenersToVariableSpan();
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
    }

    const handleContentChange = (event) => {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const currentNode = selection.anchorNode;
        const parentNode = currentNode.parentNode;
        const editableDivNode = parentNode.parentNode;
        const content = event.target.innerText;
        if (content.length === 0) return;
        if (content.length === 1) return createFirstNode(content);
        if (currentNode.parentNode.getAttribute('text-block')) getSearchWord();
        if (parentNode.getAttribute('variable-block')) {
            if (isEncodedWithCurlyBraces(currentNode.textContent.slice(0, -1))) {
                const textElement = createNewTextNode();
                const variableElement = createNewVariableNode();
                textElement.innerText = currentNode.textContent[currentNode.textContent.length - 1];
                variableElement.innerText = currentNode.textContent.slice(0, -1);
                editableDivNode.insertBefore(variableElement, parentNode);
                editableDivNode.insertBefore(textElement, parentNode);
                editableDivNode.removeChild(parentNode)
                range.setStart(textElement, textElement.textContent.length);
                selection.removeAllRanges();
                range.collapse(false);
                selection.addRange(range);
            }
            else if (isEncodedWithCurlyBraces(currentNode.textContent.slice(1))) {
                const textElement = createNewTextNode();
                const variableElement = createNewVariableNode();
                textElement.innerText = currentNode.textContent[0];
                variableElement.innerText = currentNode.textContent.slice(1);
                editableDivNode.insertBefore(textElement, parentNode);
                editableDivNode.insertBefore(variableElement, parentNode);
                editableDivNode.removeChild(parentNode)
                range.setStart(textElement, textElement.textContent.length);
                selection.removeAllRanges();
                range.collapse(true);
                selection.addRange(range);
            }
        }
        Array.from(editableDivNode.childNodes).forEach((span) => {
            if (isEncodedWithCurlyBraces(span.textContent)) return;
            span.setAttribute('text-block', true);
            span.removeAttribute('variable-block');
            removeAllEventListeners();
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
        const filteredSuggestions = filterSuggestions(searchWord, suggestions);
        setSuggestionIndex(0);
        if (Object.keys(filteredSuggestions).length === 0) setShowSuggestions(false);
        setFilteredSuggestions(filteredSuggestions);
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

        if ((getLeftCharacterBesideCaret() === '{' || event.key === '{') && currentNode.parentNode.getAttribute('text-block')) {
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

    return (
        <React.Fragment>
            <div className='main__div'>
                <div className='__div__init'>
                    <div className='__div__init'>
                        <div className='auto-suggest'>
                            <div ref={contentEditableDivRef} id="__custom-autosuggest-block__" onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} contentEditable={true} onInput={handleContentChange}></div>
                        </div>
                    </div>
                </div>
            </div>
            {showSuggestions && <SuggestionBox setSuggestionIndex={setSuggestionIndex} suggestionIndex={suggestionIndex} filteredSuggestions={filteredSuggestions} caretPosition={caretPosition} insertSuggestion={insertSuggestion} />}
            {showTooltip && <Tooltip tooltipPosition={tooltipPosition} tooltipVariableDetails={tooltipVariableDetails} />}
        </React.Fragment>
    )
}