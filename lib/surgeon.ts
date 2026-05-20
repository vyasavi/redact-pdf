import { RedactionBox } from './mapping';
import jsPDF from 'jspdf';

/**
 * NUCLEAR PIXEL-LEVEL REDACTION
 * 
 * 1. Loads each page preview image onto a fresh HTML Canvas
 * 2. Burns black rectangles directly into the pixel buffer using Canvas 2D
 * 3. Exports the already-redacted canvas as a flat JPEG (no layers)
 * 4. Adds the flat image to a jsPDF document (image-only, zero text)
 * 
 * The final PDF is nothing but a stack of flat JPEG images.
 * No text layer. No vector layer. No metadata. No OCR hints.
 * The redaction is physically baked into the pixels and CANNOT be undone.
 */
export const applyRedactions = async (
  pageData: any[],
  boxes: RedactionBox[],
  _mode: 'BLACKOUT' | 'SYNTHETIC' = 'BLACKOUT'
): Promise<Uint8Array> => {
  // US Letter dimensions in mm (jsPDF uses mm by default)
  const pageWidthMM = 215.9;
  const pageHeightMM = 279.4;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
    compress: true,
  });

  for (let i = 0; i < pageData.length; i++) {
    const data = pageData[i];

    // 1. Load the page preview image onto a Canvas
    const img = await loadImage(data.previewUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;

    // 2. Draw the clean page image onto the canvas
    ctx.drawImage(img, 0, 0);

    // 3. BURN: Paint black rectangles directly into the pixel buffer
    const pageBoxes = boxes.filter(b => b.page === data.pageNum);
    ctx.fillStyle = '#000000';
    pageBoxes.forEach(box => {
      const x = (box.x / 100) * canvas.width;
      const y = (box.y / 100) * canvas.height;
      const w = (box.w / 100) * canvas.width;
      const h = (box.h / 100) * canvas.height;
      ctx.fillRect(x, y - 2, w, h + 4);
    });

    // 4. Export the ALREADY-REDACTED canvas as a flat JPEG
    const redactedDataUrl = canvas.toDataURL('image/jpeg', 0.92);

    // 5. Add a new page (jsPDF creates the first page automatically)
    if (i > 0) pdf.addPage('letter', 'portrait');

    // 6. Place the flat, redacted image filling the entire page
    pdf.addImage(redactedDataUrl, 'JPEG', 0, 0, pageWidthMM, pageHeightMM, undefined, 'FAST');
  }

  // Return as Uint8Array for blob creation
  const arrayBuffer = pdf.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
};

/** Helper: loads a base64 data URL into an HTMLImageElement */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}