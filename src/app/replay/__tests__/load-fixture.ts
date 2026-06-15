import { readFileSync } from 'fs';
import { resolve } from 'path';

/** Read a binary replay fixture as an ArrayBuffer (what `decodeReplay` expects). */
export function loadReplayFixture(name: string): ArrayBuffer {
  const buf = readFileSync(resolve(process.cwd(), 'src/app/replay/__tests__/fixtures', name));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}
