import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// The slide stage, the thumbnails and the page counter all read the same files,
// so each file is downloaded and parsed once per page visit.
const pdfCache = new Map();
const bufferCache = new Map();
let pdfjsPromise = null;

function pdfjs() {
    pdfjsPromise ??= import('pdfjs-dist').then((lib) => {
        lib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
        return lib;
    });
    return pdfjsPromise;
}

function cached(cache, key, load) {
    if (!cache.has(key)) {
        const promise = load();
        promise.catch(() => cache.delete(key));
        cache.set(key, promise);
    }
    return cache.get(key);
}

export function loadPdf(url) {
    return cached(pdfCache, url, () =>
        pdfjs().then((lib) => lib.getDocument({ url, withCredentials: true }).promise),
    );
}

export function loadBuffer(url) {
    return cached(bufferCache, url, () =>
        fetch(url, { credentials: 'same-origin' }).then((response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.arrayBuffer();
        }),
    );
}

/**
 * Draw one PDF page into a canvas, scaled to fit inside maxWidth x maxHeight.
 * Returns a function that cancels the render.
 */
export function renderPdfPage(doc, pageIndex, canvas, maxWidth, maxHeight) {
    let task = null;
    let cancelled = false;

    (async () => {
        const page = await doc.getPage(Math.min(pageIndex + 1, doc.numPages));
        if (cancelled) return;

        const base = page.getViewport({ scale: 1 });
        const fit = Math.min(maxWidth / base.width, maxHeight / base.height);
        const ratio = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: fit * ratio });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(base.width * fit)}px`;
        canvas.style.height = `${Math.floor(base.height * fit)}px`;

        task = page.render({ canvas, viewport });
        await task.promise.catch(() => {});
    })().catch(() => {});

    return () => {
        cancelled = true;
        task?.cancel();
    };
}

export function releaseAssets() {
    for (const promise of pdfCache.values()) {
        promise.then((doc) => doc.destroy()).catch(() => {});
    }
    pdfCache.clear();
    bufferCache.clear();
}
