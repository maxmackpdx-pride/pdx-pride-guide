import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {EVENT_DESIGNS,DESIGN_LAYOUT,hologramLayoutForDesign} from '../client/public/mapz-map/event-design.js';
import {eventCardGeometry,eventDesignPerimeter} from '../client/public/mapz-map/event-hologram-card.js';

const span=(points,key)=>Math.max(...points.map(point=>point[key]))-Math.min(...points.map(point=>point[key]));

test('the renderer asks the picker for a design and lands the beam on that outline',async()=>{
  const renderer=await readFile(new URL('../client/public/mapz-map/river-flight.js',import.meta.url),'utf8');
  const beam=await readFile(new URL('../client/public/mapz-map/event-hologram-card.js',import.meta.url),'utf8');
  const style=await readFile(new URL('../client/public/mapz-map/studio.css',import.meta.url),'utf8');
  assert.match(renderer,/eventDesignFor\(feature\.properties\.key,feature\.properties\.startsAtMs\)/);
  assert.match(renderer,/hologramType:far\?'puck':hologramLayoutForDesign\(hologramDesign\)/);
  assert.doesNotMatch(renderer,/hologramTypeForVenue/);
  assert.match(beam,/eventDesignPerimeter\(card,card\.hologramType\|\|'puck'\)/);
  for(const layout of new Set(Object.values(DESIGN_LAYOUT))){
    assert.match(style,new RegExp(`data-hologram-type="${layout}"`));
  }
});

test('beam outlines match the design family',()=>{
  const card=eventCardGeometry(200,180,1);
  const puck=eventDesignPerimeter(card,'puck');
  const tube=eventDesignPerimeter(card,'tube');
  const brick=eventDesignPerimeter(card,'brick');
  const clasp=eventDesignPerimeter(card,'clasp');
  const dna=eventDesignPerimeter(card,'dna');
  assert.ok(span(tube,'y')>span(tube,'x')*2,'tube is a tall capsule');
  assert.ok(span(brick,'y')>span(brick,'x'),'brick is a vertical stack');
  assert.ok(span(clasp,'x')>span(clasp,'y')*2,'clasp is a wide link');
  assert.ok(dna.length>puck.length,'dna lands on two strands');
  assert.equal(hologramLayoutForDesign(EVENT_DESIGNS[0]),DESIGN_LAYOUT[EVENT_DESIGNS[0]]);
});
