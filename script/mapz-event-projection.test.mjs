import test from 'node:test';
import assert from 'node:assert/strict';
import {createEventProjection,eventProjectionGeometry,eventProjectionHeightLimit,eventProjectionSway,eventProjectionColor} from '../client/public/mapz-map/event-projection.js';

import {lightTick,lightPalette,createLightFilm} from '../client/public/mapz-map/event-light-film.js';
import {readFile} from 'node:fs/promises';

const noop=()=>{};
function canvasFixture(){
  const canvases=[];
  const document={createElement:()=>{
    const canvas={width:0,height:0};
    const ctx=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:data=>canvas.pixels=data.data,
      createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})},{get:(target,key)=>key in target?target[key]:noop});
    canvas.getContext=()=>ctx;canvases.push(canvas);return canvas;
  }};
  return {canvases,document};
}

test('clean film has a seamless seven-second loop and Calm Mode holds still',()=>{
  for(const variant of [0,1,2]){
    assert.equal(lightTick(7,variant),lightTick(0,variant));
    assert.equal(lightTick(2,variant,true),lightTick(99,variant,true));
  }
});

test('spectral fringes follow the primary token while keeping that token dominant',()=>{
  const palette=lightPalette('#FFEE00');
  assert.equal(palette[1],'#FFEE00');
  const center=56;
  assert.equal(parseFloat(palette[0].slice(4)),center-24);
  assert.equal(parseFloat(palette[2].slice(4)),center+24);
  assert.notDeepEqual(palette,lightPalette('#00FFFF'));
});

test('event headers stay level and camera-facing while the beam moves',async()=>{
  const renderer=await readFile(new URL('../client/public/mapz-map/river-flight.js',import.meta.url),'utf8');
  const style=await readFile(new URL('../client/public/mapz-map/studio.css',import.meta.url),'utf8');
  assert.match(renderer,/labelX=logoX,labelY=hologramCenterY\+labelOffset/);
  assert.doesNotMatch(renderer,/facing\.roll|facing\.shear|--label-roll|--label-shear/);
  assert.doesNotMatch(style,/--label-roll|--label-shear/);
});

test('film allocates only when visible, shares caches and releases its canvases',()=>{
  const previous=globalThis.document,previousImage=globalThis.Image;
  const fixture=canvasFixture();globalThis.document=fixture.document;
  globalThis.Image=class{constructor(){assert.fail('beam startup must not request/decode images');}};
  try{
    const effect=createEventProjection(),film=createLightFilm();
    assert.equal(fixture.canvases.length,0);
    effect.draw({globalAlpha:0},eventProjectionGeometry({x:100,y:500},{x:100,y:100}),0,0);
    assert.equal(fixture.canvases.length,0,'hidden beams do not allocate');
    const a=film.get('#FFEE00',0,0,false),same=film.get('#FFEE00',0,0,false);
    assert.equal(a,same);assert.equal(fixture.canvases.length,2);
    film.get('#00FFFF',0,0,false);assert.equal(fixture.canvases.length,3,'base shared between tokens');
    for(let i=0;i<200;i++)film.get('#00FFFF',0,i/24,false);
    assert.equal(fixture.canvases.length,3,'no per-frame canvases');
    film.dispose();effect.dispose();
    for(const c of fixture.canvases)assert.deepEqual([c.width,c.height],[1,1]);
  }finally{globalThis.document=previous;globalThis.Image=previousImage;}
});

test('projection remains tall and narrow at phone and desktop scales and pins its apex',()=>{
  const anchor={x:170,y:600};
  for(const scale of [.4,1,2.5])for(const height of [60,180,360]){
    const a=eventProjectionGeometry(anchor,{x:160,y:600-height},scale);
    const b=eventProjectionGeometry(anchor,{x:160+eventProjectionSway(8,2,scale),y:600-height},scale);
    assert.ok(a.height/(a.halfWidth*2)>=2.8-1e-9);
    assert.deepEqual(a.anchor,anchor);assert.deepEqual(b.anchor,anchor);
    assert.notEqual(a.x,b.x);assert.equal(a.top,b.top);
  }
  assert.equal(eventProjectionSway(30,4,2,true),0);
  assert.equal(eventProjectionSway(80,4,2,true),0);
  assert.notEqual(eventProjectionSway(8,1),eventProjectionSway(8,2));
});

test('day tokens override venue colors and respect the supplied Portland event night',()=>{
  assert.equal(eventProjectionColor({dayColor:'#0044ff',color:'#FF0000'}),'#0044FF');
  assert.equal(eventProjectionColor({eventNight:'2026-10-06',color:'#FF0000'}),'#0044FF');
  assert.equal(eventProjectionColor({eventNight:'2026-10-05'}),'#8800FF');
  assert.equal(eventProjectionColor({dayColor:'#00FFFF',eventNight:'2026-10-05'}),'#00FFFF');
});

test('cone textures preserve transparency, cache each day token and release all canvases',()=>{
  const {canvases,document}=canvasFixture();
  const previous=globalThis.document;
  globalThis.document=document;
  const ctx=new Proxy({globalAlpha:1,createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})},{get:(target,key)=>key in target?target[key]:noop});
  try{
    const material=createEventProjection(),geometry=eventProjectionGeometry({x:150,y:500},{x:155,y:180});
    material.draw(ctx,geometry,0,0,false,'#0044FF');
    material.draw(ctx,geometry,1,0,false,'#0044FF');
    assert.equal(canvases.filter(c=>c.width===192).length,1);
    material.draw(ctx,geometry,1,0,false,'#FF6600');assert.equal(canvases.filter(c=>c.width===192).length,2);
    const volumes=canvases.filter(c=>c.width===192);
    for(const canvas of volumes){
      const {width,height,pixels}=canvas;
      for(let y=0;y<height;y++)for(let x=0;x<width;x++){
        const v=y/(height-1),u=x/(width-1)*2-1,t=Math.max(0,(v-.04)/.96);
        const body=v>=.04&&Math.abs(u)<=Math.max(.002,1-t),cap=u*u+((v-.04)/.04)**2<=1;
        if(!body&&!cap)assert.equal(pixels[(y*width+x)*4+3],0);
      }
      assert.equal(pixels[(400*width+96)*4+3],64,'beam body peaks at 25% opacity');
      for(let i=3;i<pixels.length;i+=4)assert.ok(pixels[i]<=64,'material never exceeds 25% opacity');
    }
    const i=(400*192+96)*4;
    assert.ok(volumes[0].pixels[i+2]>volumes[0].pixels[i]);
    assert.ok(volumes[1].pixels[i]>volumes[1].pixels[i+2]);
    material.dispose();for(const canvas of canvases){assert.equal(canvas.width,1);assert.equal(canvas.height,1);}
  }finally{globalThis.document=previous;}
});


test('beam height stays between 10px and one third above Big Pink',()=>{
  const anchor={x:100,y:500};
  for(const zoom of [10,14,15,16,18])for(const pitch of [0,48,75]){
    const limit=eventProjectionHeightLimit(zoom,pitch);
    for(const y of [600,499,200,-10000]){
      const geometry=eventProjectionGeometry(anchor,{x:100,y},1,limit);
      assert.ok(geometry.height>=10&&geometry.height<=limit);
      assert.equal(geometry.top,anchor.y-geometry.height);
    }
  }
  assert.ok(Math.abs(eventProjectionHeightLimit(15,48)-95)<2);
  assert.equal(eventProjectionHeightLimit(15,0),10);
});
