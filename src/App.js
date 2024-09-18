import React, { useEffect, useRef, useState } from 'react'
import AutoSuggest from './component/autoSuggest/autoSuggest';
import { suggestions } from './enums/suggestions';

export default function App() {
  const contentEditableDivRef = useRef();
  const [env, setEnv] = useState(suggestions);

  const handleAddEnv = () => {
    setEnv((prev) => {
      return {
        ...prev, ["idris"]: {
          initial: 'idrisbohra',
          current: 'newidris'
        }
      }
    })
  }

  return (
    <div style={{width:"99%" }}>
      <AutoSuggest suggestions={env} initial={""} contentEditableDivRef={contentEditableDivRef} placeholder={'Enter URL or paste curl'} />
    </div>
  )
}