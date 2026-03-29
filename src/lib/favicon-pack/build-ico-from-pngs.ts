export interface IcoPngEntry {
  width: number;
  height: number;
  data: Uint8Array;
}

/**
 * Build a Windows .ico containing embedded PNG images (Vista+).
 * Directory `wPlanes` = 1; `wBitCount` = 0 is the conventional value for PNG payloads
 * (see MS “Icon Directory Entries”; avoids misinterpreting PNG as BMP DIB bits).
 */
export function buildIcoFromPngEntries(entries: IcoPngEntry[]): Uint8Array {
  if (entries.length === 0) {
    throw new Error("ICO requires at least one PNG entry");
  }

  const headerSize = 6 + 16 * entries.length;
  const payloadSize = entries.reduce((sum, e) => sum + e.data.length, 0);
  const totalSize = headerSize + payloadSize;

  const buffer = new ArrayBuffer(totalSize);
  const out = new Uint8Array(buffer);
  const view = new DataView(buffer);

  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, entries.length, true);

  let entryOffset = 6;
  let dataOffset = headerSize;

  for (const e of entries) {
    const w = e.width;
    const h = e.height;
    out[entryOffset + 0] = w >= 256 ? 0 : w;
    out[entryOffset + 1] = h >= 256 ? 0 : h;
    out[entryOffset + 2] = 0;
    out[entryOffset + 3] = 0;
    view.setUint16(entryOffset + 4, 1, true);
    view.setUint16(entryOffset + 6, 0, true);
    view.setUint32(entryOffset + 8, e.data.length, true);
    view.setUint32(entryOffset + 12, dataOffset, true);

    out.set(e.data, dataOffset);
    dataOffset += e.data.length;
    entryOffset += 16;
  }

  return out;
}
