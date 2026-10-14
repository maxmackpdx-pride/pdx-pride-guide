import test from 'node:test';
import assert from 'node:assert/strict';
import {readBrowseCategories} from './browseCategoryState';
const valid=(value:string)=>['bar','cafe','venue','community'].includes(value);
test('legacy category doorway survives with valid distinct selections',()=>{assert.deepEqual(readBrowseCategories(new URLSearchParams('category=bar,cafe,bar,invalid'),'type',valid,'category'),['bar','cafe']);});
test('canonical type takes precedence and empty/invalid categories mean all',()=>{assert.deepEqual(readBrowseCategories(new URLSearchParams('type=venue&category=bar'),'type',valid,'category'),['venue']);assert.deepEqual(readBrowseCategories(new URLSearchParams('type=ALL,invalid'),'type',valid,'category'),[]);});
test('NEEDZ community multiselect uses the same valid unique contract',()=>{assert.deepEqual(readBrowseCategories(new URLSearchParams('cat=community,community,venue,private'),'cat',valid),['community','venue']);});
