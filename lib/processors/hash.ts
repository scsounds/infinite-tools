export type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

export async function hashBuffer(buffer: ArrayBuffer, algorithm: HashAlgorithm) {
  const digest = await crypto.subtle.digest(algorithm, buffer);
  return bytesToHex(new Uint8Array(digest));
}

export function crc32(buffer: ArrayBuffer) {
  const table = crcTable();
  const bytes = new Uint8Array(buffer);
  let crc = -1;
  for (const byte of bytes) {
    crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff];
  }
  return ((crc ^ -1) >>> 0).toString(16).padStart(8, "0");
}

export function uuidFromBytes(bytes: Uint8Array) {
  const slice = new Uint8Array(16);
  slice.set(bytes.slice(0, 16));
  slice[6] = (slice[6] & 0x0f) | 0x40;
  slice[8] = (slice[8] & 0x3f) | 0x80;
  const hex = bytesToHex(slice);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function bytesToHex(bytes: Uint8Array) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function crcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
}
