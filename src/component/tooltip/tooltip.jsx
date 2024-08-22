import React from 'react'
import './tooltip.css'

export default function Tooltip(props) {
    return (
        <div id='__tooltip__' class="__tooltip-container__" style={{ top: `${props?.tooltipPosition.top + 18}px`, left: `${props?.tooltipPosition.left}px` }}>
            <span>Initial</span> : <span>{props?.tooltipVariableDetails?.initial}</span>
            <br />
            <span>Current</span> : <span>{props?.tooltipVariableDetails?.current}</span>
            <br />
            <span>Scope</span> : <span>{props?.tooltipVariableDetails?.scope}</span>
        </div>
    )
}
