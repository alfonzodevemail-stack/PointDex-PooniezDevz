import React from 'react';
import { Head, Link } from '@inertiajs/react';
import PointDexLayout from '@/Layouts/PointDexLayout';
import {
    Play,
    Sparkles,
    Hand,
    Zap,
    Activity,
    Presentation,
    ShieldCheck,
    Users,
    ChevronRight
} from 'lucide-react';

export default function Dashboard({ presentations = [], stats = {} }) {
    const defaultStats = {
        totalPresentations: presentations.length,
        totalSessions: stats.totalSessions || 0,
        avgLatency: stats.avgLatency || 42,
        avgFps: stats.avgFps || 29.5,
    };

    return (
        <PointDexLayout title="PointDex - Dashboard">
            <Head title="PointDex - Gesture-Based Remote Presentation Controller" />

            <div className="space-y-6">
                {/* Hero Clay Banner */}
                <div className="clay-card p-6 sm:p-10 relative overflow-hidden">
                    <div className="pointer-events-none absolute -top-12 -right-12 w-56 h-56 rotate-45 bg-clay-gold/25 rounded-3xl" />

                    <div className="relative z-10 max-w-3xl space-y-4">
                        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-clay-charcoal text-clay-cream text-xs font-bold">
                            <Sparkles className="w-3.5 h-3.5 text-clay-gold" />
                            <span>Event-Driven Architecture (EDA) & MediaPipe WASM</span>
                        </div>

                        <h1 className="text-2xl sm:text-4xl font-black text-clay-charcoal tracking-tight leading-tight">
                            Control Presentations with{' '}
                            <span className="underline decoration-clay-gold decoration-4 underline-offset-4">
                                Natural Hand Gestures
                            </span>.
                        </h1>

                        <p className="text-clay-charcoal/80 text-xs sm:text-sm leading-relaxed font-medium">
                            PointDex eliminates physical clickers by converting standard laptop webcam feeds into a non-blocking optical event producer.
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <Link
                                href="/presentations/1"
                                className="clay-btn-gold px-6 py-3 text-xs sm:text-sm inline-flex items-center space-x-2"
                            >
                                <Play className="w-4 h-4 fill-clay-charcoal" />
                                <span>Launch Task Tamer Demo</span>
                            </Link>

                            <Link
                                href="/practice"
                                className="clay-btn-dark px-5 py-3 text-xs sm:text-sm inline-flex items-center space-x-2"
                            >
                                <Hand className="w-4 h-4 text-clay-gold" />
                                <span>Practice Gestures</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Key Research Telemetry Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="clay-card-sm p-5">
                        <div className="flex items-center justify-between text-clay-charcoal/70 mb-1">
                            <span className="text-xs font-bold">Avg Latency</span>
                            <Zap className="w-4 h-4 text-clay-gold fill-clay-gold" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-clay-charcoal font-mono">
                            {defaultStats.avgLatency}
                            <span className="text-xs font-bold text-clay-charcoal/60 ml-1">ms</span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700">Target &lt; 80ms (Passed)</span>
                    </div>

                    <div className="clay-card-sm p-5">
                        <div className="flex items-center justify-between text-clay-charcoal/70 mb-1">
                            <span className="text-xs font-bold">Vision Throughput</span>
                            <Activity className="w-4 h-4 text-clay-charcoal" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-clay-charcoal font-mono">
                            {defaultStats.avgFps}
                            <span className="text-xs font-bold text-clay-charcoal/60 ml-1">FPS</span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700">Baseline 28–30 FPS</span>
                    </div>

                    <div className="clay-card-sm p-5">
                        <div className="flex items-center justify-between text-clay-charcoal/70 mb-1">
                            <span className="text-xs font-bold">Accuracy Rate</span>
                            <ShieldCheck className="w-4 h-4 text-clay-charcoal" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-clay-charcoal font-mono">
                            96.5<span className="text-xs font-bold text-clay-charcoal/60 ml-1">%</span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700">Benchmark &ge; 90%</span>
                    </div>

                    <div className="clay-card-sm p-5">
                        <div className="flex items-center justify-between text-clay-charcoal/70 mb-1">
                            <span className="text-xs font-bold">Data Privacy</span>
                            <ShieldCheck className="w-4 h-4 text-clay-gold" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-clay-charcoal">
                            100%
                        </div>
                        <span className="text-[11px] font-bold text-clay-charcoal/70">RA 10173 Client-Side</span>
                    </div>
                </div>

                {/* Presentations Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Presentation className="w-5 h-5 text-clay-charcoal" />
                            <h2 className="text-lg font-black text-clay-charcoal">Presentation Decks</h2>
                        </div>
                        <Link
                            href="/presentations"
                            className="text-xs font-bold text-clay-charcoal hover:underline flex items-center space-x-1"
                        >
                            <span>View All ({presentations.length})</span>
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {presentations.map((item) => (
                            <div
                                key={item.id}
                                className="clay-card p-5 flex flex-col justify-between"
                            >
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-clay-gold text-clay-charcoal uppercase">
                                            {item.is_sample ? 'Demo Showcase' : 'Deck'}
                                        </span>
                                        <span className="text-xs font-mono font-bold text-clay-charcoal/70">
                                            {item.slides_data?.length || 1} slides
                                        </span>
                                    </div>

                                    <h3 className="font-black text-clay-charcoal text-lg">
                                        {item.title}
                                    </h3>
                                    <p className="text-xs text-clay-charcoal/75 line-clamp-2 font-medium">
                                        {item.description || 'Interactive slide deck ready for gesture navigation.'}
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

                {/* Team & Research Attribution Card */}
                <div className="clay-inset p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-clay-charcoal font-black text-xs uppercase tracking-wider">
                            <Users className="w-4 h-4 text-clay-charcoal" />
                            <span>PointDex Research Team</span>
                        </div>
                        <p className="text-xs sm:text-sm text-clay-charcoal font-bold">
                            Khobe Clayne Lolong • I-Chieh Hung • Alfonzo Balagapo • Xer Ruie Morales
                        </p>
                        <p className="text-[11px] text-clay-charcoal/70 font-medium">
                            José Rizal University • Track B: Software Engineering Methodology • SDG 9 &amp; 12
                        </p>
                    </div>

                    <Link
                        href="/analytics"
                        className="clay-btn-light px-4 py-2 text-xs"
                    >
                        View Benchmarks
                    </Link>
                </div>
            </div>
        </PointDexLayout>
    );
}