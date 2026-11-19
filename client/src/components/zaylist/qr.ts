/**
 * Minimal QR encoder (byte mode, error-correction level M, versions 1-10),
 * written for guest pass tokens so the client needs no QR dependency.
 * Produces the module matrix; rendering lives in QrPass.tsx.
 */

// Galois field tables for Reed-Solomon over GF(256) with primitive 0x11d.
const EXP = new Array<number>(512);
const LOG = new Array<number>(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
}
const gfMul = (a: number, b: number) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

function rsGenerator(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], EXP[i]);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsRemainder(data: number[], degree: number): number[] {
  const gen = rsGenerator(degree);
  const res = new Array<number>(degree).fill(0);
  for (const b of data) {
    const factor = b ^ res.shift()!;
    res.push(0);
    for (let i = 0; i < degree; i++) res[i] ^= gfMul(gen[i + 1], factor);
  }
  return res;
}

// ECC level M block table for versions 1..10:
// [ecCodewordsPerBlock, [[blockCount, dataCodewordsPerBlock], ...]]
const ECC_TABLE: [number, [number, number][]][] = [
  [10, [[1, 16]]],
  [16, [[1, 28]]],
  [26, [[1, 44]]],
  [18, [[2, 32]]],
  [24, [[2, 43]]],
  [16, [[2, 27], [2, 28]]],
  [18, [[2, 31], [2, 32]]],
  [22, [[2, 38], [2, 39]]],
  [22, [[2, 36], [2, 37], [2, 38]]],
  [26, [[2, 34], [2, 35], [2, 36], [2, 37]]],
];
const ALIGN_POS: number[][] = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
];

function totalDataCodewords(version: number): number {
  return ECC_TABLE[version - 1][1].reduce((s, [n, d]) => s + n * d, 0);
}

class BitBuffer {
  bits: number[] = [];
  put(num: number, len: number) {
    for (let i = len - 1; i >= 0; i--) this.bits.push((num >>> i) & 1);
  }
  putBytes(bytes: number[]) {
    for (const b of bytes) this.put(b, 8);
  }
  get length() {
    return this.bits.length;
  }
  toBytes(): number[] {
    const out: number[] = [];
    for (let i = 0; i < this.bits.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | (this.bits[i + j] ?? 0);
      out.push(b);
    }
    return out;
  }
}

function buildDataCodewords(data: number[], version: number): number[] {
  const capacity = totalDataCodewords(version) * 8;
  const buf = new BitBuffer();
  buf.put(0b0100, 4); // byte mode
  buf.put(data.length, version <= 9 ? 8 : 16);
  buf.putBytes(data);
  buf.put(0, Math.min(4, capacity - buf.length));
  while (buf.length % 8) buf.put(0, 1);
  const pads = [0xec, 0x11];
  let p = 0;
  while (buf.length < capacity) buf.put(pads[p++ % 2], 8);
  return buf.toBytes();
}

function interleave(data: number[], version: number): number[] {
  const [ecLen, groups] = ECC_TABLE[version - 1];
  const blocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let offset = 0;
  for (const [count, per] of groups) {
    for (let i = 0; i < count; i++) {
      const block = data.slice(offset, offset + per);
      offset += per;
      blocks.push(block);
      ecBlocks.push(rsRemainder(block, ecLen));
    }
  }
  const out: number[] = [];
  const maxData = Math.max(...blocks.map((b) => b.length));
  for (let i = 0; i < maxData; i++)
    for (const b of blocks) if (i < b.length) out.push(b[i]);
  for (let i = 0; i < ecLen; i++)
    for (const b of ecBlocks) out.push(b[i]);
  return out;
}

const FORMAT_BITS = (mask: number) => {
  // Level M = 0b00; format info BCH(15,5) with generator 0x537, mask 0x5412.
  const data = (0b00 << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537);
  return ((data << 10) | rem) ^ 0x5412;
};

function drawFunctionModules(m: (boolean | null)[][], version: number) {
  const size = m.length;
  const set = (x: number, y: number, v: boolean) => {
    if (x >= 0 && x < size && y >= 0 && y < size) m[y][x] = v;
  };
  // Timing
  for (let i = 0; i < size; i++) {
    if (m[6][i] === null) m[6][i] = i % 2 === 0;
    if (m[i][6] === null) m[i][6] = i % 2 === 0;
  }
  // Finder patterns with separators
  const finder = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || x >= size || y < 0 || y >= size) continue;
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        m[y][x] = d !== 2 && d !== 4;
      }
    }
  };
  finder(3, 3);
  finder(size - 4, 3);
  finder(3, size - 4);
  // Alignment patterns
  const pos = ALIGN_POS[version - 1];
  for (const y of pos) {
    for (const x of pos) {
      if (
        (x === 6 && y === 6) ||
        (x === 6 && y === size - 7) ||
        (x === size - 7 && y === 6)
      )
        continue;
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++)
          set(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }
  // Dark module + format placeholders
  set(8, size - 8, true);
  for (let i = 0; i < 9; i++) {
    if (m[8][i] === null) m[8][i] = false;
    if (m[i][8] === null) m[i][8] = false;
  }
  for (let i = 0; i < 8; i++) {
    if (m[8][size - 1 - i] === null) m[8][size - 1 - i] = false;
    if (m[size - 1 - i][8] === null) m[size - 1 - i][8] = false;
  }
  m[8][8] = m[8][8] ?? false;
}

