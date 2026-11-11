/** Inspect the intended function's own memo-cache allocation, not siblings.
 * A compiled Artwork export cannot prove that PlacezQuickCard compiled.
 */
import assert from 'node:assert/strict';
import {parseSync} from '@babel/core';
export function inspectCompiledFunction(code,name){
 const ast=parseSync(code,{sourceType:'module',configFile:false,babelrc:false,parserOpts:{plugins:['jsx','typescript']}});
 const aliases=new Set(),runtimeObjects=new Set(),imports=[];
 for(const node of ast.program.body){
  if(node.type!=='ImportDeclaration'||!/react(?:\/|_)compiler-runtime/.test(node.source.value))continue;
  imports.push(code.slice(node.start,node.end));
  for(const specifier of node.specifiers){
   if(specifier.type==='ImportSpecifier'&&['c','useMemoCache'].includes(specifier.imported.name??specifier.imported.value))aliases.add(specifier.local.name);
   if(['ImportDefaultSpecifier','ImportNamespaceSpecifier'].includes(specifier.type))runtimeObjects.add(specifier.local.name);
  }
 }
 // Vite dev import-analysis rewrites CJS named imports into a default runtime
 // object followed by `const _c = __vite__cjsImport...["c"]`.
 // Only trace properties on an object imported from compiler-runtime itself.
 const runtimeMember=node=>node?.type==='MemberExpression'&&node.object.type==='Identifier'&&runtimeObjects.has(node.object.name)&&['c','useMemoCache'].includes(node.computed?node.property.value:node.property.name);
 for(const node of ast.program.body)if(node.type==='VariableDeclaration')for(const declaration of node.declarations)if(declaration.id.type==='Identifier'&&runtimeMember(declaration.init))aliases.add(declaration.id.name);
 const isCacheCallee=node=>node?.type==='Identifier'?aliases.has(node.name):runtimeMember(node)||(node?.type==='SequenceExpression'&&node.expressions.length===2&&node.expressions[0].type==='NumericLiteral'&&node.expressions[0].value===0&&isCacheCallee(node.expressions[1]));
 let target;
 const walk=node=>{if(!node||typeof node!=='object')return;if(node.type==='FunctionDeclaration'&&node.id?.name===name)target=node;for(const [key,value] of Object.entries(node)){if(key==='loc'||key==='tokens'||key==='comments')continue;if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')walk(value);}};
 walk(ast.program);
 assert.ok(target,`Cannot find intended component function ${name} in transformed output`);
 const allocations=target.body.body.flatMap(statement=>statement.type==='VariableDeclaration'?statement.declarations:[]).filter(declaration=>declaration.init?.type==='CallExpression'&&isCacheCallee(declaration.init.callee));
 return {functionName:name,compiled:allocations.length>0,memoSlots:allocations.map(declaration=>declaration.init.arguments[0]?.value??null),runtimeAliases:[...aliases],runtimeObjects:[...runtimeObjects],diagnostic:allocations.length?undefined:{imports,functionStart:code.slice(target.start,Math.min(target.end,target.start+2400))}};
}
export function assertCompiledFunction(code,name,expected){
 const proof=inspectCompiledFunction(code,name);
 if(proof.compiled!==expected)console.error('REACT_COMPILER_FUNCTION_PROOF_FAILURE '+JSON.stringify(proof));
 assert.equal(proof.compiled,expected,`Intended component ${name} ${expected?'has no verified own Compiler cache allocation (inspect diagnostic; a compiled sibling is insufficient)':'unexpectedly compiled'}`);
 return proof;
}
