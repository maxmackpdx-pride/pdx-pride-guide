/** Inspect the intended function's own memo-cache allocation, not siblings.
 * A compiled Artwork export cannot prove that PlacezQuickCard compiled.
 */
import assert from 'node:assert/strict';
import {parseSync} from '@babel/core';
export function inspectCompiledFunction(code,name){
 const ast=parseSync(code,{sourceType:'module',configFile:false,babelrc:false,parserOpts:{plugins:['jsx','typescript']}});
 const aliases=new Set();
 for(const node of ast.program.body){
  if(node.type!=='ImportDeclaration'||!/react(?:\/|_)compiler-runtime/.test(node.source.value))continue;
  for(const specifier of node.specifiers)if(specifier.type==='ImportSpecifier'&&['c','useMemoCache'].includes(specifier.imported.name??specifier.imported.value))aliases.add(specifier.local.name);
 }
 let target;
 const walk=node=>{if(!node||typeof node!=='object')return;if(node.type==='FunctionDeclaration'&&node.id?.name===name)target=node;for(const [key,value] of Object.entries(node)){if(key==='loc'||key==='tokens'||key==='comments')continue;if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')walk(value);}};
 walk(ast.program);
 assert.ok(target,`Cannot find intended component function ${name} in transformed output`);
 const allocations=target.body.body.flatMap(statement=>statement.type==='VariableDeclaration'?statement.declarations:[]).filter(declaration=>declaration.init?.type==='CallExpression'&&declaration.init.callee.type==='Identifier'&&aliases.has(declaration.init.callee.name));
 return {functionName:name,compiled:allocations.length>0,memoSlots:allocations.map(declaration=>declaration.init.arguments[0]?.value??null)};
}
export function assertCompiledFunction(code,name,expected){
 const proof=inspectCompiledFunction(code,name);
 assert.equal(proof.compiled,expected,`Intended component ${name} ${expected?'was skipped by Compiler (a compiled sibling is insufficient)':'unexpectedly compiled'}`);
 return proof;
}