function placeFormat(m: (boolean | null)[][], mask: number) {
  const size = m.length;
  const bits = FORMAT_BITS(mask);
  const get = (i: number) => ((bits >>> i) & 1) === 1;
  for (let i = 0; i <= 5; i++) m[i][8] = get(i);
  m[7][8] = get(6);
  m[8][8] = get(7);
  m[8][7] = get(8);
  for (let i = 9; i < 15; i++) m[8][14 - i] = get(i);
  for (let i = 0; i < 8; i++) m[8][size - 1 - i] = get(i);
  for (let i = 8; i < 15; i++) m[size - 15 + i][8] = get(i);
  m[size - 8][8] = true;
}

function maskBit(mask: number, x: number, y: number): boolean {
  switch (mask) {
    case 0: return (x + y) % 2 === 0;
    case 1: return y % 2 === 0;
    case 2: return x % 3 === 0;
    case 3: return (x + y) % 3 === 0;
    case 4: return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
    case 5: return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6: return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    default: return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
  }
}

function penalty(m: boolean[][]): number {
  const size = m.length;
  let score = 0;
  const runPenalty = (line: boolean[]) => {
    let s = 0;
    let run = 1;
    for (let i = 1; i <= line.length; i++) {
      if (i < line.length && line[i] === line[i - 1]) run++;
      else {
        if (run >= 5) s += run - 2;
        run = 1;
      }
    }
    return s;
  };
  for (let y = 0; y < size; y++) {
    score += runPenalty(m[y]);
    score += runPenalty(m.map((r) => r[y]));
  }
  for (let y = 0; y < size - 1; y++)
    for (let x = 0; x < size - 1; x++)
      if (m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1])
        score += 3;
  const finderLike = [true, false, true, true, true, false, true, false, false, false, false];
  const finderLikeRev = [...finderLike].reverse();
  const lines: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    lines.push(m[y]);
    lines.push(m.map((r) => r[y]));
  }
  for (const line of lines) {
    for (let i = 0; i + 11 <= line.length; i++) {
      const seg = line.slice(i, i + 11);
      if (
        seg.every((v, j) => v === finderLike[j]) ||
        seg.every((v, j) => v === finderLikeRev[j])
      )
        score += 40;
    }
  }
  const dark = m.flat().filter(Boolean).length;
  const total = size * size;
  const k = Math.ceil(Math.abs(20 * dark - 10 * total) / total) - 1;
  score += Math.max(0, k) * 10;
  return score;
}

/** Encode text as a QR module matrix (true = dark). Throws if too long. */
export function qrMatrix(text: string): boolean[][] {
  const data = Array.from(new TextEncoder().encode(text));
  let version = 0;
  for (let v = 1; v <= 10; v++) {
    const capBits = totalDataCodewords(v) * 8;
    const needed = 4 + (v <= 9 ? 8 : 16) + data.length * 8;
    if (needed <= capBits) {
      version = v;
      break;
    }
  }
  if (!version) throw new Error("QR payload too long");
  const codewords = interleave(buildDataCodewords(data, version), version);
  const bits: number[] = [];
  for (const b of codewords) for (let i = 7; i >= 0; i--) bits.push((b >>> i) & 1);
  const size = version * 4 + 17;
  let best: boolean[][] | null = null;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const m: (boolean | null)[][] = Array.from({ length: size }, () =>
      new Array<boolean | null>(size).fill(null),
    );
    drawFunctionModules(m, version);
    // Data placement (zigzag from bottom right)
    let bitIdx = 0;
    let upward = true;
    for (let x = size - 1; x >= 1; x -= 2) {
      if (x === 6) x = 5;
      for (let i = 0; i < size; i++) {
        const y = upward ? size - 1 - i : i;
        for (const xx of [x, x - 1]) {
          if (m[y][xx] === null) {
            let v = bitIdx < bits.length ? bits[bitIdx] === 1 : false;
            bitIdx++;
            if (maskBit(mask, xx, y)) v = !v;
            m[y][xx] = v;
          }
        }
      }
      upward = !upward;
    }
    placeFormat(m, mask);
    const filled = m.map((row) => row.map((c) => c === true));
    const s = penalty(filled);
    if (s < bestScore) {
      bestScore = s;
      best = filled;
    }
  }
  return best!;
}
