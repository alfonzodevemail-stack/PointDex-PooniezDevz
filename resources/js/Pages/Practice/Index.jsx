import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import PointDexLayout from '@/Layouts/PointDexLayout';
import WebcamControllerPanel from '@/Components/WebcamControllerPanel';
import useTelemetrySession from '@/Hooks/useTelemetrySession';
import {
    ArrowRight,
    ArrowLeft,
    Maximize,
    Pause,
    RotateCcw
} from 'lucide-react';

export default function PracticeIndex({ settings = {} }) {
    const { sessionCode, onTelemetryData } = useTelemetrySession({ mode: 'practice' });

    const [practiceScores, setPracticeScores] = useState({
        swipe_right: 0,
        swipe_left: 0,
        fist: 0,
        open_palm: 0,
    });

    const [lastFeedback, setLastFeedback] = useState('Raise your hand in front of the camera to test gestures.');

    const gestures = [
        {
            key: 'swipe_right',
            name: 'Swipe Right',
            icon: ArrowRight,
            action: 'Next Slide',
            instructions: 'Move your open hand from left to right.',
            goal: 5,
        },
        {
            key: 'swipe_left',
            name: 'Swipe Left',
            icon: ArrowLeft,
            action: 'Previous Slide',
            instructions: 'Move your open hand from right to left.',
            goal: 5,
        },
        {
            key: 'fist',
            name: 'Closed Fist',
            icon: Maximize,
            action: 'Fullscreen (Hold 1.5s)',
            instructions: 'Close your hand into a fist and hold still.',
            goal: 3,
        },
        {
            key: 'open_palm',
            name: 'Open Palm',
            icon: Pause,
            action: 'Pause Presentation',
            instructions: 'Hold an open hand facing the camera.',
            goal: 3,
        },
    ];

    const handleGestureDetected = (gesture) => {
        if (Object.prototype.hasOwnProperty.call(practiceScores, gesture.type)) {
            setPracticeScores((prev) => ({
                ...prev,
                [gesture.type]: prev[gesture.type] + 1,
            }));
            setLastFeedback(`Detected: ${gesture.label}`);
        }
    };

    const resetScores = () => {
        setPracticeScores({
            swipe_right: 0,
            swipe_left: 0,
            fist: 0,
            open_palm: 0,
        });
        setLastFeedback('Counters reset.');
    };

    return (
        <PointDexLayout title="Practice Mode">
            <Head title="Practice Mode - PointDex" />

            <div className="space-y-6">
                <div className="clay-card-sm p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-black text-clay-charcoal">
                            Practice Mode
                        </h1>
                        <p className="text-xs text-clay-charcoal/75 font-medium mt-0.5">
                            Test your webcam and hand gestures before starting a presentation.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={resetScores}
                        className="clay-btn-light px-4 py-2 text-xs inline-flex items-center space-x-1.5"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    <div className="xl:col-span-8 space-y-4">
                        <div className="clay-inset p-4 text-xs font-bold text-clay-charcoal">
                            {lastFeedback}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {gestures.map((item) => {
                                const Icon = item.icon;
                                const count = practiceScores[item.key] || 0;

                                return (
                                    <div key={item.key} className="clay-card p-5">
                                        <div className="flex items-center justify-between">
                                            <div className="w-10 h-10 rounded-xl clay-btn-dark flex items-center justify-center">
                                                <Icon className="w-5 h-5 text-clay-gold" />
                                            </div>
                                            <span className="text-xs font-mono font-extrabold px-2.5 py-0.5 rounded-full clay-inset text-clay-charcoal">
                                                {count} / {item.goal}
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
                    </div>

                    <div className="xl:col-span-4">
                        <WebcamControllerPanel
                            settings={settings}
                            sessionCode={sessionCode}
                            onTelemetryData={onTelemetryData}
                            onGesture={handleGestureDetected}
                        />
                    </div>
                </div>
            </div>
        </PointDexLayout>
    );
}