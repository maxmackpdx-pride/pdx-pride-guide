import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync, mkdtempSync, writeFileSync, chmodSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>readFileSync(path.join(root,p),'utf8');
const version='24.22.2';
test('runtime pins stay consistent across development, CI and production',()=>{
 assert.equal(read('.nvmrc').trim(),version);
 assert.equal(JSON.parse(read('package.json')).engines.node,`>=${version} <25`);
 assert.equal(JSON.parse(read('package-lock.json')).packages[''].engines.node,`>=${version} <25`);
 const pins=readdirSync(path.join(root,'.github/workflows')).filter(f=>f.endsWith('.yml')).flatMap(f=>[...read(`.github/workflows/${f}`).matchAll(/node-version:\s*"([^"]+)"/g)].map(m=>m[1]));
 assert.equal(pins.length,7);assert.ok(pins.every(p=>p===version));
 assert.ok(read('script/install-node-runtime.sh').includes(`version=${version}`));
 const railway=JSON.parse(read('railway.json'));
 assert.equal(railway.build.builder,'NIXPACKS');
 assert.ok(railway.build.buildCommand.includes(`= v${version} && npm run build`));
 assert.equal(railway.deploy.startCommand,'export NODE_ENV=production PATH=/opt/node-runtime/bin:$PATH && test "$(node --version)" = v24.22.2 && node --version && exec /opt/node-runtime/bin/node dist/index.cjs');
 assert.match(read('nixpacks.toml'),/nixPkgs = \["openssl"\]/);
 assert.ok(read('nixpacks.toml').includes(`= v${version} && npm ci --include=dev`));
});
function rejectedInstall(arch, corrupt){
 const dir=mkdtempSync(path.join(tmpdir(),'node-runtime-test-'));
 try {
  const fake=(name,body)=>{const file=path.join(dir,name);writeFileSync(file,`#!/bin/bash\n${body}\n`);chmodSync(file,0o755);};
  fake('uname',`echo '${arch}'`);
  fake('curl',corrupt?'while [ "$1" != "--output" ]; do shift; done; printf invalid > "$2"':'exit 99');
  const dest=path.join(dir,'runtime');
  const result=spawnSync('bash',[path.join(root,'script/install-node-runtime.sh')],{encoding:'utf8',env:{...process.env,PATH:`${dir}:${process.env.PATH}`,NODE_RUNTIME_DESTINATION:dest}});
  assert.notEqual(result.status,0);assert.equal(existsSync(dest),false);
  return result.stdout+result.stderr;
 } finally {rmSync(dir,{recursive:true,force:true});}
}
test('installer rejects unsupported architectures before download',()=>assert.match(rejectedInstall('riscv64',false),/Unsupported production CPU architecture/));
test('installer rejects corrupt archive before extracting',()=>assert.match(rejectedInstall('x86_64',true),/FAILED/));
test('Node24 native SQLite supports transactions and queries',async()=>{
 const {default:Database}=await import('better-sqlite3');const db=new Database(':memory:');
 try {db.exec('CREATE TABLE smoke (value INTEGER)');db.transaction(()=>db.prepare('INSERT INTO smoke VALUES (?)').run(42))();assert.equal(db.prepare('SELECT value FROM smoke').get().value,42);assert.ok(db.prepare('SELECT sqlite_version() AS version').get().version);} finally {db.close();}
});
