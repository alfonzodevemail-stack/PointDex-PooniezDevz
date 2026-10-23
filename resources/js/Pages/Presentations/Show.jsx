import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import PointDexLayout from '@/Layouts/PointDexLayout';
import WebcamControllerPanel from '@/Components/WebcamControllerPanel';
import PresentationSourceModal from '@/Components/PresentationSourceModal';
import {
    PdfDeck,
    PptxDeck,
    ImageSlide,
    PdfThumbnail,
    PptxThumbnail,
    PptxThumbnailSource,
} from '@/Components/DeckRenderers';
import { loadPdf, releaseAssets } from '@/Services/AssetLoader';
import {
    ArrowLeft,
    ArrowRight,
    Play,
    Eye,
    EyeOff,
    Hand,
    X,
    Plus,
    Replace,
    Loader2,
    AlertTriangle,
    GripVertical
} from 'lucide-react';

export default function PresentationShow({ presentation, assets: initialAssets = [], settings = {} }) {
    const [assets, setAssets] = useState(initialAssets);
    const [slides, setSlides] = useState(presentation.slides_data || []);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isPresenting, setIsPresenting] = useState(false);
    const [isBlankScreen, setIsBlankScreen] = useState(false);
    const [lastActionToast, setLastActionToast] = useState(null);
    const [sessionCode, setSessionCode] = useState(null);
    const [gestureStatus, setGestureStatus] = useState({ camera: 'offline', hand: 'none', error: null });
    const [sourceModal, setSourceModal] = useState(null); // 'add' | 'replace'
    const [pptxNodes, setPptxNodes] = useState({});
    const [failedAssetIds, setFailedAssetIds] = useState([]);
    const [dragKey, setDragKey] = useState(null);
    const [dropIndex, setDropIndex] = useState(null);
    const [pendingRemoveKey, setPendingRemoveKey] = useState(null);

    const slideCountRef = useRef(slides.length);
    slideCountRef.current = slides.length;
    const isPresentingRef = useRef(isPresenting);
    isPresentingRef.current = isPresenting;
    const toastTimerRef = useRef(null);
    const reportedAssetIds = useRef(new Set());

    const assetsById = useMemo(() => Object.fromEntries(assets.map((a) => [a.id, a])), [assets]);
    const currentSlide = slides[currentSlideIndex] || null;
    const totalSlides = slides.length;

    // Fresh props arrive after adding or replacing content.
    useEffect(() => {
        setAssets(initialAssets);
        setSlides(presentation.slides_data || []);
    }, [initialAssets, presentation.slides_data]);

    useEffect(() => {
        setCurrentSlideIndex((prev) => Math.min(prev, Math.max(slides.length - 1, 0)));
    }, [slides.length]);

    useEffect(() => releaseAssets, []);

    useEffect(() => {
        window.axios.post('/telemetry/start', {
            presentation_id: presentation.id,
            mode: 'presentation',
        })
            .then(({ data }) => {
                if (data.success && data.session) {
                    setSessionCode(data.session.session_code);
                }
            })
            .catch(() => {});
    }, []);

    const showToast = (message) => {
        setLastActionToast(message);
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => {
            setLastActionToast(null);
        }, 1400);
    };

    const applyContent = useCallback((data) => {
        setSlides(data.slides);
        setAssets(data.assets);
    }, []);

    /* ---------- Page counting for newly added PDF / PowerPoint files ---------- */

    const reportPageCount = useCallback((asset, pageCount) => {
        if (asset.page_count != null || reportedAssetIds.current.has(asset.id)) return;
        reportedAssetIds.current.add(asset.id);
        window.axios
            .post(route('presentations.assets.ready', [presentation.id, asset.id]), { page_count: pageCount })
            .then(({ data }) => applyContent(data))
            .catch(() => reportedAssetIds.current.delete(asset.id));
    }, [presentation.id, applyContent]);

    const markAssetFailed = useCallback((asset) => {
        setFailedAssetIds((prev) => (prev.includes(asset.id) ? prev : [...prev, asset.id]));
    }, []);

    useEffect(() => {
        assets
            .filter((asset) => asset.type === 'pdf' && asset.page_count == null)
            .forEach((asset) => {
                loadPdf(asset.url)
                    .then((doc) => reportPageCount(asset, doc.numPages))
                    .catch(() => markAssetFailed(asset));
            });
    }, [assets, reportPageCount, markAssetFailed]);

    const handlePptxReady = useCallback((asset, nodes) => {
        setPptxNodes((prev) => ({ ...prev, [asset.id]: nodes }));
        reportPageCount(asset, nodes.length);
    }, [reportPageCount]);

    /* ---------- Navigation ---------- */

    const nextSlide = useCallback(() => {
        setCurrentSlideIndex((prev) => {
            if (prev < slideCountRef.current - 1) {
                showToast('Next Slide');
                return prev + 1;
            }
            showToast('Last slide');
            return prev;
        });
    }, []);

    const prevSlide = useCallback(() => {
        setCurrentSlideIndex((prev) => {
            if (prev > 0) {
                showToast('Previous Slide');
                return prev - 1;
            }
            showToast('First slide');
            return prev;
        });
    }, []);

    // The stage always fills the window via CSS. Browsers only allow real fullscreen
    // right after a click or key press, so a gesture-triggered start may stay windowed.
    const enterPresenting = useCallback(() => {
        setIsPresenting(true);
        document.documentElement.requestFullscreen?.().catch(() => {});
    }, []);

    const exitPresenting = useCallback(() => {
        setIsPresenting(false);
        if (document.fullscreenElement) {
            document.exitFullscreen?.().catch(() => {});
        }
    }, []);

    const togglePresenting = useCallback(() => {
        if (isPresentingRef.current) {
            exitPresenting();
        } else {
            enterPresenting();
        }
    }, [enterPresenting, exitPresenting]);

    const toggleBlank = useCallback(() => {
        setIsBlankScreen((prev) => !prev);
    }, []);

    useEffect(() => {
        // Leaving browser fullscreen (Esc) also leaves presenter mode.
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) setIsPresenting(false);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Gestures are handled through onGesture; skip the synthetic key events they also emit.
            if (!e.isTrusted || sourceModal) return;
            if (['input', 'textarea', 'select'].includes(document.activeElement?.tagName?.toLowerCase())) {
                return;
            }

            if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
                e.preventDefault();
                nextSlide();
            } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                e.preventDefault();
                prevSlide();
            } else if (e.key === 'F5' || e.key === 'f') {
                e.preventDefault();
                togglePresenting();
            } else if (e.key === 'Escape' && isPresentingRef.current) {
                exitPresenting();
            } else if (e.key === 'b' || e.key === 'B') {
                e.preventDefault();
                toggleBlank();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextSlide, prevSlide, togglePresenting, exitPresenting, toggleBlank, sourceModal]);

    const handleGesture = useCallback((gesture) => {
        switch (gesture.type) {
            case 'swipe_right':
                nextSlide();
                break;
            case 'swipe_left':
                prevSlide();
                break;
            case 'fist':
                togglePresenting();
                break;
            case 'open_palm':
                toggleBlank();
                break;
        }
    }, [nextSlide, prevSlide, togglePresenting, toggleBlank]);

    // The camera reports status every frame; only re-render when something changed.
    const handleGestureStatus = useCallback((status) => {
        setGestureStatus((prev) => {
            const next = { ...prev, ...status };
            return next.camera === prev.camera && next.hand === prev.hand && next.error === prev.error
                ? prev
                : next;
        });
    }, []);

    /* ---------- Editing: reorder and remove ---------- */

    const moveSlide = (key, insertAt) => {
        const from = slides.findIndex((s) => s.key === key);
        if (from === -1 || insertAt == null) return;
        const to = insertAt > from ? insertAt - 1 : insertAt;
        if (to === from) return;

        const previous = slides;
        const reordered = [...slides];
        const [moved] = reordered.splice(from, 1);
        reordered.splice(to, 0, moved);

        const currentKey = currentSlide?.key;
        setSlides(reordered);
        setCurrentSlideIndex(Math.max(reordered.findIndex((s) => s.key === currentKey), 0));

        window.axios
            .put(route('presentations.slides.reorder', presentation.id), { order: reordered.map((s) => s.key) })
            .catch(() => {
                setSlides(previous);
                showToast('Could not save the new order');
            });
    };

    const removeSlide = (key) => {
        setPendingRemoveKey(null);
        window.axios
            .delete(route('presentations.slides.destroy', [presentation.id, key]))
            .then(({ data }) => applyContent(data))
            .catch(() => showToast('Could not remove the slide'));
    };

    const removeAsset = (asset) => {
        window.axios
            .delete(route('presentations.assets.destroy', [presentation.id, asset.id]))
            .then(({ data }) => applyContent(data))
            .catch(() => showToast('Could not remove the file'));
    };

    const handleDragOver = (e, index) => {
        if (!dragKey) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const rect = e.currentTarget.getBoundingClientRect();
        setDropIndex(e.clientX < rect.left + rect.width / 2 ? index : index + 1);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        moveSlide(dragKey, dropIndex);
        setDragKey(null);
        setDropIndex(null);
    };

    /* ---------- Rendering ---------- */

    const readyAssets = assets.filter((a) => a.page_count != null);
    const handVisible = gestureStatus.hand === 'detected';
    const fileSummary = assets.map((a) => a.original_filename).filter(Boolean).join(' · ');

    const renderStage = () => {
        if (!currentSlide) {
            return (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-black text-clay-cream p-6 space-y-3">
                    <span className="text-sm font-bold">This presentation has no slides yet.</span>
                    <button
                        type="button"
                        onClick={() => setSourceModal('add')}
                        className="clay-btn-gold px-4 py-2 text-xs inline-flex items-center space-x-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add content</span>
                    </button>
                </div>
            );
        }

        const placeholderAsset = currentSlide.page === null ? assetsById[currentSlide.asset_id] : null;

        // Every file stays mounted so switching between them mid-presentation is instant.
        return (
            <>
                {readyAssets.map((asset) => {
                    const isActive = !placeholderAsset && currentSlide.asset_id === asset.id;
                    const page = isActive ? currentSlide.page : null;
                    return (
                        <div key={asset.id} className={isActive ? 'absolute inset-0' : 'hidden'}>
                            {asset.type === 'pdf' && <PdfDeck url={asset.url} slideIndex={page} />}
                            {asset.type === 'pptx' && <PptxDeck url={asset.url} slideIndex={page} />}
                            {asset.type === 'image' && <ImageSlide url={asset.url} alt={asset.original_filename || 'Slide'} />}
                        </div>
                    );
                })}
                {placeholderAsset && (
                    <div className="absolute inset-0 bg-black">{renderPlaceholder(placeholderAsset, false)}</div>
                )}
            </>
        );
    };

    // A PDF / PowerPoint still being read holds its place with one placeholder slide.
    const renderPlaceholder = (asset, compact) => {
        const failed = failedAssetIds.includes(asset.id);
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 text-clay-cream gap-1">
                {failed ? (
                    <>
                        <AlertTriangle className={compact ? 'w-4 h-4 text-clay-gold' : 'w-8 h-8 text-clay-gold'} />
                        <span className={`${compact ? 'text-[10px]' : 'text-sm'} font-bold leading-tight`}>
                            Couldn't read {asset.original_filename}
                        </span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeAsset(asset);
                            }}
                            className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold underline text-clay-gold`}
                        >
                            Remove
                        </button>
                    </>
                ) : (
                    <>
                        <Loader2 className={`animate-spin text-clay-gold ${compact ? 'w-4 h-4' : 'w-8 h-8'}`} />
                        <span className={`${compact ? 'text-[10px]' : 'text-sm'} font-bold leading-tight truncate max-w-full`}>
                            Preparing {asset.original_filename}...
                        </span>
                    </>
                )}
            </div>
        );
    };

    const renderThumbnail = (slide) => {
        const asset = assetsById[slide.asset_id];
        if (!asset) return null;
        if (slide.page === null) return renderPlaceholder(asset, true);
        if (asset.type === 'image') {
            return (
                <img
                    src={asset.url}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-contain"
                />
            );
        }
        if (asset.type === 'pdf') {
            return <PdfThumbnail url={asset.url} page={slide.page} />;
        }
        return <PptxThumbnail node={pptxNodes[asset.id]?.[slide.page] || null} />;
    };

    return (
        <PointDexLayout title={presentation.title}>
            <Head title={`${presentation.title} - PointDex`} />

            {/* Off-screen PowerPoint renderers that feed the thumbnails */}
            {assets
                .filter((asset) => asset.type === 'pptx')
                .map((asset) => (
                    <PptxThumbnailSource
                        key={asset.id}
                        asset={asset}
                        onReady={handlePptxReady}
                        onError={markAssetFailed}
                    />
                ))}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-8 flex flex-col space-y-4">
                    {/* Top Bar */}
                    <div className="clay-card-sm px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                            <h1 className="text-base sm:text-lg font-black text-clay-charcoal truncate">
                                {presentation.title}
                            </h1>
                            {fileSummary && (
                                <p className="text-[11px] font-semibold text-clay-charcoal/60 truncate">
                                    {fileSummary}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                type="button"
                                onClick={toggleBlank}
                                className={`px-3 py-1.5 text-xs flex items-center space-x-1.5 ${
                                    isBlankScreen ? 'clay-btn-gold' : 'clay-btn-light'
                                }`}
                            >
                                {isBlankScreen ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                <span>{isBlankScreen ? 'Resume' : 'Pause'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSourceModal('replace')}
                                title="Replace the file or link"
                                className="clay-btn-light px-3 py-1.5 text-xs flex items-center space-x-1.5"
                            >
                                <Replace className="w-3.5 h-3.5" />
                                <span>Replace</span>
                            </button>
                        </div>
                    </div>

                    {/* Slide Display */}
                    <div
                        className={`select-none overflow-hidden ${
                            isPresenting
                                ? 'fixed inset-0 z-50 bg-black'
                                : 'relative aspect-video w-full clay-card'
                        }`}
                    >
                        {renderStage()}

                        {isBlankScreen && (
                            <div className="absolute inset-0 bg-clay-charcoal z-30 flex flex-col items-center justify-center text-clay-cream">
                                <EyeOff className="w-10 h-10 text-clay-gold mb-3" />
                                <span className="text-lg font-black">Presentation Paused</span>
                                <span className="text-xs text-clay-gray mt-1">
                                    Hold an open palm, click Resume, or press B to continue
                                </span>
                            </div>
                        )}

                        {lastActionToast && (
                            <div className="absolute top-4 right-4 z-40 clay-btn-dark px-3.5 py-1.5 text-xs font-bold border border-clay-gold">
                                {lastActionToast}
                            </div>
                        )}

                        {isPresenting && (
                            <div className="absolute bottom-4 left-4 right-4 z-40 flex items-end justify-between pointer-events-none">
                                <div className="flex items-center space-x-2 rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-bold text-white">
                                    <Hand className={`w-3.5 h-3.5 ${handVisible ? 'text-clay-gold' : 'text-white/50'}`} />
                                    <span>
                                        {gestureStatus.camera === 'online'
                                            ? handVisible ? 'Hand detected' : 'Show your hand to the camera'
                                            : gestureStatus.camera === 'error'
                                            ? 'Camera unavailable: use arrow keys'
                                            : 'Camera starting...'}
                                    </span>
                                </div>

                                <div className="flex items-center space-x-2 pointer-events-auto">
                                    <span className="rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-mono font-bold text-white">
                                        {Math.min(currentSlideIndex + 1, totalSlides)} / {totalSlides}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={exitPresenting}
                                        title="Exit (Esc)"
                                        className="rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Slide Previews: click to jump, drag to reorder */}
                    <div className="bg-clay-charcoal rounded-2xl p-3.5 shadow-lg">
                        <div className="flex items-center justify-between mb-2.5 px-0.5">
                            <span className="text-[11px] font-extrabold text-clay-cream">
                                Slides <span className="font-mono text-clay-cream/60">({totalSlides})</span>
                            </span>
                            <span className="text-[10px] font-semibold text-clay-cream/50">
                                Drag slides to change the order
                            </span>
                        </div>

                        <div
                            className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]"
                            onDragLeave={(e) => {
                                if (!e.currentTarget.contains(e.relatedTarget)) setDropIndex(null);
                            }}
                        >
                            {slides.map((slide, idx) => {
                                const isActive = currentSlideIndex === idx;
                                const isDragged = dragKey === slide.key;
                                return (
                                    <div
                                        key={slide.key}
                                        draggable
                                        onDragStart={(e) => {
                                            setDragKey(slide.key);
                                            setPendingRemoveKey(null);
                                            e.dataTransfer.effectAllowed = 'move';
                                            e.dataTransfer.setData('text/plain', slide.key);
                                        }}
                                        onDragEnd={() => {
                                            setDragKey(null);
                                            setDropIndex(null);
                                        }}
                                        onDragOver={(e) => handleDragOver(e, idx)}
                                        onDrop={handleDrop}
                                        onClick={() => setCurrentSlideIndex(idx)}
                                        className={`group relative aspect-video rounded-xl overflow-hidden bg-black cursor-pointer transition-all ${
                                            isActive
                                                ? 'ring-[3px] ring-clay-gold shadow-md'
                                                : 'ring-1 ring-clay-cream/10 opacity-80 hover:opacity-100'
                                        } ${isDragged ? 'opacity-30' : ''}`}
                                    >
                                        {renderThumbnail(slide)}

                                        {dropIndex === idx && dragKey && (
                                            <span className="absolute inset-y-0 left-0 w-1.5 bg-clay-gold rounded-full z-20" />
                                        )}
                                        {dropIndex === idx + 1 && idx === slides.length - 1 && dragKey && (
                                            <span className="absolute inset-y-0 right-0 w-1.5 bg-clay-gold rounded-full z-20" />
                                        )}

                                        <span className="absolute top-1.5 right-1.5 z-10 min-w-[1.5rem] px-1.5 py-0.5 rounded-md bg-clay-charcoal/85 text-clay-cream text-[10px] font-mono font-bold text-center">
                                            {idx + 1}
                                        </span>

                                        <GripVertical className="absolute top-1.5 left-1.5 z-10 w-4 h-4 text-white/70 drop-shadow opacity-0 group-hover:opacity-100" />

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPendingRemoveKey(slide.key);
                                            }}
                                            title="Remove slide"
                                            className="absolute bottom-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-clay-charcoal/85 text-clay-cream flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>

                                        {pendingRemoveKey === slide.key && (
                                            <div
                                                className="absolute inset-0 z-30 bg-clay-charcoal/90 flex flex-col items-center justify-center gap-1.5"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <span className="text-[11px] font-bold text-clay-cream">Remove this slide?</span>
                                                <div className="flex gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSlide(slide.key)}
                                                        className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[10px] font-bold"
                                                    >
                                                        Remove
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPendingRemoveKey(null)}
                                                        className="px-2.5 py-1 rounded-lg bg-clay-cream text-clay-charcoal text-[10px] font-bold"
                                                    >
                                                        Keep
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            <button
                                type="button"
                                onClick={() => setSourceModal('add')}
                                onDragOver={(e) => {
                                    if (!dragKey) return;
                                    e.preventDefault();
                                    setDropIndex(slides.length);
                                }}
                                onDrop={handleDrop}
                                className="aspect-video rounded-xl border-2 border-dashed border-clay-gold/60 text-clay-gold hover:bg-clay-gold/10 flex flex-col items-center justify-center gap-1 transition-colors"
                            >
                                <Plus className="w-6 h-6" />
                                <span className="text-[11px] font-black">ADD</span>
                                <span className="text-[9px] font-semibold text-clay-cream/50">Slides or pictures</span>
                            </button>
                        </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="flex justify-center pt-1">
                        <div className="clay-card-sm px-5 py-2 inline-flex items-center space-x-5">
                            <button
                                type="button"
                                onClick={prevSlide}
                                disabled={currentSlideIndex === 0}
                                className="clay-btn-light p-2 disabled:opacity-40"
                            >
                                <ArrowLeft className="w-4 h-4 text-clay-charcoal" />
                            </button>

                            <button
                                type="button"
                                onClick={enterPresenting}
                                title="Start presenting"
                                disabled={totalSlides === 0}
                                className="clay-btn-gold p-2.5 disabled:opacity-40"
                            >
                                <Play className="w-4 h-4 fill-clay-charcoal text-clay-charcoal" />
                            </button>

                            <button
                                type="button"
                                onClick={nextSlide}
                                disabled={currentSlideIndex >= totalSlides - 1}
                                className="clay-btn-light p-2 disabled:opacity-40"
                            >
                                <ArrowRight className="w-4 h-4 text-clay-charcoal" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Webcam Panel */}
                <div className="xl:col-span-4">
                    <WebcamControllerPanel
                        settings={settings}
                        sessionCode={sessionCode}
                        onGesture={handleGesture}
                        onStatus={handleGestureStatus}
                    />
                </div>
            </div>

            {sourceModal && (
                <PresentationSourceModal
                    mode={sourceModal}
                    presentationId={presentation.id}
                    onClose={() => setSourceModal(null)}
                />
            )}
        </PointDexLayout>
    );
}
