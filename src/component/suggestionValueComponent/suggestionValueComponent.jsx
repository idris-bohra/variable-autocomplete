import React from 'react';
import info from '../../images/info.png'
import './suggestionValueComponent.css';

export default function SuggestionValueComponent({ singleSuggestionDetails }) {
    if (!singleSuggestionDetails) {
        return (
            <div className='suggestionValueMainContainer'>
                <div className='spacing-block'>
                    <div className='warning-title'>
                        <img width={18} height={18} src={info} alt='unavailable' />
                        <span>Unresolved Variable</span>
                    </div>
                    <div className='warning-description'>Make sure the variable is in current Environement</div>
                </div>
            </div>
        )
    }
    return (
        <div className='suggestionValueMainContainer'>
            <div className='suggestionTypeContainer'>
                <div className='suggestionType'>INITIAL</div>
                <div className='suggestionTypeValue'>{singleSuggestionDetails?.initial}</div>
            </div>
            <div className='suggestionTypeContainer'>
                <div className='suggestionType'>CURRENT</div>
                <div className='suggestionTypeValue'>{singleSuggestionDetails?.current}</div>
            </div>
            <div className='suggestionTypeContainer'>
                <div className='suggestionType'>SCOPE</div>
                <div className='suggestionTypeValue'>{singleSuggestionDetails?.scope}</div>
            </div>
        </div>
    )
}