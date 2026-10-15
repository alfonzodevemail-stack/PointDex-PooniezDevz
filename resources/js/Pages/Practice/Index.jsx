import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import PointDexLayout from '@/Layouts/PointDexLayout';
import WebcamControllerPanel from '@/Components/WebcamControllerPanel';
import { 
    Hand, 
    CheckCircle2, 
    ArrowRight, 
    ArrowLeft, 
    Maximize, 
    Pause, 
    Sparkles,
    Trophy,
    RotateCcw
} from 'lucide-react';

export default function PracticeIndex({ settings = {} }) {
    const [practiceScores, setPracticeScores] = useState({
        swipe_right: 0,
        swipe_left: 0,
        fist: 0,
        open_palm: 0,
    });

    const [lastFeedback, setLastFeedback] = useState({
        gesture: null,
        message: 'Position your hand in the camera frame to begin practicing.',
        type: 'info'
    });

    const gestures = [
        {
            key: 'swipe_right',
            name: 'Swipe Right',
            icon: ArrowRight,
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/10 border-indigo-500/20',
            action: 'Next Slide (ArrowRight)',
            instructions: 'Quickly sweep your open hand from left to right.',
            goal: 5,
        },
        {
            key: 'swipe_left',
            name: 'Swipe Left',
            icon: ArrowLeft,
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10 border-cyan-500/20',
            action: 'Previous Slide (ArrowLeft)',
            instructions: 'Quickly sweep your open hand from right to left.',
            goal: 5,
        },
        {
            key: 'fist',
            name: 'Closed Fist (Hold 1.5s)',
            icon: Maximize,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/20',
            action: 'Fullscreen Toggle (F5)',
            instructions: 'Clench all fingers into a tight fist and hold steady.',
            goal: 3,
        },
        {
            key: 'open_palm',
            name: 'Open Palm (Stop Sign)',
            icon: Pause,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
            action: 'Pause / Blank Screen (B)',
            instructions: 'Hold your open hand flat and still facing the camera.',
            goal: 3,
        },
    ];

    const handleGestureDetected = (gesture) => {
        if (practiceScores.hasOwnProperty(gesture.type)) {
            setPracticeScores(prev => ({
                ...prev,
                [gesture.type]: prev[gesture.type] + 1
            }));

            setLastFeedback({
                gesture: gesture.type,
                message: `Excellent! Detected ${gesture.label} with ${gesture.latencyMs || 45}ms latency.`,
                type: 'success'
            });
        }
    };

    const resetScores = () => {
        setPracticeScores({
            swipe_right: 0,
            swipe_left: 0,
            fist: 0,
            open_palm: 0,
        });
        setLastFeedback({
            gesture: null,
            message: 'Scores reset. Ready to practice!',
            type: 'info'
        });
    };

    const totalSuccess = Object.values(practiceScores).reduce((a, b) => a + b, 0);

    return (
        <PointDexLayout title="Practice Mode">
            <Head title="Practice Mode & Calibration - PointDex" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Calibration Room
                            </span>
                            <span className="text-xs text-slate-400">Phase 2: Nonconventional Optical Input</span>
                        </div>
                        <h1 className="text-2xl font-black text-white mt-1">Gesture Training & Sensitivity Calibration</h1>
                    </div>

                    <button
                        onClick={resetScores}
                        className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Practice Scores</span>
                    </button>
                </div>

                {/* Main Split Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Gesture Tutorials & Scorecards (Cols 1-7) */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* Live Feedback Banner */}
                        <div className={`p-4 rounded-2xl border transition-all ${
                            lastFeedback.type === 'success' 
                                ? 'bg-indigo-950/50 border-indigo-500/40 text-indigo-200' 
                                : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}>
                            <div className="flex items-center space-x-2">
                                <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                                <span className="font-semibold text-sm">{lastFeedback.message}</span>
                            </div>
                        </div>

                        {/* Gesture Goal Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {gestures.map((item) => {
                                const Icon = item.icon;
                                const count = practiceScores[item.key] || 0;
                                const isGoalMet = count >= item.goal;

                                return (
                                    <div
                                        key={item.key}
                                        className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
                                            isGoalMet ? 'bg-slate-900/90 border-emerald-500/40' : 'bg-slate-900/90 border-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className={`p-2 rounded-xl ${item.bg}`}>
                                                <Icon className={`w-5 h-5 ${item.color}`} />
                                            </div>
                                            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                                                isGoalMet ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                                            }`}>
                                                {count} / {item.goal} hits
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-white text-base mt-3">{item.name}</h3>
                                        <p className="text-xs text-indigo-300 font-medium mt-0.5">{item.action}</p>
                                        <p className="text-xs text-slate-400 mt-2">{item.instructions}</p>

                                        {/* Progress bar */}
                                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-4">
                                            <div
                                                className={`h-full transition-all duration-300 ${
                                                    isGoalMet ? 'bg-emerald-400' : 'bg-indigo-500'
                                                }`}
                                                style={{ width: `${Math.min(100, (count / item.goal) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Overall Practice Progress */}
                        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                                    <Trophy className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">Calibration Mastery</h4>
                                    <p className="text-xs text-slate-400">Total validated optical gestures: {totalSuccess}</p>
                                </div>
                            </div>

                            <span className="text-2xl font-black text-amber-400 font-mono">
                                {Math.min(100, Math.round((totalSuccess / 16) * 100))}%
                            </span>
                        </div>
                    </div>

                    {/* Right: Optical Controller Panel (Cols 8-12) */}
                    <div className="lg:col-span-5">
                        <WebcamControllerPanel
                            settings={settings}
                            onGesture={handleGestureDetected}
                        />
                    </div>
                </div>
            </div>
        </PointDexLayout>
    );
}
