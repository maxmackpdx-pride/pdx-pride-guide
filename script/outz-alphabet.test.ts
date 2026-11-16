import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {outzAlphabetMatches as matches,OUTZ_ALPHABET_RANGES} from '../shared/outzAlphabet';
test('range boundaries cover every English letter exactly once',()=>{for(const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'){assert.equal(OUTZ_ALPHABET_RANGES.filter(r=>r!=='All'&&matches(letter+' Lake',r)).length,1);}assert(matches('Eagle','A–E'));assert(matches('Forest','F–J'));assert(matches('Zigzag','U–Z'));});
test('normalizes case accents and leading punctuation without dropping articles',()=>{assert(matches('  éagle creek','A–E'));assert(matches('“Forest Park”','F–J'));assert(matches('The Dalles','P–T'));assert(matches('49 Degrees North','#'));assert(matches('49 Degrees North','All'));assert(!matches('Forest','A–E'));});
test('range composes with existing filters and resets card pagination without affecting seasonal or saved cards',()=>{const s=readFileSync(new URL('../client/src/pages/OutzidePlacesPage.tsx',import.meta.url),'utf8');assert(s.includes('explored=visible.filter'));assert(s.includes('scope={JSON.stringify([search,group,alphabet])}'));assert(s.includes('items={exploreWithPhotos}'));assert(s.includes('const seasonal=[...withPhotos]'));assert(s.includes('items={saved} scope={g.id}'));assert(s.includes('explored.filter(p=>!entry(p).image)'));});
