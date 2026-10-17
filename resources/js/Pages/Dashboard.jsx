import React from 'react';
import { Head, Link } from '@inertiajs/react';
import PointDexLayout from '@/Layouts/PointDexLayout';
import {
    Play,
    Hand,
    Presentation,
    ChevronRight
} from 'lucide-react';

export default function Dashboard({ presentations = [], stats = {} }) {
    return (
        <PointDexLayout title="Dashboard">
            <Head title="Dashboard - PointDex" />

            <div className="space-y-6">
                {/* Welcome Card */}
                <div className="clay-card p-6 sm:p-8">
                    <div className="max-w-2xl space-y-3">
                        <h1 className="text-2xl sm:text-3xl font-black text-clay-charcoal">
                            Welcome to PointDex
                        </h1>
                        <p className="text-clay-charcoal/80 text-xs sm:text-sm font-medium">
                            Select a presentation below to start presenting with webcam hand gestures, or open Practice Mode to test your camera settings.
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <Link
                                href="/presentations/1"
                                className="clay-btn-gold px-5 py-2.5 text-xs inline-flex items-center space-x-2"
                            >
                                <Play className="w-4 h-4 fill-clay-charcoal" />
                                <span>Open Task Tamer Demo</span>
                            </Link>

                            <Link
                                href="/practice"
                                className="clay-btn-dark px-5 py-2.5 text-xs inline-flex items-center space-x-2"
                            >
                                <Hand className="w-4 h-4 text-clay-gold" />
                                <span>Practice Mode</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Quick Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="clay-card-sm p-5">
                        <span className="text-xs font-bold text-clay-charcoal/70">Presentations</span>
                        <div className="text-2xl font-black text-clay-charcoal font-mono mt-1">
                            {presentations.length}
                        </div>
                    </div>

                    <div className="clay-card-sm p-5">
                        <span className="text-xs font-bold text-clay-charcoal/70">Recorded Sessions</span>
                        <div className="text-2xl font-black text-clay-charcoal font-mono mt-1">
                            {stats.totalSessions || 0}
                        </div>
                    </div>

                    <div className="clay-card-sm p-5">
                        <span className="text-xs font-bold text-clay-charcoal/70">Avg Latency</span>
                        <div className="text-2xl font-black text-clay-charcoal font-mono mt-1">
                            {stats.avgLatency ? `${stats.avgLatency} ms` : '0 ms'}
                        </div>
                    </div>

                    <div className="clay-card-sm p-5">
                        <span className="text-xs font-bold text-clay-charcoal/70">Avg FPS</span>
                        <div className="text-2xl font-black text-clay-charcoal font-mono mt-1">
                            {stats.avgFps || 0}
                        </div>
                    </div>
                </div>

                {/* Presentations List */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Presentation className="w-5 h-5 text-clay-charcoal" />
                            <h2 className="text-lg font-black text-clay-charcoal">Recent Presentations</h2>
                        </div>
                        <Link
                            href="/presentations"
                            className="text-xs font-bold text-clay-charcoal hover:underline flex items-center space-x-1"
                        >
                            <span>View All</span>
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {presentations.map((item) => (
                            <div
                                key={item.id}
                                className="clay-card p-5 flex flex-col justify-between"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-clay-gold text-clay-charcoal uppercase">
                                            {item.is_sample ? 'Sample' : 'Deck'}
                                        </span>
                                        <span className="text-xs font-mono font-bold text-clay-charcoal/70">
                                            {item.slides_data?.length || 1} slides
                                        </span>
                                    </div>

                                    <h3 className="font-black text-clay-charcoal text-lg">
                                        {item.title}
                                    </h3>
                                    <p className="text-xs text-clay-charcoal/75 line-clamp-2 font-medium">
                                        {item.description || 'No description provided.'}
                                    </p>
                                </div>

                                <div className="mt-5 pt-3 border-t border-clay-gray/50 flex items-center justify-between">
                                    <Link
                                        href={`/presentations/${item.id}`}
                                        className="clay-btn-dark px-4 py-2 text-xs inline-flex items-center space-x-1.5"
                                    >
                                        <Play className="w-3 h-3 fill-clay-gold text-clay-gold" />
                                        <span>Present</span>
                                    </Link>

                                    <span className="text-[11px] font-mono font-bold text-clay-charcoal/60">
                                        {item.aspect_ratio || '16:9'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </PointDexLayout>
    );
}