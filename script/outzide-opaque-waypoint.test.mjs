import test from 'node:test';
import assert from 'node:assert/strict';
import {avoidUnneededMarkerDepthReadback as install} from '../client/public/outzide-map/assets/opaque-waypoint.js';
function fixture(){let reads=0;const element={style:{opacity:''}},marker={_map:{},_opacity:'1',_opacityWhenCovered:'1',getElement:()=>element,_updateOpacity(){reads++;}};return {marker,element,reads:()=>reads};}
test('equal opacity without popup does not read terrain depth',()=>{const f=fixture();assert.equal(install(f.marker,'5.6.2'),f.marker);for(let i=0;i<50;i++)f.marker._updateOpacity();assert.equal(f.reads(),0);assert.equal(f.element.style.opacity,'1');});
test('different opacity and an open popup retain vendor coverage behavior',()=>{const f=fixture();install(f.marker,'5.6.2');f.marker._opacityWhenCovered='.2';f.marker._updateOpacity(true);assert.equal(f.reads(),1);f.marker._opacityWhenCovered='1';f.marker._popup={isOpen:()=>true};f.marker._updateOpacity();assert.equal(f.reads(),2);f.marker._popup={isOpen:()=>false};f.marker._updateOpacity();assert.equal(f.reads(),2);});
test('removed markers do no work and other vendor versions stay untouched',()=>{const f=fixture(),original=f.marker._updateOpacity;install(f.marker,'6.0.0');assert.equal(f.marker._updateOpacity,original);install(f.marker,'5.6.2');f.marker._map=null;f.marker._updateOpacity();assert.equal(f.reads(),0);});
