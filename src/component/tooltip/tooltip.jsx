import React, { useEffect, useRef, useState } from 'react'
import SuggestionValueComponent from '../suggestionValueComponent/suggestionValueComponent'
import './tooltip.css'

export default function Tooltip(props) {

    const tooltipRef = useRef()
    const [tooltipPos, setTooltipPos] = useState(props?.tooltipPosition)

    useEffect(() => {
        const bodyPos = { innerHeight: window.innerWidth, innerWidth: window.innerWidth };
        const suggestionBoxWidth = tooltipRef.current.getBoundingClientRect().width;
        if (props?.tooltipPosition.left + suggestionBoxWidth >= (bodyPos.innerWidth - 10)) {
            const extraWidth = (props?.tooltipPosition.left + suggestionBoxWidth) - bodyPos.innerWidth;
            setTooltipPos({ top: props?.tooltipPosition?.top, left: props?.tooltipPosition?.left - extraWidth - 20 });
            return;
        }
        setTooltipPos({ ...props?.tooltipPosition })
    }, [props?.tooltipPosition])

    return (
        <div class="__tooltip-container__" ref={tooltipRef} style={{ top: `${tooltipPos.top + 18}px`, left: `${tooltipPos.left}px` }}>
            <SuggestionValueComponent singleSuggestionDetails={props?.tooltipVariableDetails} />
        </div>
    )
}