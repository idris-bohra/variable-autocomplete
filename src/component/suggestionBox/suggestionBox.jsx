import React from 'react';
import SuggestionValueComponent from '../suggestionValueComponent/suggestionValueComponent';
import './suggestionBox.css';

export default function SuggestionBox(props) {

    const handleSuggestionHoverEvent = (index) => {
        props?.setSuggestionIndex(index)
    }

    function ShowSuggestionValue() {
        const filteredSuggestionsKeys = Object.keys(props?.filteredSuggestions);
        const currentSuggestionKey = filteredSuggestionsKeys[props?.suggestionIndex];
        const singleSuggestionDetails = props.filteredSuggestions[currentSuggestionKey];
        return <SuggestionValueComponent singleSuggestionDetails={singleSuggestionDetails} />
    }

    return (
        <div className="suggestions" style={{ top: `${props?.caretPosition.top}px`, left: `${props?.caretPosition.left}px` }}>
            <div className='__main__suggestion__container__'>
                {Object.keys(props?.filteredSuggestions).map((suggestion, index) => (
                    <div
                        key={index}
                        onMouseDown={() => props?.insertSuggestion(suggestion)}
                        onMouseEnter={() => handleSuggestionHoverEvent(index)}
                        className='suggestion-item-div'
                        style={{ backgroundColor: props?.suggestionIndex === index ? "rgba(128, 128, 128, 0.2)" : "transparent" }}
                    >
                        {suggestion}
                    </div>
                ))}
            </div>
            <ShowSuggestionValue />
        </div>
    )
}