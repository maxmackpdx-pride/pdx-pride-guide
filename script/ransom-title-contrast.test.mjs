import test from 'node:test';
import assert from 'node:assert/strict';
import { ransomLetters, ransomContrast } from '../client/src/components/board/punk/ransomStyles.mjs';
import polarity from '../client/src/components/board/punk/glyph-polarity.mjs';

test('mixed titles keep one ink polarity across all styles and repeated letters', () => {
  const seen = new Set();
  for (const contrast of ['light','dark']) for (let seed=0;seed<40;seed++) {
    const letters=ransomLetters('REPEATED LETTERS Aa é Ü 0123456789 & creative titles', String(seed), contrast);
    for(const letter of letters.filter(l=>!/\s/.test(l.char))) {
      seen.add(letter.style);
      const sourceWhite=polarity[letter.style][String(letter.char.codePointAt(0))];
      const renderedWhite=letter.palette==='normal'?sourceWhite:!sourceWhite;
      assert.equal(renderedWhite,contrast==='dark',JSON.stringify(letter));
      assert.equal(letter.contrast,contrast);
    }
  }
  assert.equal(seen.size,10);
});
test('style selection and title contrast remain stable during rerenders', () => {
  for(const seed of ['post-1:title','post-2:title','post-3:price']) {
    assert.deepEqual(ransomLetters('SAME SAME',seed),ransomLetters('SAME SAME',seed));
    const contrast=ransomContrast(seed);
    assert.ok(['light','dark'].includes(contrast));
    for(const line of ['A TWO LINE','CREATIVE TITLE']) assert.ok(ransomLetters(line,`${seed}:${line}`,contrast).every(l=>l.contrast===contrast));
  }
});
