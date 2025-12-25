import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface PdfViewerProps {
  pdfDoc: any; // PDFDocumentProxy from pdf.js
  pageNumber: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
}

const PdfViewer = ({ pdfDoc, pageNumber, totalPages, onPrevPage, onNextPage }: PdfViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null); // To hold the current render task from pdf.js
  const [renderTrigger, setRenderTrigger] = useState(0);

  // This effect sets up the resize observer.
  useEffect(() => {
    const parentElement = canvasRef.current?.parentElement;
    if (!parentElement) return;

    const resizeObserver = new ResizeObserver(() => {
      // Don't render directly. Trigger the render effect via state change.
      setRenderTrigger(t => t + 1);
    });

    resizeObserver.observe(parentElement);

    return () => {
      resizeObserver.unobserve(parentElement);
    };
  }, []); // Runs only once on mount to set up the observer.


  // This effect handles the actual rendering.
  useEffect(() => {
    if (!pdfDoc) return;

    // A flag to prevent state updates if the effect is cancelled.
    let isCancelled = false;

    // Immediately cancel any previous render that might be running.
    // This is the key to preventing the race condition.
    if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
    }

    const render = async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        
        // Check if the effect has been cleaned up while we were getting the page.
        if (isCancelled) return;

        const canvas = canvasRef.current;
        const container = canvas?.parentElement;
        if (!canvas || !container) return;

        const scale = container.clientWidth / page.getViewport({ scale: 1 }).width;
        const viewport = page.getViewport({ scale });

        const context = canvas.getContext('2d');
        if (!context) return;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };
        
        // Store the new render task and execute it.
        const task = page.render(renderContext);
        renderTaskRef.current = task;
        
        await task.promise;
        
        // If we completed without being cancelled, clear the task ref.
        if (!isCancelled) {
            renderTaskRef.current = null;
        }

      } catch (error: any) {
        // pdf.js throws a "RenderingCancelledException" when a render is cancelled.
        // We can safely ignore this error as it's part of the expected flow.
        if (error.name !== 'RenderingCancelledException') {
            console.error("Error rendering PDF page:", error);
        }
      }
    };
    
    render();

    return () => {
      isCancelled = true;
      // The cancellation is handled at the start of the next effect,
      // but we'll also do it here for good measure on unmount.
      if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
      }
    };
  }, [pdfDoc, pageNumber, renderTrigger]); // Re-run on page change or resize trigger.

  return (
    <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      <div className="flex-grow overflow-auto flex items-start justify-center p-4 bg-slate-50/50">
        <canvas ref={canvasRef} className="shadow-md" />
      </div>
      <div className="flex-shrink-0 bg-slate-100/70 p-2 flex items-center justify-center border-t border-slate-200">
        <button
          onClick={onPrevPage}
          disabled={pageNumber <= 1}
          className="p-2 rounded-full disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 hover:bg-slate-200 transition-colors"
          aria-label="Previous Page"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <span className="mx-4 font-mono text-sm text-slate-600">
          {pageNumber} / {totalPages}
        </span>
        <button
          onClick={onNextPage}
          disabled={pageNumber >= totalPages}
          className="p-2 rounded-full disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 hover:bg-slate-200 transition-colors"
          aria-label="Next Page"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default PdfViewer;
