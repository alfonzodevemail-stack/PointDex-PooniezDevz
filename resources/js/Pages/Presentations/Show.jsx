import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import PointDexLayout from '@/Layouts/PointDexLayout';
import WebcamControllerPanel from '@/Components/WebcamControllerPanel';
import { PdfDeck, PptxDeck } from '@/Components/DeckRenderers';
import {
    ArrowLeft,
    ArrowRight,
    Play,
    Maximize,
    Minimize,
    Eye,
    EyeOff,
    Hand,
    X
} from 'lucide-react';

export default function PresentationShow({ presentation, fileUrl = null, settings = {} }) {
    const sourceType = fileUrl ? presentation.source_type : 'slides';

    const slides = presentation.slides_data || [
        {
            id: 1,
            title: presentation.title,
            subtitle: presentation.description || '',
            tag: 'Slide 1',
            bullets: ['Use hand gestures or arrow keys to navigate slides.'],
        },
    ];

    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [slideCount, setSlideCount] = useState(sourceType === 'slides' ? slides.length : 0);
    const [isPresenting, setIsPresenting] = useState(false);
    const [isBlankScreen, setIsBlankScreen] = useState(false);
    const [lastActionToast, setLastActionToast] = useState(null);
    const [sessionCode, setSessionCode] = useState(null);
    const [gestureStatus, setGestureStatus] = useState({ camera: 'offline', hand: 'none', error: null });

    const slideCountRef = useRef(slideCount);
    slideCountRef.current = slideCount;
    const isPresentingRef = useRef(isPresenting);
    isPresentingRef.current = isPresenting;
    const toastTimerRef = useRef(null);

    useEffect(() => {
        fetch('/api/telemetry/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                presentation_id: presentation.id,
                mode: 'presentation',
            }),
        })
            .then((res) => res.json())
            .then((data) => {
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
            if (!e.isTrusted) return;
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
    }, [nextSlide, prevSlide, togglePresenting, exitPresenting, toggleBlank]);

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

    const handleDeckLoaded = useCallback((count) => {
        setSlideCount(count);
        setCurrentSlideIndex((prev) => Math.min(prev, Math.max(count - 1, 0)));
    }, []);

    const currentSlide = slides[currentSlideIndex] || slides[0];
    const totalSlides = Math.max(slideCount, 1);
    const handVisible = gestureStatus.hand === 'detected';

    const renderSlideContent = () => {
        if (sourceType === 'pdf') {
            return <PdfDeck url={fileUrl} slideIndex={currentSlideIndex} onLoad={handleDeckLoaded} />;
        }
        if (sourceType === 'pptx') {
            return <PptxDeck url={fileUrl} slideIndex={currentSlideIndex} onLoad={handleDeckLoaded} />;
        }

        return (
            <div className={`absolute inset-0 flex flex-col justify-between bg-clay-cream ${isPresenting ? 'p-16' : 'p-8 sm:p-12'}`}>
                <div className="relative z-10 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-clay-charcoal text-clay-cream text-[11px] font-bold uppercase">
                        {currentSlide.tag || 'Yearners Group'}
                    </span>
                    <span className="text-xs font-mono font-bold text-clay-charcoal/60">
                        {currentSlideIndex + 1} / {slides.length}
                    </span>
                </div>

                <div className="relative z-10 my-auto py-4 text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl sm:text-5xl font-black text-clay-charcoal tracking-tight uppercase">
                        {currentSlide.title}
                    </h2>
                    <div className="w-20 h-1 rounded-full bg-clay-gold mx-auto my-3" />

                    {currentSlide.subtitle && (
                        <p className="text-sm sm:text-base font-bold text-clay-charcoal/80">
                            {currentSlide.subtitle}
                        </p>
                    )}

                    {currentSlide.content && (
                        <p className="text-xs sm:text-sm text-clay-charcoal/70 mt-2">
                            {currentSlide.content}
                        </p>
                    )}

                    {currentSlide.bullets && currentSlide.bullets.length > 0 && (
                        <ul className="mt-5 space-y-2 text-left inline-block">
                            {currentSlide.bullets.map((bullet, idx) => (
                                <li
                                    key={idx}
                                    className="flex items-center space-x-2.5 text-clay-charcoal text-xs sm:text-sm font-semibold"
                                >
                                    <span className="w-2 h-2 rounded-full bg-clay-gold flex-shrink-0" />
                                    <span>{bullet}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="relative z-10 flex items-center justify-between pt-3 border-t border-clay-gray/50 text-[11px] font-semibold text-clay-charcoal/60">
                    <span>PointDex</span>
                    <span>Slide {currentSlideIndex + 1}</span>
                </div>
            </div>
        );
    };

    return (
        <PointDexLayout title={presentation.title}>
            <Head title={`${presentation.title} - PointDex`} />

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-8 flex flex-col space-y-4">
                    {/* Top Bar */}
                    <div className="clay-card-sm px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                            <h1 className="text-base sm:text-lg font-black text-clay-charcoal truncate">
                                {presentation.title}
                            </h1>
                            {presentation.original_filename && (
                                <p className="text-[11px] font-semibold text-clay-charcoal/60 truncate">
                                    {presentation.original_filename}
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
                                onClick={togglePresenting}
                                className="clay-btn-light px-3 py-1.5 text-xs flex items-center space-x-1.5"
                            >
                                {isPresenting ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                                <span>{isPresenting ? 'Exit' : 'Fullscreen'}</span>
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
                        {renderSlideContent()}

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
                                        {currentSlideIndex + 1} / {totalSlides}
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

                    {/* Slide Thumbnails */}
                    <div className="bg-clay-charcoal rounded-2xl p-3.5 shadow-lg">
                        {sourceType === 'slides' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {slides.map((slide, idx) => {
                                    const isActive = currentSlideIndex === idx;
                                    return (
                                        <button
                                            key={slide.id || idx}
                                            type="button"
                                            onClick={() => setCurrentSlideIndex(idx)}
                                            className={`rounded-xl p-3 text-left transition-all flex flex-col justify-between aspect-[16/10] ${
                                                isActive
                                                    ? 'bg-clay-cream ring-2 ring-clay-gold shadow-md'
                                                    : 'bg-clay-cream/90 opacity-75 hover:opacity-100'
                                            }`}
                                        >
                                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-clay-charcoal text-clay-cream w-fit">
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <div className="text-[11px] font-black text-clay-charcoal leading-tight line-clamp-2 uppercase">
                                                    {slide.title}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {Array.from({ length: slideCount }, (_, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setCurrentSlideIndex(idx)}
                                        className={`w-10 h-8 rounded-lg text-[11px] font-mono font-bold transition-all ${
                                            currentSlideIndex === idx
                                                ? 'bg-clay-gold text-clay-charcoal ring-2 ring-clay-cream'
                                                : 'bg-clay-cream/90 text-clay-charcoal opacity-75 hover:opacity-100'
                                        }`}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}
                                {slideCount === 0 && (
                                    <span className="text-xs font-semibold text-clay-cream/70 px-1 py-1.5">Loading slides...</span>
                                )}
                            </div>
                        )}
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
                                className="clay-btn-gold p-2.5"
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
        </PointDexLayout>
    );
}
