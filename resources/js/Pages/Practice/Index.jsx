import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import PointDexLayout from '@/Layouts/PointDexLayout';
import WebcamControllerPanel from '@/Components/WebcamControllerPanel';
import {
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
        type: 'info',
    });

    const gestures = [
        {
            key: 'swipe_right',
            name: 'Swipe Right',
            icon: ArrowRight,
            action: 'Next Slide (ArrowRight)',
            instructions: 'Quickly sweep your open hand from left to right.',
            goal: 5,
        },
        {
            key: 'swipe_left',
            name: 'Swipe Left',
            icon: ArrowLeft,
            action: 'Previous Slide (ArrowLeft)',
            instructions: 'Quickly sweep your open hand from right to left.',
            goal: 5,
        },
        {
            key: 'fist',
            name: 'Closed Fist (Hold 1.5s)',
            icon: Maximize,
            action: 'Fullscreen Toggle (F5)',
            instructions: 'Clench all fingers into a tight fist and hold steady.',
            goal: 3,
        },
        {
            key: 'open_palm',
            name: 'Open Palm (Stop Sign)',
            icon: Pause,
            action: 'Pause / Blank Screen (B)',
            instructions: 'Hold your open hand flat and still facing the camera.',
            goal: 3,
        },
    ];

    const handleGestureDetected = (gesture) => {
        if (Object.prototype.hasOwnProperty.call(practiceScores, gesture.type)) {
            setPracticeScores((prev) => ({
                ...prev,
                [gesture.type]: prev[gesture.type] + 1,
            }));

            setLastFeedback({
                gesture: gesture.type,
                message: `Detected ${gesture.label} (${gesture.key})!`,
                type: 'success',
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
            type: 'info',
        });
    };

    const totalSuccess = Object.values(practiceScores).reduce((a, b) => a + b, 0);

    return (
        <PointDexLayout title="Practice Mode">
            <Head title="Practice Mode & Calibration - PointDex" />

            <div className="space-y-6">
                {/* Header */}
                <div className="clay-card-sm p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-clay-gold text-clay-charcoal uppercase">
                            Calibration Studio
                        </span>
                        <h1 className="text-xl sm:text-2xl font-black text-clay-charcoal mt-1">
                            Practice Mode &amp; Sensitivity Calibration
                        </h1>
                    </div>

                    <button
                        type="button"
                        onClick={resetScores}
                        className="clay-btn-light px-4 py-2 text-xs inline-flex items-center space-x-1.5"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Scores</span>
                    </button>
                </div>

                {/* Split Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    {/* Left: Gesture Cards (Cols 1-8) */}
                    <div className="xl:col-span-8 space-y-4">
                        <div
                            className={`p-4 rounded-2xl flex items-center space-x-2.5 text-xs font-bold ${
                                lastFeedback.type === 'success'
                                    ? 'clay-btn-gold text-clay-charcoal'
                                    : 'clay-inset text-clay-charcoal'
                            }`}
                        >
                            <Sparkles className="w-4 h-4 flex-shrink-0" />
                            <span>{lastFeedback.message}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {gestures.map((item) => {
                                const Icon = item.icon;
                                const count = practiceScores[item.key] || 0;
                                const isGoalMet = count >= item.goal;

                                return (
                                    <div key={item.key} className="clay-card p-5">
                                        <div className="flex items-center justify-between">
                                            <div className="w-10 h-10 rounded-xl clay-btn-dark flex items-center justify-center">
                                                <Icon className="w-5 h-5 text-clay-gold" />
                                            </div>
                                            <span
                                                className={`text-xs font-mono font-extrabold px-2.5 py-0.5 rounded-full ${
                                                    isGoalMet
                                                        ? 'bg-clay-gold text-clay-charcoal'
                                                        : 'clay-inset text-clay-charcoal'
                                                }`}
                                            >
                                                {count} / {item.goal} hits
                                            </span>
                                        </div>

                                        <h3 className="font-black text-clay-charcoal text-base mt-3">
                                            {item.name}
                                        </h3>
                                        <p className="text-xs font-bold text-clay-charcoal/70 mt-0.5">
                                            {item.action}
                                        </p>
                                        <p className="text-xs text-clay-charcoal/75 mt-2 font-medium">
                                            {item.instructions}
                                        </p>

                                        <div className="w-full clay-inset h-2 rounded-full overflow-hidden mt-4">
                                            <div
                                                className="h-full bg-clay-gold transition-all duration-300"
                                                style={{ width: `${Math.min(100, (count / item.goal) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Overall Mastery */}
                        <div className="clay-card-sm p-5 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 rounded-2xl clay-btn-gold flex items-center justify-center">
                                    <Trophy className="w-6 h-6 text-clay-charcoal" />
                                </div>
                                <div>
                                    <h4 className="font-black text-clay-charcoal text-sm">
                                        Calibration Mastery
                                    </h4>
                                    <p className="text-xs text-clay-charcoal/70 font-medium">
                                        Total validated gestures: {totalSuccess}
                                    </p>
                                </div>
                            </div>

                            <span className="text-2xl font-black text-clay-charcoal font-mono">
                                {Math.min(100, Math.round((totalSuccess / 16) * 100))}%
                            </span>
                        </div>
                    </div>

                    {/* Right: Optical Controller (Cols 9-12) */}
                    <div className="xl:col-span-4">
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