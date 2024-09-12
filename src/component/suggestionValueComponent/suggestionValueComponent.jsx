import React from 'react';
import { MdInfoOutline } from "react-icons/md";
import './suggestionValueComponent.css';

export default function SuggestionValueComponent({ singleSuggestionDetails }) {
    if (!singleSuggestionDetails) {
        return (
            <div className='suggestionValueMainContainer'>
                <div className='spacing-block'>
                    <div className='warning-title'>
                        <MdInfoOutline color='red' size={22} />
                        <span>Unresolved Variable</span>
                    </div>
                    <div className='warning-description'>Make sure the variable is in current Environement</div>
                </div>
            </div>
        )
    }
    return (
        <div className='suggestionValueMainContainer'>
            {singleSuggestionDetails?.initialValue && <div className='suggestionTypeContainer'>
                <div className='suggestionType'>INITIAL</div>
                <div className='suggestionTypeValue'>{singleSuggestionDetails?.initialValue}</div>
            </div>}
            {singleSuggestionDetails?.currentValue && <div className='suggestionTypeContainer'>
                <div className='suggestionType'>CURRENT</div>
                <div className='suggestionTypeValue'>{singleSuggestionDetails?.currentValue}</div>
            </div>}
            {singleSuggestionDetails?.scope && <div className='suggestionTypeContainer'>
                <div className='suggestionType'>SCOPE</div>
                <div className='suggestionTypeValue'>{singleSuggestionDetails?.scope}</div>
            </div>}
        </div>
    )
}