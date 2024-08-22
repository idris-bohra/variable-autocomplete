import React from 'react';
import './suggestionBox.css';

export default function SuggestionBox(props) {
    return (
        <div className="suggestions" style={{ top: `${props?.caretPosition.top}px`, left: `${props?.caretPosition.left}px` }}>
            {Object.keys(props?.filteredSuggestions).map((suggestion, index) => (
                <div key={index} onMouseDown={props?.insertSuggestion} className='suggestion-item-div'>
                    {(index !== 0) && <div className='saperation-line'></div>}
                    <div className='suggestion-item'>{suggestion}</div>
                </div>
            ))}
        </div>
    )
}