import React from 'react'
import SuggestionValueComponent from '../suggestionValueComponent/suggestionValueComponent'
import './tooltip.css'

export default function Tooltip(props) {
    return (
        <div class="__tooltip-container__" style={{ top: `${props?.tooltipPosition.top + 18}px`, left: `${props?.tooltipPosition.left}px` }}>
            <SuggestionValueComponent singleSuggestionDetails={props?.tooltipVariableDetails} />
        </div>
    )
}