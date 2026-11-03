import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function resolve(spec,from){const base=spec.startsWith('@/')?path.join(root,'client/src',spec.slice(2)):spec.startsWith('@shared/')?path.join(root,'shared',spec.slice(8)):spec.startsWith('.')?path.resolve(path.dirname(from),spec):null;if(!base)return null;return [base,...['.ts','.tsx','.js','.jsx','/index.ts','/index.tsx'].map(ext=>base+ext)].find(f=>/\.[jt]sx?$/.test(f)&&fs.existsSync(f)&&fs.statSync(f).isFile());}
for(const entry of ['main.tsx','pages/Home.tsx','pages/Events.tsx','pages/Directory.tsx'])test(`${entry} has no eager Leaflet/MapLibre graph`,()=>{
 const queue=[[path.join(root,'client/src',entry),[]]],seen=new Set();while(queue.length){const [file,chain]=queue.shift();if(seen.has(file))continue;seen.add(file);const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);for(const statement of source.statements){if(!ts.isImportDeclaration(statement)&&!ts.isExportDeclaration(statement))continue;if(statement.isTypeOnly||statement.importClause?.isTypeOnly||!statement.moduleSpecifier||!ts.isStringLiteral(statement.moduleSpecifier))continue;const spec=statement.moduleSpecifier.text;assert.ok(!/^(leaflet|react-leaflet|maplibre-gl|@maplibre\/)/.test(spec),`eager map dependency: ${[...chain,path.relative(root,file),spec].join(' -> ')}`);const target=resolve(spec,file);if(target)queue.push([target,[...chain,path.relative(root,file)]]);}}
});
