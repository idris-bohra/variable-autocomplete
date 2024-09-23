import React, { useEffect, useRef, useState } from 'react';
import SuggestionValueComponent from '../suggestionValueComponent/suggestionValueComponent';
import './suggestionBox.css';

export default function SuggestionBox(props) {

    const suggestionRefs = useRef([]);
    const suggestionBoxRef = useRef();

    const [caretPosition, setCaretPosition] = useState({ top: '', left: '' });

    useEffect(() => {
        if (suggestionRefs.current[props.suggestionIndex]) {
            suggestionRefs.current[props.suggestionIndex].scrollIntoView({
                behavior: 'auto',
                block: 'nearest',
                inline: 'start',
            });
        }
    }, [props.suggestionIndex]);

    useEffect(() => {
        const bodyPos = { innerHeight: window.innerWidth, innerWidth: window.innerWidth };
        const suggestionBoxWidth = suggestionBoxRef?.current?.getBoundingClientRect()?.width;
        if (props?.caretPosition.left + suggestionBoxWidth >= (bodyPos.innerWidth - 10)) {
            const extraWidth = (props?.caretPosition.left + suggestionBoxWidth) - bodyPos.innerWidth;
            setCaretPosition({ top: props?.caretPosition?.top, left: props?.caretPosition?.left - extraWidth - 20 });
            return;
        }
        setCaretPosition({ ...props?.caretPosition })
    }, [props?.filteredSuggestions, props?.caretPosition]);


    const handleSuggestionHoverEvent = (index) => {
        props?.setSuggestionIndex(index)
    }

    function ShowSuggestionValue() {
        const filteredSuggestionsKeys = Object.keys(props?.filteredSuggestions);
        const currentSuggestionKey = filteredSuggestionsKeys[props?.suggestionIndex];
        const singleSuggestionDetails = props.filteredSuggestions[currentSuggestionKey];
        return <SuggestionValueComponent singleSuggestionDetails={singleSuggestionDetails} />
    }

    function appendSuggestionReference(element, index) {
        suggestionRefs.current[index] = element
    }

    return (
        <React.Fragment>
            {Object.keys(props?.filteredSuggestions || {})?.length > 0 && <div ref={suggestionBoxRef} className="__suggestions__container__" style={{ top: `${caretPosition.top}px`, left: `${caretPosition.left}px` }}>
                <div className='__main__suggestion__container__'>
                    {Object.keys(props?.filteredSuggestions).map((suggestion, index) => (
                        <div
                            key={index}
                            ref={(element) => appendSuggestionReference(element, index)}
                            onMouseDown={() => props?.insertSuggestion(suggestion)}
                            onMouseEnter={() => handleSuggestionHoverEvent(index)}
                            className='suggestion-item-div'
                            style={{ backgroundColor: props?.suggestionIndex === index ? "rgba(128, 128, 128, 0.1)" : "transparent" }}
                        >
                            {suggestion}
                        </div>
                    ))}
                </div>
                <ShowSuggestionValue />
            </div>}
        </React.Fragment>
    )
}