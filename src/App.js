import React, { useRef } from 'react'
import AutoSuggest from './component/autoSuggest/autoSuggest';
import { suggestions } from './enums/suggestions';

export default function App() {
  const contentEditableDivRef = useRef();
  return (
    <div>
      <AutoSuggest suggestions={suggestions} contentEditableDivRef={contentEditableDivRef} />
    </div>
  )
}