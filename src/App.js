import React, { useEffect, useRef, useState } from 'react'
import AutoSuggest from './component/autoSuggest/autoSuggest';
import { suggestions } from './enums/suggestions';

export default function App() {
  const contentEditableDivRef = useRef();
  const [initial, setInitial] = useState('')

  useEffect(() => {
    setInitial('<span variable-block="true">{{url}}</span><span text-block="true">/v2/company/</span><span variable-block="true">{{companyUniqueName}}</span><span text-block="true">/groups/</span><span variable-block="true">{{groupUniqueName}}</span><span text-block="true">/accounts/</span><span variable-block="true">{{accountUniqueName}}</span>')
  }, [])
  
  const handleValueChange = ()=>{
    console.log('ere')
  }

  return (
    <div style={{width:"99%" }}>
      <AutoSuggest handleValueChange={handleValueChange} suggestions={suggestions} initial={initial} contentEditableDivRef={contentEditableDivRef} placeholder={'Enter URL or paste curl'} />
    </div>
  )
}