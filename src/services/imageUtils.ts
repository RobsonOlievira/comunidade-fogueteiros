const MAX_DIMENSION = 256;
const MAX_BYTES = 100 * 1024;
const MIN_QUALITY = 0.4;
const INITIAL_QUALITY = 0.85;

async function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function fitContain(srcW: number, srcH: number, max: number) {
  if (srcW <= max && srcH <= max) return { w: srcW, h: srcH };
  const r = Math.min(max / srcW, max / srcH);
  return { w: Math.round(srcW * r), h: Math.round(srcH * r) };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

export async function compressAvatar(file: File): Promise<Blob> {
  const img = await fileToImage(file);
  const { w, h } = fitContain(img.naturalWidth, img.naturalHeight, MAX_DIMENSION);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  let quality = INITIAL_QUALITY;
  let blob = await canvasToBlob(canvas, 'image/jpeg', quality);

  while (blob && blob.size > MAX_BYTES && quality > MIN_QUALITY) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, 'image/jpeg', Math.max(quality, MIN_QUALITY));
  }

  if (!blob) throw new Error('Falha ao comprimir imagem');
  return blob;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
