import React from 'react';
import './suggestionBox.css';

export default function SuggestionBox(props) {

    const handleSuggestionHoverEvent = (index) => {
        props?.setSuggestionIndex(index)
    }

    function ValueComponent() {
        const filteredSuggestionsKeys = Object.keys(props?.filteredSuggestions);
        const currentSuggestionKey = filteredSuggestionsKeys[props?.suggestionIndex];
        const singleSuggestionDetails = props.filteredSuggestions[currentSuggestionKey];
        return (
            <div>
                <span>Initial</span> : <span>{singleSuggestionDetails?.initial}</span>
                <span>Current</span> : <span>{singleSuggestionDetails?.current}</span>
                <span>Scope</span> : <span>{singleSuggestionDetails?.scope}</span>
            </div>
        )
    }

    return (
        <div className="suggestions" style={{ top: `${props?.caretPosition.top}px`, left: `${props?.caretPosition.left}px` }}>
            {Object.keys(props?.filteredSuggestions).map((suggestion, index) => (
                <div className='__main__suggestion__container__'>
                    <div key={index} onMouseDown={() => props?.insertSuggestion(suggestion)} className='suggestion-item-div'>
                        {(index !== 0) && <div className='saperation-line'></div>}
                        <div
                            key={index}
                            style={{ backgroundColor: props?.suggestionIndex === index ? "rgba(128, 128, 128, 0.2)" : "transparent" }}
                            onMouseEnter={() => handleSuggestionHoverEvent(index)} className='suggestion-item'
                        >
                            {suggestion}
                        </div>
                    </div>
                    <ValueComponent />
                </div>
            ))}
        </div>
    )
}