import test from 'node:test';
import {runComparison} from './placez-six-compiler-harness.mjs';
test('six native Placez Compiler development off/on comparison',{timeout:1200000},()=>runComparison());
