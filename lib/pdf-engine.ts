export interface TextToken {
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
    startIdx: number; // ADD THIS
    endIdx: number;   // ADD THIS
    pageWidth: number;
    pageHeight: number;
  }
  
  export const processPDF = async (file: File) => {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  
    const arrayBuffer = await file.arrayBuffer();
    const safeCopy = new Uint8Array(arrayBuffer.slice(0)); 
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const pageData = [];
  
    for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });
  
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const renderViewport = page.getViewport({ scale: 3.0 }); // 3x scale for crisp print quality
      canvas.width = renderViewport.width;
      canvas.height = renderViewport.height;
      if (ctx) {
        await page.render({ canvasContext: ctx, canvas, viewport: renderViewport } as any).promise;
      }
      const previewUrl = canvas.toDataURL('image/jpeg', 0.9); // High quality JPEG
  
      let currentFullText = "";
      const items: TextToken[] = textContent.items.map((item: any) => {
        const text = item.str;
        const startIdx = currentFullText.length;
        currentFullText += text + " ";
        const endIdx = currentFullText.length;
  
        return {
          text,
          // THE FIX: Use the raw transform values without flipping them.
          // PDF.js transform[4] is X, transform[5] is Y from the bottom.
          x: item.transform[4],
          y: item.transform[5], 
          width: item.width,
          height: item.height || 12,
          page: i,
          startIdx,
          endIdx,
          pageWidth: viewport.width,
          pageHeight: viewport.height
        };
      });
  
      pageData.push({ pageNum: i, items, fullText: currentFullText, previewUrl });
    }
  
    return { pageData, originalBytes: safeCopy };
  };