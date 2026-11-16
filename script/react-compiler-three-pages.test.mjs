import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {transformSync} from '@babel/core';
import compiler from 'babel-plugin-react-compiler';

for(const name of ['PlacezBrowse','Scenez','OutzidePlacesPage']){
 test(`${name} actually compiles without broadening inline controller scope`,()=>{
  const filename=`client/src/pages/${name}.tsx`;
  const events=[];
  const result=transformSync(readFileSync(filename,'utf8'),{
   filename,configFile:false,babelrc:false,parserOpts:{plugins:['typescript','jsx']},
   plugins:[[compiler,{compilationMode:'annotation',target:'19',logger:{logEvent(_file,event){events.push(event)}}}]],
  });
  assert.deepEqual(events.filter(e=>e.kind==='CompileSuccess').map(e=>e.fnName),[name]);
  assert.equal(events.filter(e=>e.kind!=='CompileSuccess').length,0,JSON.stringify(events));
  assert.match(result.code,/react\/compiler-runtime/);
  assert.ok(events[0].memoBlocks>0);
 });
}
