import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import opentype from 'opentype.js';
let displayFont: opentype.Font | null | undefined;
function font(): opentype.Font | null {
  if (displayFont !== undefined) return displayFont;
  try {
    const require = createRequire(path.join(process.cwd(), 'package.json'));
    const bytes = fs.readFileSync(require.resolve('@fontsource/barlow-condensed/files/barlow-condensed-latin-900-normal.woff'));
    displayFont = opentype.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  } catch {displayFont = null;}
  return displayFont;
}
/** Real brand glyph outlines, fitted by measured bounds. Caller retains a readable font fallback. */
export function profileShareDisplayPath(text: string, box: {x: number; y: number; width: number; height: number; maxSize: number; align?: 'center'}, fill: string): string | null {
  const face=font();
  if (!face || face.stringToGlyphs(text).some(glyph=>glyph.index===0)) return null;
  const outline=face.getPath(text,0,0,100);
  const b=outline.getBoundingBox(), width=b.x2-b.x1, height=b.y2-b.y1;
  if (!(width>0 && height>0)) return null;
  const scale=Math.min(box.width/width,box.height/height,box.maxSize/100);
  const x=box.x+(box.align === 'center' ? (box.width-width*scale)/2 : 0)-b.x1*scale, y=box.y+(box.height-height*scale)/2-b.y1*scale;
  // opentype v2's optimized serializer produces NaN for some multi-glyph quadratic paths.
  // Serialize the finite glyph commands directly, preserving the original outlines.
  const number = (value: number) => value.toFixed(3);
  const commands = outline.commands.map(command => {
    if (command.type === 'Z') return 'Z';
    if (command.type === 'M' || command.type === 'L') return `${command.type}${number(command.x)} ${number(command.y)}`;
    if (command.type === 'Q') return `Q${number(command.x1)} ${number(command.y1)} ${number(command.x)} ${number(command.y)}`;
    if (command.type === 'C') return `C${number(command.x1)} ${number(command.y1)} ${number(command.x2)} ${number(command.y2)} ${number(command.x)} ${number(command.y)}`;
    return '';
  }).join(' ');
  return `<g transform="translate(${x.toFixed(3)} ${y.toFixed(3)}) scale(${scale.toFixed(6)})"><path d="${commands}" fill="${fill}"/></g>`;
}
