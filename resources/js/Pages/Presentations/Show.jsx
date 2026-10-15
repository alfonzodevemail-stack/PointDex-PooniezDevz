import React, { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import PointDexLayout from '@/Layouts/PointDexLayout';
import WebcamControllerPanel from '@/Components/WebcamControllerPanel';
import { 
    ChevronLeft, 
    ChevronRight, 
    Maximize, 
    Minimize, 
    Eye, 
    EyeOff, 
    Sparkles, 
    Play, 
    RotateCcw,
    Layers,
    Share2,
    Settings,
    CheckCircle2
} from 'lucide-react';

export default function PresentationShow({ presentation, settings = {} }) {
    const slides = presentation.slides_data || [
        {
            id: 1,
            title: presentation.title,
            subtitle: presentation.description || 'Gesture Controlled Presentation',
            bullets: ['PointDex Gesture Remote is active', 'Swipe Right to advance', 'Swipe Left to go back'],
            bg_gradient: 'from-slate-900 via-indigo-950 to-slate-900'
        }
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
                distance_meters: 1.5
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.session) {
                setSessionCode(data.session.session_code);
            }
        })
        .catch(err => console.warn('Could not start telemetry session:', err));

        return () => {
            // End session on unmount
            if (sessionCode) {
                fetch('/api/telemetry/end', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ session_code: sessionCode })
                }).catch(() => {});
            }
        };
    }, []);

    const nextSlide = () => {
        setCurrentSlideIndex((prev) => {
            if (prev < slides.length - 1) {
                showToast('Next Slide', '👉');
                return prev + 1;
            }
            showToast('End of presentation', '🏁');
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
        setIsBlankScreen(prev => {
            const next = !prev;
            showToast(next ? 'Screen Blanked (Paused)' : 'Screen Resumed', next ? '⬛' : '▶️');
            return next;
        });
    };

    const showToast = (message, icon) => {
        setLastActionToast({ message, icon, id: Date.now() });
        setTimeout(() => {
            setLastActionToast(null);
        }, 1500);
    };

    // Keyboard Event Listener (handles both physical keyboard and synthesized MediaPipe events)
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Prevent interference if typing in an input
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
            <Head title={`${presentation.title} - PointDex Presentation Controller`} />

            <div 
                ref={presentationRef}
                className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 transition-all ${
                    isFullscreen ? 'fixed inset-0 z-50 bg-black max-w-none p-4 flex flex-col justify-between' : ''
                }`}
            >
                {/* Header Information Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                Live Session
                            </span>
                            {sessionCode && (
                                <span className="text-[11px] font-mono text-slate-400">
                                    ID: <span className="text-slate-200 font-semibold">{sessionCode}</span>
                                </span>
                            )}
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-white mt-1">{presentation.title}</h1>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={toggleBlank}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                                isBlankScreen ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            }`}
                        >
                            {isBlankScreen ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            <span>{isBlankScreen ? 'Resume' : 'Blank (B)'}</span>
                        </button>

                        <button
                            onClick={toggleFullscreen}
                            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
                        >
                            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen (F5)'}</span>
                        </button>

                        <Link
                            href="/presentations"
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
                        >
                            Exit
                        </Link>
                    </div>
                </div>

                {/* Main Content Layout (Matches Figure 4.1 in proposal) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left/Center Area: Active Slide Screen (Cols 1-8) */}
                    <div className="lg:col-span-8 flex flex-col space-y-4">
                        {/* Slide Display Canvas */}
                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 flex flex-col justify-between p-8 sm:p-12 select-none">
                            {/* Blank Screen Overlay */}
                            {isBlankScreen && (
                                <div className="absolute inset-0 bg-black z-30 flex flex-col items-center justify-center text-slate-500 animate-fade-in">
                                    <div className="p-4 rounded-full bg-slate-900/80 mb-2">
                                        <EyeOff className="w-8 h-8 text-amber-400" />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-400">Presentation Paused</span>
                                    <span className="text-xs text-slate-600 mt-1">Show open palm or press 'B' to resume</span>
                                </div>
                            )}

                            {/* Floating Gesture Feedback Toast */}
                            {lastActionToast && (
                                <div className="absolute top-4 right-4 z-40 bg-indigo-600/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg border border-indigo-400/30 flex items-center space-x-2 animate-bounce">
                                    <span>{lastActionToast.icon}</span>
                                    <span>{lastActionToast.message}</span>
                                </div>
                            )}

                            {/* Background Gradient Accent */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${currentSlide.bg_gradient || 'from-slate-900 via-indigo-950 to-slate-900'} opacity-75`} />

                            {/* Slide Content Header */}
                            <div className="relative z-10 flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                                    {currentSlide.tag || `Slide ${currentSlideIndex + 1}`}
                                </span>
                                <span className="text-xs font-mono text-slate-400">
                                    {currentSlideIndex + 1} / {slides.length}
                                </span>
                            </div>

                            {/* Slide Body */}
                            <div className="relative z-10 my-auto py-6">
                                <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                                    {currentSlide.title}
                                </h2>
                                {currentSlide.subtitle && (
                                    <p className="text-base sm:text-xl text-slate-300 mt-2 font-medium">
                                        {currentSlide.subtitle}
                                    </p>
                                )}

                                {currentSlide.content && (
                                    <p className="text-sm sm:text-base text-slate-400 mt-4 max-w-xl">
                                        {currentSlide.content}
                                    </p>
                                )}

                                {currentSlide.bullets && currentSlide.bullets.length > 0 && (
                                    <ul className="mt-6 space-y-2.5">
                                        {currentSlide.bullets.map((bullet, idx) => (
                                            <li key={idx} className="flex items-center space-x-3 text-slate-200 text-sm sm:text-base">
                                                <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                                                <span>{bullet}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Slide Footer */}
                            <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-800/60 text-xs text-slate-400">
                                <span>PointDex Gesture Remote</span>
                                <span>Press Arrow Keys or Swipe to navigate</span>
                            </div>
                        </div>

                        {/* Slide Navigation Controls & Thumbnails (Matches Figure 4.1 bottom carousel) */}
                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                            {/* Manual Prev / Next Buttons */}
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={prevSlide}
                                    disabled={currentSlideIndex === 0}
                                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 transition"
                                    title="Previous Slide (ArrowLeft)"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-xs font-mono font-bold text-slate-300 px-2">
                                    {currentSlideIndex + 1} of {slides.length}
                                </span>
                                <button
                                    onClick={nextSlide}
                                    disabled={currentSlideIndex === slides.length - 1}
                                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 transition"
                                    title="Next Slide (ArrowRight)"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Slide Mini Thumbnails Strip */}
                            <div className="flex items-center space-x-2 overflow-x-auto py-1 max-w-full">
                                {slides.map((slide, idx) => (
                                    <button
                                        key={slide.id || idx}
                                        onClick={() => setCurrentSlideIndex(idx)}
                                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all text-left truncate max-w-[130px] ${
                                            currentSlideIndex === idx
                                                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                                                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
                                        }`}
                                    >
                                        <div className="text-[10px] font-mono text-indigo-200">Slide {idx + 1}</div>
                                        <div className="truncate font-semibold">{slide.title}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Area: Optical Tracking & Webcam Controller Card (Cols 9-12) */}
                    <div className="lg:col-span-4">
                        <WebcamControllerPanel
                            settings={settings}
                            sessionCode={sessionCode}
                            onGesture={(g) => {
                                // Handled automatically by synthetic DOM KeyboardEvents dispatched by GestureEngine
                            }}
                        />
                    </div>
                </div>
            </div>
        </PointDexLayout>
    );
}
