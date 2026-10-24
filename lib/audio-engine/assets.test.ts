import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { PUSHUP_SONGS } from '../shared/pushup-songs';

it('ships every selectable soundtrack as a real audio asset', () => {
  for (const song of PUSHUP_SONGS) {
    const bytes = readFileSync(new URL(`../../public${song.file}`, import.meta.url));
    expect(bytes.byteLength).toBeGreaterThan(1000);
    if (song.file.endsWith('.wav')) expect(bytes.subarray(0, 4).toString()).toBe('RIFF');
    else expect(bytes.subarray(0, 3).toString() === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)).toBe(true);
  }
});
