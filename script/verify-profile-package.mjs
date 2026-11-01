import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';
const root='dist/profile-objects/v1',manifest=JSON.parse(await readFile(path.join(root,'manifest.json'),'utf8'));
assert.equal(manifest.objects.length,24);assert.equal(manifest.widgets.length,18);
for(const a of manifest.artifacts){const bytes=await readFile(path.join(root,a.path));assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256,a.path);}
for(const item of manifest.objects){assert.ok(item.sourcePath&&item.variants.length);assert.equal(new Set(item.variants.map(v=>v.id)).size,item.variants.length);for(const v of item.variants)assert.ok(v.specimenUrl.includes('variant='));}
await stat(path.join(root,manifest.types));console.log(`Verified ${manifest.objects.length} objects, ${manifest.objects.reduce((n,o)=>n+o.variants.length,0)} variants and ${manifest.artifacts.length} checksummed artifacts.`);
