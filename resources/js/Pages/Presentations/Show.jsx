import React, { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import PointDexLayout from '@/Layouts/PointDexLayout';
import WebcamControllerPanel from '@/Components/WebcamControllerPanel';
import {
    ArrowLeft,
    ArrowRight,
    Play,
    Maximize,
    Minimize,
    Eye,
    EyeOff
} from 'lucide-react';

export default function PresentationShow({ presentation, settings = {} }) {
    const slides = presentation.slides_data || [
        {
            id: 1,
            title: presentation.title,
            subtitle: presentation.description || 'Gesture Controlled Presentation',
            tag: 'Yearners Group',
            bullets: [
                'PointDex Gesture Remote is active',
                'Swipe Right to advance',
                'Swipe Left to go back',
            ],
        },
    ];

    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isBlankScreen, setIsBlankScreen] = useState(false);
    const [lastActionToast, setLastActionToast] = useState(null);
    const [sessionCode, setSessionCode] = useState(null);
    const presentationRef = useRef(null);

    // Initialize Telemetry Session on mount
    useEffect(() => {
        fetch('/api/telemetry/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                presentation_id: presentation.id,
                mode: 'presentation',
                lighting_condition: 'indoor_office',
                distance_meters: 1.5,
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.session) {
                    setSessionCode(data.session.session_code);
                }
            })
            .catch((err) => console.warn('Could not start telemetry session:', err));

        return () => {
            if (sessionCode) {
                fetch('/api/telemetry/end', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ session_code: sessionCode }),
                }).catch(() => {});
            }
        };
    }, []);

    const showToast = (message, icon) => {
        setLastActionToast({ message, icon, id: Date.now() });
        setTimeout(() => {
            setLastActionToast(null);
        }, 1500);
    };

    const nextSlide = () => {
        setCurrentSlideIndex((prev) => {
            if (prev < slides.length - 1) {
                showToast('Next Slide', '👉');
                return prev + 1;
            }
            showToast('End of Deck', '🏁');
            return prev;
        });
    };

    const prevSlide = () => {
        setCurrentSlideIndex((prev) => {
            if (prev > 0) {
                showToast('Previous Slide', '👈');
                return prev - 1;
            }
            showToast('First Slide', '⏮️');
            return prev;
        });
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            presentationRef.current?.requestFullscreen?.();
            setIsFullscreen(true);
            showToast('Fullscreen Mode', '⛶');
        } else {
            document.exitFullscreen?.();
            setIsFullscreen(false);
            showToast('Exited Fullscreen', '🗗');
        }
    };

    const toggleBlank = () => {
        setIsBlankScreen((prev) => {
            const next = !prev;
            showToast(next ? 'Presentation Paused' : 'Presentation Resumed', next ? '✋' : '▶️');
            return next;
        });
    };

    // Keyboard Event Listener (receives both physical keys and GestureEngine synthetic events)
    useEffect(() => {
        const handleKeyDown = (e) => {
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
                toggleFullscreen();
            } else if (e.key === 'b' || e.key === 'B' || e.key === 'p') {
                e.preventDefault();
                toggleBlank();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [slides.length]);

    const currentSlide = slides[currentSlideIndex] || slides[0];

    return (
        <PointDexLayout title={presentation.title}>
            <Head title={`${presentation.title} - PointDex`} />

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Center Stage: Slide Viewport + Thumbnail Tray + Control Pill (Cols 1-8) */}
                <div className="xl:col-span-8 flex flex-col space-y-4">
                    {/* Top Action Bar */}
                    <div className="clay-card-sm px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-3">
                            <span className="clay-btn-gold px-3 py-1 text-[11px] font-black">
                                Live Deck
                            </span>
                            <h1 className="text-base sm:text-lg font-black text-clay-charcoal">
                                {presentation.title}
                            </h1>
                            {sessionCode && (
                                <span className="text-[11px] font-mono text-clay-charcoal/60 hidden sm:inline">
                                    ({sessionCode})
                                </span>
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
                                <span>{isBlankScreen ? 'Resume' : 'Pause (B)'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={toggleFullscreen}
                                className="clay-btn-light px-3 py-1.5 text-xs flex items-center space-x-1.5"
                            >
                                {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                                <span>{isFullscreen ? 'Exit' : 'Fullscreen (F5)'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Main 16:9 Slide Canvas (Matches Figure 4.1 "TASK TAMER" Slide Card) */}
                    <div
                        ref={presentationRef}
                        className={`relative aspect-video w-full clay-card overflow-hidden flex flex-col justify-between p-8 sm:p-14 select-none ${
                            isFullscreen ? 'fixed inset-0 z-50 rounded-none p-16' : ''
                        }`}
                    >
                        {/* Decorative Geometric Corner Bars (Matches Figure 4.1 slide artwork) */}
                        <div className="pointer-events-none absolute -top-12 -right-12 w-56 h-56 rotate-45 bg-clay-gray/35 rounded-3xl" />
                        <div className="pointer-events-none absolute -bottom-16 -left-16 w-48 h-48 rotate-45 bg-clay-gold/20 rounded-3xl" />

                        {/* Blank / Pause Screen Overlay */}
                        {isBlankScreen && (
                            <div className="absolute inset-0 bg-clay-charcoal z-30 flex flex-col items-center justify-center text-clay-cream">
                                <EyeOff className="w-10 h-10 text-clay-gold mb-3" />
                                <span className="text-lg font-black">Presentation Paused</span>
                                <span className="text-xs text-clay-gray mt-1">
                                    Press 'B' or click Resume to continue
                                </span>
                            </div>
                        )}

                        {/* Gesture Action Toast */}
                        {lastActionToast && (
                            <div className="absolute top-5 right-5 z-40 clay-btn-dark px-4 py-2 text-xs font-bold flex items-center space-x-2 border border-clay-gold">
                                <span>{lastActionToast.icon}</span>
                                <span>{lastActionToast.message}</span>
                            </div>
                        )}

                        {/* Slide Top Subtitle / Group Tag */}
                        <div className="relative z-10 flex items-center justify-between">
                            <span className="px-3 py-1 rounded-full bg-clay-charcoal text-clay-cream text-[11px] font-bold tracking-wider uppercase">
                                {currentSlide.tag || 'Yearners Group'}
                            </span>
                            <span className="text-xs font-mono font-bold text-clay-charcoal/60">
                                Slide {currentSlideIndex + 1} / {slides.length}
                            </span>
                        </div>

                        {/* Slide Main Center Content */}
                        <div className="relative z-10 my-auto py-4 text-center max-w-2xl mx-auto">
                            <h2 className="text-3xl sm:text-5xl font-black text-clay-charcoal tracking-tight uppercase">
                                {currentSlide.title}
                            </h2>
                            <div className="w-24 h-1.5 rounded-full bg-clay-gold mx-auto my-3" />

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
                                            <span className="w-2.5 h-2.5 rounded-full bg-clay-gold border border-clay-charcoal flex-shrink-0" />
                                            <span>{bullet}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Slide Footer */}
                        <div className="relative z-10 flex items-center justify-between pt-3 border-t border-clay-gray/50 text-[11px] font-semibold text-clay-charcoal/60">
                            <span>PointDex Optical Presenter</span>
                            <span>Swipe Left / Right to Navigate</span>
                        </div>
                    </div>

                    {/* Slide Thumbnail Strip (Matches Figure 4.1 Horizontal Tray) */}
                    <div className="bg-clay-charcoal rounded-2xl p-3.5 shadow-lg">
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
                                                ? 'bg-clay-cream ring-3 ring-clay-gold scale-[1.02] shadow-md'
                                                : 'bg-clay-cream/90 opacity-75 hover:opacity-100'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-clay-charcoal text-clay-cream">
                                                {idx + 1}
                                            </span>
                                            {isActive && (
                                                <span className="w-2 h-2 rounded-full bg-clay-gold" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-black text-clay-charcoal leading-tight line-clamp-2 uppercase">
                                                {slide.title}
                                            </div>
                                            <div className="text-[9px] text-clay-charcoal/65 truncate mt-0.5">
                                                {slide.tag || 'Slide'}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom Centered Navigation Pill: ← ▶ → (Matches Figure 4.1 Bottom Pill) */}
                    <div className="flex justify-center pt-1">
                        <div className="clay-card-sm px-5 py-2 inline-flex items-center space-x-5">
                            <button
                                type="button"
                                onClick={prevSlide}
                                disabled={currentSlideIndex === 0}
                                className="clay-btn-light p-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Previous Slide (ArrowLeft)"
                            >
                                <ArrowLeft className="w-4 h-4 text-clay-charcoal" />
                            </button>

                            <button
                                type="button"
                                onClick={toggleFullscreen}
                                className="clay-btn-gold p-2.5"
                                title="Present Fullscreen (F5)"
                            >
                                <Play className="w-4 h-4 fill-clay-charcoal text-clay-charcoal" />
                            </button>

                            <button
                                type="button"
                                onClick={nextSlide}
                                disabled={currentSlideIndex === slides.length - 1}
                                className="clay-btn-light p-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Next Slide (ArrowRight)"
                            >
                                <ArrowRight className="w-4 h-4 text-clay-charcoal" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Optical Controller Panel (Cols 9-12) */}
                <div className="xl:col-span-4">
                    <WebcamControllerPanel
                        settings={settings}
                        sessionCode={sessionCode}
                    />
                </div>
            </div>
        </PointDexLayout>
    );
}