import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';
import Module from 'node:module';
import path from 'node:path';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const output=buildSync({entryPoints:['client/src/components/scenez/SceneCardFace.tsx'],bundle:true,write:false,platform:'node',format:'cjs',packages:'external',jsx:'automatic'}).outputFiles[0].text;
const mod=new Module(path.resolve('scene-face-test.cjs'));mod.filename=path.resolve('scene-face-test.cjs');mod.paths=Module._nodeModulePaths(process.cwd());mod._compile(output,mod.filename);
const {Art,Closed}=mod.exports;
const base={id:'photo-test',page:'scenez',name:'Scene test',kind:'Organization',wordmark:'Fallback name',color:'#ffffff'};
for(const page of ['scenez',undefined,'placez','outzide']){
 for(const size of ['small','tall','square','wide-map','expanded']){
  for(const photo of [false,true])for(const logo of [false,true]){
   test(`${page??'default SceneZ'} ${size}: photo=${photo}, logo=${logo}`,()=>{
    const c={...base,page,image:photo?'/photo.webp':undefined,logo:logo?'/authentic-mark.svg':undefined};
    const html=renderToStaticMarkup(createElement(size==='expanded'?Art:Closed,{c,size,open:()=>{},toggle:()=>{}}));
    const scene=!page||page==='scenez';
    assert.equal(/<img[^>]*class="scene-logo/.test(html),logo&&(!photo||scene));
    assert.equal(html.includes('scene-logo--photo'),photo&&logo&&scene);
    assert.equal(html.includes('scene-wordmark'),!photo&&!logo);
    if(photo)assert.match(html,/class="landscape(?: outz-crop)?"/);
    if(photo&&logo&&scene){
     assert.match(html,/<img[^>]*src="\/authentic-mark.svg"/);
     assert.ok(html.indexOf('scene-logo--photo')>html.indexOf('class="traces"'));
    }
   });
  }
 }
}
