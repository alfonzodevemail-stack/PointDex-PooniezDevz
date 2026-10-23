import React, { useEffect, useRef, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { loadBuffer, loadPdf, renderPdfPage } from '@/Services/AssetLoader';

// Tracks the pixel size of an element so slides can be scaled to fit it.
export function useElementSize(ref) {
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!ref.current) return;
        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            setSize({ width: Math.floor(width), height: Math.floor(height) });
        });
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return size;
}

function DeckStatus({ loading, error }) {
    if (error) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-clay-cream space-y-2">
                <AlertTriangle className="w-8 h-8 text-clay-gold" />
                <span className="text-sm font-bold">{error}</span>
            </div>
        );
    }
    if (loading) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-clay-cream space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-clay-gold" />
                <span className="text-xs font-semibold">Loading slide...</span>
            </div>
        );
    }
    return null;
}

// slideIndex is null while this file is not the one on screen; the last page stays rendered.
export function PdfDeck({ url, slideIndex }) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const { width, height } = useElementSize(containerRef);
    const [pdf, setPdf] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        loadPdf(url)
            .then((doc) => !cancelled && setPdf(doc))
            .catch((e) => {
                console.error(e);
                if (!cancelled) setError('Could not open this PDF.');
            });
        return () => {
            cancelled = true;
        };
    }, [url]);

    useEffect(() => {
        if (!pdf || !width || !height || slideIndex == null) return;
        return renderPdfPage(pdf, slideIndex, canvasRef.current, width, height);
    }, [pdf, slideIndex, width, height]);

    return (
        <div ref={containerRef} className="absolute inset-0 flex items-center justify-center bg-black">
            <canvas ref={canvasRef} className="block shadow-lg" />
            <DeckStatus loading={!pdf} error={error} />
        </div>
    );
}

// pptx-preview lays slides out at a fixed pixel size; the stage is then scaled to fit.
const PPTX_WIDTH = 960;
const PPTX_HEIGHT = 540;

export function PptxDeck({ url, slideIndex }) {
    const containerRef = useRef(null);
    const hostRef = useRef(null);
    const previewerRef = useRef(null);
    const renderedIndexRef = useRef(null);
    const { width, height } = useElementSize(containerRef);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const host = hostRef.current;
        renderedIndexRef.current = null;

        (async () => {
            try {
                const [{ init }, buffer] = await Promise.all([import('pptx-preview'), loadBuffer(url)]);
                if (cancelled) return;

                const previewer = init(host, { width: PPTX_WIDTH, height: PPTX_HEIGHT, mode: 'slide' });
                await previewer.load(buffer);
                if (cancelled) return;

                previewerRef.current = previewer;
                setReady(true);
            } catch (e) {
                console.error(e);
                if (!cancelled) {
                    setError('Could not render this PowerPoint file. Try saving it as PDF in PowerPoint and uploading that.');
                }
            }
        })();

        return () => {
            cancelled = true;
            previewerRef.current = null;
            host.innerHTML = '';
        };
    }, [url]);

    useEffect(() => {
        const previewer = previewerRef.current;
        if (!ready || !previewer || slideIndex == null) return;
        const index = Math.min(slideIndex, previewer.slideCount - 1);
        if (index !== renderedIndexRef.current) {
            previewer.renderSingleSlide(index);
            renderedIndexRef.current = index;
        }
    }, [ready, slideIndex]);

    const scale = width && height ? Math.min(width / PPTX_WIDTH, height / PPTX_HEIGHT) : 1;

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-black">
            <div
                ref={hostRef}
                className="absolute left-1/2 top-1/2 pointer-events-none [&_.pptx-preview-wrapper]:!overflow-hidden"
                style={{
                    width: PPTX_WIDTH,
                    height: PPTX_HEIGHT,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                }}
            />
            <DeckStatus loading={!ready} error={error} />
        </div>
    );
}

export function ImageSlide({ url, alt }) {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
            <img src={url} alt={alt} className="max-w-full max-h-full object-contain" draggable={false} />
        </div>
    );
}

/* ---------- Thumbnails ---------- */

export function PdfThumbnail({ url, page }) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const { width, height } = useElementSize(containerRef);

    useEffect(() => {
        if (!width || !height) return;
        let cancelRender = null;
        let cancelled = false;
        loadPdf(url)
            .then((doc) => {
                if (!cancelled) cancelRender = renderPdfPage(doc, page, canvasRef.current, width, height);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
            cancelRender?.();
        };
    }, [url, page, width, height]);

    return (
        <div ref={containerRef} className="absolute inset-0 flex items-center justify-center">
            <canvas ref={canvasRef} className="block" />
        </div>
    );
}

/**
 * Renders every slide of a PowerPoint once, off screen, and hands the slide elements
 * to the thumbnails (and the slide count to the page).
 */
export function PptxThumbnailSource({ asset, onReady, onError }) {
    const hostRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        const hostEl = hostRef.current;

        (async () => {
            try {
                const [{ init }, buffer] = await Promise.all([import('pptx-preview'), loadBuffer(asset.url)]);
                if (cancelled) return;

                const previewer = init(hostEl, { width: PPTX_WIDTH, mode: 'list' });
                await previewer.preview(buffer);
                if (cancelled) return;

                const nodes = Array.from({ length: previewer.slideCount }, (_, i) =>
                    hostEl.querySelector(`.pptx-preview-slide-wrapper-${i}`),
                );
                onReady(asset, nodes);
            } catch (e) {
                console.error(e);
                if (!cancelled) onError(asset);
            }
        })();

        return () => {
            cancelled = true;
            hostEl.innerHTML = '';
        };
    }, [asset.url]);

    return (
        <div
            ref={hostRef}
            aria-hidden="true"
            className="fixed pointer-events-none opacity-0"
            style={{ left: -20000, top: 0, width: PPTX_WIDTH }}
        />
    );
}

export function PptxThumbnail({ node }) {
    const slotRef = useRef(null);
    const innerRef = useRef(null);
    const { width, height } = useElementSize(slotRef);

    useEffect(() => {
        const inner = innerRef.current;
        if (!node || !inner) return;
        node.style.margin = '0';
        inner.appendChild(node);
        return () => {
            if (node.parentNode === inner) inner.removeChild(node);
        };
    }, [node]);

    const nodeWidth = parseFloat(node?.style.width) || PPTX_WIDTH;
    const nodeHeight = parseFloat(node?.style.height) || PPTX_HEIGHT;
    const scale = width && height ? Math.min(width / nodeWidth, height / nodeHeight) : 0;

    return (
        <div ref={slotRef} className="absolute inset-0 overflow-hidden">
            <div
                ref={innerRef}
                className="absolute left-1/2 top-1/2 pointer-events-none"
                style={{
                    width: nodeWidth,
                    height: nodeHeight,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                }}
            />
            {!node && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-clay-gold" />
                </div>
            )}
        </div>
    );
}
