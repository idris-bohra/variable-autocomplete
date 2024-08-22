import React, { useCallback, useEffect, useRef, useState } from 'react';
import { filterSuggestions, getLeftCharacterBesideCaret, getTextAfterLastOpenCurlyBrace, removeAllPreceedingCurlyBracesFromTextNode, removeOuterCurlyBraces } from '../../utility/commonUtility.js';
import { createNewTextNode, createNewVariableNode } from '../../utility/createNewNode.js';
import { getCaretPosition } from '../../utility/getCaretPosition.js';
import SuggestionBox from '../suggestionBox/suggestionBox.jsx';
import Tooltip from '../tooltip/tooltip.jsx';
import './autoSuggest.css';

export default function AutoSuggest({ suggestions }) {

    const contentEditableDivRef = useRef();

    const [caretPosition, setCaretPosition] = useState({ left: 0, right: 0, top: 0, bottom: 0 });
    const [tooltipPosition, setTooltipPosition] = useState({ left: 0, right: 0, top: 0, bottom: 0 });
    const [tooltipVariableDetails, setTooltipVariableDetails] = useState(null);
    const [showTooltip, setShowTooltip] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState(suggestions);
    const [searchWord, setSearchWord] = useState(suggestions);

    useEffect(() => {
        const handleEditableDivBlur = () => {
            setShowSuggestions(false);
            setShowTooltip(false);
        }
        const editableDiv = contentEditableDivRef.current;
        if (editableDiv) editableDiv.addEventListener('blur', handleEditableDivBlur);
        addEventListenersToVariableSpan();
        return () => {
            removeAllEventListeners();
            if (editableDiv) editableDiv.removeEventListener('blur', handleEditableDivBlur);
        };
    }, []);

    const handleVariableSpanHoverEvent = useCallback((event) => {
        const node = event.target;
        const variableKey = removeOuterCurlyBraces(node.innerText || node.textContent);
        const rect = node.getBoundingClientRect();
        setTooltipVariableDetails(suggestions[variableKey]);
        setTooltipPosition(rect);
        setShowTooltip(true);
    }, []);

    const handleVariableSpanDownEvent = useCallback(() => {
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

    function insertSuggestion(event) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const currentTextNode = selection.anchorNode;
        const spanNode = currentTextNode.parentNode;
        const editableDivNode = spanNode.parentNode;
        const { textBefore, textAfter } = removeAllPreceedingCurlyBracesFromTextNode(currentTextNode.wholeText, searchWord);
        const textElementBefore = createNewTextNode();
        const variableElement = createNewVariableNode();
        const textElementAfter = createNewTextNode();
        variableElement.innerText = `{{${event.target.innerText}}}`;
        textElementBefore.innerText = textBefore;
        textElementAfter.innerText = textAfter;
        if (textBefore) editableDivNode.insertBefore(textElementBefore, spanNode)
        editableDivNode.insertBefore(variableElement, spanNode)
        if (textAfter) editableDivNode.insertBefore(textElementAfter, spanNode)
        editableDivNode.removeChild(spanNode);
        range.setStart(variableElement.firstChild, variableElement.firstChild.length);
        selection.removeAllRanges();
        range.collapse(false);
        selection.addRange(range);
        setShowSuggestions(false);
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
        const currentNode = selection.anchorNode;
        const content = event.target.innerText;
        if (content.length === 1) return createFirstNode(content);
        if (currentNode.parentNode.getAttribute('text-block')) {
            const searchWord = getTextAfterLastOpenCurlyBrace();
            if (searchWord) {
                setShowSuggestions(true);
                setShowTooltip(false);
                setSearchWord(searchWord);
            }
            const filteredSuggestions = filterSuggestions(searchWord, suggestions);
            setFilteredSuggestions(filteredSuggestions);
        }
    }

    const handleKeyDown = (event) => {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const currentNode = selection.anchorNode;
        const parentNode = currentNode.parentNode;

        if ((event.key === '{' && currentNode.parentNode.getAttribute('text-block')) || (getLeftCharacterBesideCaret() === '{' && currentNode.parentNode.getAttribute('text-block'))) {
            const caretPosition = getCaretPosition();
            setCaretPosition(caretPosition);
            setShowSuggestions(true);
            setShowTooltip(false);
        }
        else {
            setShowSuggestions(false)
        }

        if ((event.key === "Backspace" || event.key === "Delete") && parentNode.getAttribute('variable-block')) {
            switch (range.startOffset) {
                case 1:
                case 2:
                case currentNode.wholeText.length - 1:
                case currentNode.wholeText.length:
                    parentNode.removeAttribute('variable-block');
                    parentNode.setAttribute('text-block', 'true');
                    removeAllEventListeners();
            }
        }

        if ((event.key === '{' && currentNode.parentNode.getAttribute('text-block')) || (getLeftCharacterBesideCaret() === '{' && currentNode.parentNode.getAttribute('text-block'))) {
            const caretPosition = getCaretPosition();
            setCaretPosition(caretPosition);
            setShowSuggestions(true);
            setShowTooltip(false);
        }
    }

    const handleKeyUp = (event) => {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const currentNode = selection.anchorNode;
        const parentNode = currentNode.parentNode;

        if ((event.key === '{' && currentNode.parentNode.getAttribute('text-block')) || (getLeftCharacterBesideCaret() === '{' && currentNode.parentNode.getAttribute('text-block'))) {
            const caretPosition = getCaretPosition();
            setCaretPosition(caretPosition);
            setShowSuggestions(true);
            setShowTooltip(false);
        }

        if (event.key.match(/^[\x20-\x7E]$/) && range.startOffset === currentNode.textContent.length && parentNode.getAttribute('variable-block')) {
            const textElement = createNewTextNode();
            textElement.innerText = event.key;
            currentNode.parentNode.innerText = currentNode.textContent.slice(0, currentNode.textContent.length - 1);
            parentNode.parentNode.insertBefore(textElement, parentNode.nextSibling);
            range.setStart(textElement, textElement.textContent.length);
            range.collapse(false);
        }

        if ((event.key === "Backspace" || event.key === "Delete") && parentNode.getAttribute('variable-block')) {
            const variableBlockText = currentNode.textContent;
            if (!variableBlockText.startsWith('{{') || !variableBlockText.endsWith('}}')) {
                parentNode.removeAttribute('variable-block');
                parentNode.setAttribute('text-block', 'true');
                removeAllEventListeners();
            }
        }
    }

    return (
        <React.Fragment>
            <div className='main__div'>
                <div className='__div__init'>
                    <div className='__div__init'>
                        <div className='auto-suggest'>
                            <div
                                ref={contentEditableDivRef}
                                id="__custom-autosuggest-block__"
                                onKeyDown={handleKeyDown}
                                onKeyUp={handleKeyUp}
                                contentEditable={true}
                                onInput={handleContentChange}>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {showSuggestions && <SuggestionBox filteredSuggestions={filteredSuggestions} caretPosition={caretPosition} insertSuggestion={insertSuggestion} />}
            {/* {showTooltip && <Tooltip tooltipPosition={tooltipPosition} tooltipVariableDetails={tooltipVariableDetails} />} */}
        </React.Fragment>
    )
}