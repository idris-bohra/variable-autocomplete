import React, { useEffect, useRef } from 'react';
import SuggestionValueComponent from '../suggestionValueComponent/suggestionValueComponent';
import './suggestionBox.css';

export default function SuggestionBox(props) {

    const suggestionRefs = useRef([]);

    useEffect(() => {
        if (suggestionRefs.current[props.suggestionIndex]) {
            suggestionRefs.current[props.suggestionIndex].scrollIntoView({
                behavior: 'auto',
                block: 'nearest',
                inline: 'start',
            });
        }
    }, [props.suggestionIndex]);

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
        <div className="__suggestions__container__" style={{ top: `${props?.caretPosition.top}px`, left: `${props?.caretPosition.left}px` }}>
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
        </div>
    )
}