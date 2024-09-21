import React, { useEffect, useRef, useState } from 'react'
import AutoSuggest from './component/autoSuggest/autoSuggest';
import { suggestions } from './enums/suggestions';

export default function App() {
  const contentEditableDivRef = useRef();
  const contentEditableDivRef2 = useRef();
  const contentEditableDivRef3 = useRef();
  const contentEditableDivRef4 = useRef();
  const [initial, setInitial] = useState('')

  useEffect(() => {
    // setInitial('<span variable-block="true">{{url}}</span><span text-block="true">/v2/company/</span><span variable-block="true">{{companyUniqueName}}</span><span text-block="true">/groups/</span><span variable-block="true">{{groupUniqueName}}</span><span text-block="true">/accounts/</span><span variable-block="true">{{accountUniqueName}}</span>')
  }, [])
  

  return (
    <div style={{width:"99%" }}>
      <AutoSuggest suggestions={suggestions} initial={initial} contentEditableDivRef={contentEditableDivRef} placeholder={'Enter URL or paste curl'} />
      <AutoSuggest suggestions={suggestions} initial={initial} contentEditableDivRef={contentEditableDivRef2} placeholder={'Enter URL or paste curl'} />
      <AutoSuggest suggestions={suggestions} initial={initial} contentEditableDivRef={contentEditableDivRef3} placeholder={'Enter URL or paste curl'} />
      <AutoSuggest suggestions={suggestions} initial={initial} contentEditableDivRef={contentEditableDivRef4} placeholder={'Enter URL or paste curl'} />
    </div>
  )
}