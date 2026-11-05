// Public listing images use the existing owner-scoped public-media bucket.
// Every replacement gets a fresh path; linked images are never overwritten.
export const THUMBNAIL_BUCKET = 'avatars';
export const MAX_THUMBNAIL_SOURCE_BYTES = 10 * 1024 * 1024;
export const MAX_THUMBNAIL_BYTES = 2 * 1024 * 1024;
const MAX_PIXELS = 24_000_000;
const MAX_EDGE = 1600;
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const PATH = new RegExp(`^(${UUID})/listing-thumbnails/(jobs|services)/${UUID}\\.(webp|png|jpg)$`);
const TYPES = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg' };

export class ThumbnailError extends Error {
  constructor(code) { super(code); this.name = 'ThumbnailError'; this.code = code; }
}

export function thumbnailErrorMessage(error, en = false) {
  const messages = {
    type: ['Wybierz zdjęcie JPG, PNG lub WEBP.', 'Choose a JPG, PNG or WEBP image.'],
    size: ['Zdjęcie może mieć maksymalnie 10 MB.', 'The image can be up to 10 MB.'],
    dimensions: ['Wybierz zdjęcie o rozdzielczości od 80 × 80 px, do 24 megapikseli i 12 000 px na bok.', 'Choose an image of at least 80 × 80 px, up to 24 megapixels and 12,000 px per side.'],
    animated: ['Wybierz nieruchome zdjęcie, bez animacji.', 'Choose a still image without animation.'],
    decode: ['Nie możemy odczytać tego zdjęcia. Wybierz inny plik.', 'We could not read this image. Choose another file.'],
    encode: ['Nie udało się przygotować zdjęcia. Wybierz inny plik.', 'We could not prepare the image. Choose another file.'],
    path: ['Miniaturka nie pasuje do tego ogłoszenia. Wybierz zdjęcie ponownie.', 'This thumbnail does not belong to this listing. Choose the image again.'],
    upload: ['Nie udało się przesłać miniaturki. Sprawdź połączenie i spróbuj ponownie. Ogłoszenie nie zostało zapisane.', 'The thumbnail could not be uploaded. Check your connection and try again. The listing has not been saved.'],
  };
  return (messages[error?.code] || messages.decode)[en ? 1 : 0];
}

export function validThumbnailPath(path, ownerId, kind) {
  if (typeof path !== 'string') return false;
  const match = PATH.exec(path);
  return !!match && (!ownerId || match[1] === ownerId) && (!kind || match[2] === kind);
}

export function thumbnailUrl(client, path, ownerId, kind) {
  if (!validThumbnailPath(path, ownerId, kind)) return '';
  return client.storage.from(THUMBNAIL_BUCKET).getPublicUrl(path)?.data?.publicUrl || '';
}

function checkDimensions(width, height) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 80 || height < 80 ||
      width > 12000 || height > 12000 || width * height > MAX_PIXELS) {
    throw new ThumbnailError('dimensions');
  }
}

// Read dimensions before decoding so a small compressed file cannot request
// an unbounded image allocation. The browser still validates the entire image.
export function inspectThumbnailBytes(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const ascii = (start, length) => String.fromCharCode(...b.subarray(start, start + length));
  let width, height, type;
  if (b.length >= 24 && b[0] === 137 && ascii(1, 7) === 'PNG\r\n\x1a\n' && ascii(12, 4) === 'IHDR') {
    type = 'image/png'; width = v.getUint32(16); height = v.getUint32(20);
  } else if (b.length >= 4 && b[0] === 255 && b[1] === 216) {
    type = 'image/jpeg';
    let offset = 2;
    const sof = new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);
    while (offset + 3 < b.length) {
      if (b[offset++] !== 0xff) throw new ThumbnailError('decode');
      while (b[offset] === 0xff) offset++;
      const marker = b[offset++];
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > b.length) break;
      const length = v.getUint16(offset);
      if (length < 2 || offset + length > b.length) throw new ThumbnailError('decode');
      if (sof.has(marker) && length >= 8) { height = v.getUint16(offset + 3); width = v.getUint16(offset + 5); break; }
      offset += length;
    }
  } else if (b.length >= 30 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') {
    type = 'image/webp';
    let offset = 12;
    while (offset + 8 <= b.length) {
      const chunk = ascii(offset, 4), size = v.getUint32(offset + 4, true), start = offset + 8;
      if (start + size > b.length) throw new ThumbnailError('decode');
      if (chunk === 'VP8X' && size >= 10) {
        if (b[start] & 2) throw new ThumbnailError('animated');
        width = 1 + b[start + 4] + (b[start + 5] << 8) + (b[start + 6] << 16);
        height = 1 + b[start + 7] + (b[start + 8] << 8) + (b[start + 9] << 16);
        break;
      }
      if (chunk === 'VP8 ' && size >= 10 && b[start + 3] === 0x9d && b[start + 4] === 1 && b[start + 5] === 0x2a) {
        width = v.getUint16(start + 6, true) & 0x3fff; height = v.getUint16(start + 8, true) & 0x3fff; break;
      }
      if (chunk === 'VP8L' && size >= 5 && b[start] === 0x2f) {
        const bits = v.getUint32(start + 1, true);
        width = (bits & 0x3fff) + 1; height = ((bits >>> 14) & 0x3fff) + 1; break;
      }
      offset = start + size + (size % 2);
    }
  } else throw new ThumbnailError('type');
  if (!width || !height) throw new ThumbnailError('decode');
  checkDimensions(width, height);
  return { type, width, height };
}

