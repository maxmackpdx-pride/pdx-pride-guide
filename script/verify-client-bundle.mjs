import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function verifyClientBundle() {
  const root = path.resolve('dist/public');
  const manifest = JSON.parse(await readFile(path.join(root,'.vite/manifest.json'),'utf8'));
  const visited = new Set();
  const visit = key => {
    if (visited.has(key)) return;
    visited.add(key);
    for (const imported of manifest[key]?.imports || []) visit(imported);
  };
  const entries=Object.entries(manifest).filter(([,value])=>value.isEntry);
  if (!entries.length) throw new Error('No entry found in client manifest');
  entries.forEach(([key])=>visit(key));
  let bytes=0;
  for (const key of visited) {
    const file=manifest[key].file;
    if (/maplibre|html2canvas|LivePlaceMap|InboxOverlay/i.test(file)) {
      throw new Error(`On-demand feature became an eager dependency: ${file}`);
    }
    bytes+=(await stat(path.join(root,file))).size;
  }
  // Baseline before lazy feature boundaries: 2.14 MB. Keep startup below 800 KB;
  // do not hide Vite warnings for inherently large on-demand map libraries.
  if (bytes>800_000) throw new Error(`Initial JavaScript ${bytes} bytes exceeds the 800 KB budget`);
  console.log(`Client bundle guard PASS: ${bytes} initial JS bytes; maps, export, inbox are deferred`);
}
if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  await verifyClientBundle();
}
