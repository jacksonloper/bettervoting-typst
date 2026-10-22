import { useEffect, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

// Renders every page of a PDF to canvases. Each new page replaces the old one
// in place as soon as it is drawn, so edits don't flicker.
export function PdfPreview({ pdf, stale }: { pdf: Uint8Array | null; stale: boolean }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!pdf || !el) return;
    let cancelled = false;
    (async () => {
      // pdf.js transfers the buffer to its worker, so give it a copy.
      const doc = await pdfjs.getDocument({ data: pdf.slice() }).promise;
      try {
        const width = Math.min(el.clientWidth - 32, 820);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        for (let i = 1; i <= doc.numPages && !cancelled; i++) {
          const page = await doc.getPage(i);
          const scale = width / page.getViewport({ scale: 1 }).width;
          const vp = page.getViewport({ scale: scale * dpr });
          const canvas = document.createElement('canvas');
          canvas.width = vp.width;
          canvas.height = vp.height;
          canvas.style.width = `${vp.width / dpr}px`;
          canvas.className = 'page';
          await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise;
          if (cancelled) return;
          const old = el.children[i - 1];
          if (old) old.replaceWith(canvas);
          else el.appendChild(canvas);
        }
        while (!cancelled && el.children.length > doc.numPages) el.lastElementChild!.remove();
      } finally {
        doc.destroy();
      }
    })().catch((e) => console.error('PDF preview failed', e));
    return () => {
      cancelled = true;
    };
  }, [pdf]);

  return <div ref={host} className={'pages' + (stale ? ' stale' : '')} />;
}
