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
          initial:'idrisbohra',
          current : 'newidris'
        }
      }
    })
  }
  
  return (
    <div>
      <AutoSuggest suggestions={env} initial={"<span text-block='true'>https://</span><span variable-block='true'>{{base-url}}</span><span text-block='true'>.com/:</span><span variable-block='true'>{{userID}}</span><span text-block='true'>/getuserdetails/</span><span variable-block='true'>{{username}}</span><span text-block='true'>?usertoken=</span><span variable-block='true'>{{usertoken}}</span><span text-block='true'>&idrisbohra=</span><span variable-block='true'>{{bohra}}</span><span text-block='true'></span><span variable-block='true'>{{appSecret}}</span><span text-block='true'></span>"} contentEditableDivRef={contentEditableDivRef} />
      <button onClick={handleAddEnv}>add env</button>
    </div>
  )
}