export function fitThumbnail(width, height, edge = MAX_EDGE) {
  const scale = Math.min(1, edge / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function decodeImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const finish = (error) => { clearTimeout(timer); image.onload = null; image.onerror = null; error ? reject(error) : resolve(image); };
    const timer = setTimeout(() => { image.src = ''; finish(new ThumbnailError('decode')); }, 15000);
    image.onload = () => finish();
    image.onerror = () => finish(new ThumbnailError('decode'));
    image.src = url;
  });
}

function encodeCanvas(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob && TYPES[blob.type] ? resolve(blob) : reject(new ThumbnailError('encode')), 'image/webp', quality);
  });
}

export async function prepareListingThumbnail(file) {
  if (!file || file.size === 0) throw new ThumbnailError('decode');
  if (file.size > MAX_THUMBNAIL_SOURCE_BYTES) throw new ThumbnailError('size');
  if (file.type && !TYPES[file.type]) throw new ThumbnailError('type');
  const header = inspectThumbnailBytes(await file.arrayBuffer());
  if (file.type && file.type !== header.type) throw new ThumbnailError('type');
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await decodeImage(objectUrl);
    checkDimensions(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement('canvas');
    let edge = MAX_EDGE, blob, size;
    for (let attempt = 0; attempt < 6; attempt++) {
      size = fitThumbnail(image.naturalWidth, image.naturalHeight, edge);
      canvas.width = size.width; canvas.height = size.height;
      const context = canvas.getContext('2d');
      if (!context) throw new ThumbnailError('encode');
      context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
      context.drawImage(image, 0, 0, size.width, size.height);
      blob = await encodeCanvas(canvas, .86);
      if (blob.size <= MAX_THUMBNAIL_BYTES) break;
      edge = Math.floor(edge * .75);
    }
    if (!blob || blob.size > MAX_THUMBNAIL_BYTES) throw new ThumbnailError('encode');
    // Re-encoding removes camera metadata; aspect ratio and transparency remain.
    return { blob, ...size, name: file.name || '' };
  } catch (error) {
    throw error instanceof ThumbnailError ? error : new ThumbnailError('decode');
  } finally { URL.revokeObjectURL(objectUrl); }
}

export async function saveListingThumbnail(client, ownerId, kind, value) {
  if (value == null) return null;
  if (typeof value === 'string') {
    if (!validThumbnailPath(value, ownerId, kind)) throw new ThumbnailError('path');
    return value;
  }
  const extension = TYPES[value?.blob?.type];
  if (!extension || !value.blob.size || value.blob.size > MAX_THUMBNAIL_BYTES || !['jobs','services'].includes(kind)) throw new ThumbnailError('type');
  let imageId;
  try {
    if (typeof globalThis.crypto?.randomUUID === 'function') imageId = globalThis.crypto.randomUUID();
    else {
      const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
      bytes[6] = (bytes[6] & 15) | 64;
      bytes[8] = (bytes[8] & 63) | 128;
      const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
      imageId = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
    }
  } catch { throw new ThumbnailError('upload'); }
  const path = `${ownerId}/listing-thumbnails/${kind}/${imageId}.${extension}`;
  if (!validThumbnailPath(path, ownerId, kind)) throw new ThumbnailError('path');
  try {
    const { error } = await client.storage.from(THUMBNAIL_BUCKET).upload(path, value.blob, {
      contentType: value.blob.type, cacheControl: '31536000', upsert: false,
    });
    if (error) throw error;
  } catch { throw new ThumbnailError('upload'); }
  return path;
}

// A failed response may follow a committed write. Only remove an image after
// confirming that no accessible owner listing references it. Failure stays safe.
export async function removeUnlinkedThumbnail(client, path, ownerId) {
  if (!validThumbnailPath(path, ownerId)) return false;
  try {
    for (const [table, ownerColumn] of [['jobs','user_id'],['freelancer_services','freelancer_id']]) {
      const { data, error } = await client.from(table).select('id').eq(ownerColumn, ownerId).eq('thumbnail_path', path).limit(1);
      if (error || !Array.isArray(data) || data.length) return false;
    }
    const { error } = await client.storage.from(THUMBNAIL_BUCKET).remove([path]);
    return !error;
  } catch { return false; }
}

// Keep the existing service RPCs (capacity, prices and permissions) unchanged.
// One bounded read enriches their result with thumbnails and, for sorting, creation dates.
export async function withServiceThumbnails(client, rows, { includeCreatedAt = false } = {}) {
  if (!Array.isArray(rows) || !rows.length) return Array.isArray(rows) ? rows : [];
  try {
    const details = new Map();
    const columns = includeCreatedAt ? 'id,thumbnail_path,created_at' : 'id,thumbnail_path';
    for (let offset = 0; offset < rows.length; offset += 100) {
      const { data, error } = await client.from('freelancer_services').select(columns).in('id', rows.slice(offset, offset + 100).map(row => row.id));
      if (error || !Array.isArray(data)) return rows;
      for (const row of data) details.set(row.id, row);
    }
    return rows.map(row => {
      const detail = details.get(row.id);
      return { ...row, thumbnail_path: detail?.thumbnail_path || null,
        ...(includeCreatedAt && { created_at: detail?.created_at ?? row.created_at }) };
    });
  } catch { return rows; }
}
