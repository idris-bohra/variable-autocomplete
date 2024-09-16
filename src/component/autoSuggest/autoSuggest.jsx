import React, { useCallback, useEffect, useRef, useState } from 'react';
import { filterSuggestions, getTextAfterLastOpenCurlyBrace, isEncodedWithCurlyBraces, removeAllPreceedingCurlyBracesFromTextNode, removeOuterCurlyBraces, saveCaretPosition, restoreCaretPosition, setDynamicVariables } from '../../utility/commonUtility.js';
import { createNewTextNode, createNewVariableNode } from '../../utility/createNewNode.js';
import { getCaretPosition } from '../../utility/getCaretPosition.js';
import SuggestionBox from '../suggestionBox/suggestionBox.jsx';
import Tooltip from '../tooltip/tooltip.jsx';
import { createPortal } from 'react-dom';
import './autoSuggest.css';

export default function AutoSuggest({ suggestions, contentEditableDivRef, initial, handleValueChange, disable }) {
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
        Array.from(editableDivNode?.childNodes)?.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                if (!isEncodedWithCurlyBraces(node?.textContent)) {
                    node.setAttribute('text-block', true);
                    node.removeAttribute('variable-block');
                }
            }
            removeAllEventListeners();
        });
        mergeTextBlockSpans();
        setDynamicVariables(contentEditableDivRef);
        restoreCaretPosition(contentEditableDivRef.current , prevCaretPosition);
        addEventListenersToVariableSpan();
        removeEmptySpans();
        handleValueChange && handleValueChange();
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

    const convertTextToHTML = (str) => {
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

    const fixSpanTags = (html) => {
        if (!html || html?.length === 0) return '';

        if (html === '</span>' || html === '<span text-block="true">' || html === `<span text-block='true'>`) return '';

        if (html.startsWith('</span>')) {
            html = html?.slice(7);
        }
        else if (html.startsWith("<span text-block='true'>") || html.startsWith('<span text-block="true">')) {
            html = html?.slice(24);
        }
        else if ((!html.startsWith(`<span text-block='true'>`) || !html.startsWith(`<span text-block="true">`)) && (!html.startsWith(`<span variable-block='true'>`) || !html.startsWith(`<span variable-block="true">`))) {
            html = `<span text-block='true'>` + html;
        }

        if (html.endsWith("<span text-block='true'>") || html.endsWith('<span text-block="true">')) {
            html = html?.slice(0, -24);
        } else if (html.endsWith("<span variable-block='true'>") || html.endsWith('<span variable-block="true">')) {
            html = html?.slice(0, -29);
        }
        else if (!html.endsWith('</span>')) {
            html = html + '</span>';
        }

        return html;
    }

    const solve = (originalHtml,caretPos,html) => {
        let originalPos;
        let currentCount = 0;
        let chars = '';
        let isSpan = false;
        for(let i=0;i<originalHtml.length;i++){
            if(originalHtml[i] === '<'){
                isSpan = true;
                continue;
            }
            else if(originalHtml[i] === '>'){
                isSpan = false;
                continue;
            }
            if(!isSpan){
                chars += originalHtml[i];
                currentCount++;
            }
            if(currentCount === caretPos){
                originalPos = i;
                break;
            }
        }
        console.log(originalHtml.substring(0,originalPos+1));
        console.log(html);
        console.log(originalHtml.substring(originalPos+1));
        /* let newHTML = '';
        let after = '';
        if(originalHtml.substring(originalPos+1).startsWith('{{')){
            after = `<span variable-block="true">${originalHtml.substring(originalPos+1)}`
        }
        else{
            after = `<span text-block="true">${originalHtml.substring(originalPos+1)}`
        }
        newHTML = `${originalHtml.substring(0,originalPos+1)}</span>` + html + after;
        return newHTML; */
    }
    const handlePaste = (event) => {
        event.preventDefault();
        removeEmptySpans();
        let text = (event.clipboardData || window.clipboardData).getData('text');
        const html = convertTextToHTML(text);
        let originalHtml = contentEditableDivRef.current.innerHTML;
        let caretPos = saveCaretPosition(contentEditableDivRef.current);
        console.log(caretPos);
        solve(originalHtml,caretPos,html);
        /* contentEditableDivRef.current.innerHTML = newHTML; */
        /* if(contentEditableDivRef.current.innerHTML === "<br>" || contentEditableDivRef.current.innerHTML.length === 0 || contentEditableDivRef.current.innerText === 0){
           text = `<span text-block="true">${text}</span>`
           contentEditableDivRef.current.innerHTML = text;
           setDynamicVariables(contentEditableDivRef);
           removeEmptySpans();
           addEventListenersToVariableSpan();
           return;
        }
        document.execCommand('insertText', false, text);
        setDynamicVariables(contentEditableDivRef);
        removeEmptySpans();
        addEventListenersToVariableSpan(); */
    };


    return (
        <React.Fragment>
            <div className={`main__div ${disable && 'disable-div'}`}>
                <div className='auto-suggest'>
                    <div ref={contentEditableDivRef} className={`__custom-autosuggest-block__`} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} contentEditable={disable === true ? false : true} onInput={handleContentChange} onPaste={handlePaste}></div>
                </div>
            </div>
            {showSuggestions && createPortal(<SuggestionBox setSuggestionIndex={setSuggestionIndex} suggestionIndex={suggestionIndex} filteredSuggestions={filteredSuggestions} caretPosition={caretPosition} insertSuggestion={insertSuggestion} />, document.getElementById('root'))}
            {showTooltip && createPortal(<Tooltip suggestions={suggestions} tooltipPosition={tooltipPosition} tooltipVariableDetails={tooltipVariableDetails} />, document.getElementById('root'))}
        </React.Fragment>
    )
}