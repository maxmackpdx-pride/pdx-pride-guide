import test from 'node:test';
import {runComparison} from './placez-six-compiler-harness.mjs';
test('six native Placez Compiler optimized production off/on comparison',{timeout:1200000},()=>runComparison({production:true}));
