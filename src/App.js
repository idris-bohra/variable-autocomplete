import React from 'react'
import AutoSuggest from './component/autoSuggest/autoSuggest';
import { suggestions } from './enums/suggestions';

export default function App() {
  return (
    <div>
      <AutoSuggest suggestions={suggestions} />
    </div>
  )
}