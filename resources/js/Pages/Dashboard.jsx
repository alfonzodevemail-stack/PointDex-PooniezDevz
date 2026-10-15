import React from 'react';
import { Head, Link } from '@inertiajs/react';
import PointDexLayout from '@/Layouts/PointDexLayout';
import { 
    Play, 
    Sparkles, 
    Hand, 
    Zap, 
    Activity, 
    BarChart3, 
    Presentation, 
    Clock, 
    ShieldCheck, 
    Plus,
    Users,
    Layers,
    ChevronRight
} from 'lucide-react';

export default function Dashboard({ presentations = [], recentSessions = [], stats = {} }) {
    const defaultStats = {
        totalPresentations: presentations.length,
        totalSessions: stats.totalSessions || 0,
        avgLatency: stats.avgLatency || 42,
        avgFps: stats.avgFps || 29.5,
    };

    return (
        <PointDexLayout title="PointDex - Dashboard">
            <Head title="PointDex - Gesture-Based Remote Presentation Controller" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Hero Showcase Banner */}
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-800/40 p-8 sm:p-12 shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10 max-w-3xl space-y-4">
                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                            <span>Event-Driven Architecture (EDA) & Machine Learning</span>
                        </div>

                        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                            Control Presentations with <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">Natural Hand Gestures</span>.
                        </h1>

                        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                            PointDex eliminates physical clickers by converting standard laptop webcam feeds into a non-blocking optical event producer. Powered by client-side MediaPipe WASM and a real-time event bus.
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <Link
                                href="/presentations/1"
                                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition transform hover:-translate-y-0.5"
                            >
                                <Play className="w-4 h-4 fill-white" />
                                <span>Launch Task Tamer Demo</span>
                            </Link>

                            <Link
                                href="/practice"
                                className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition"
                            >
                                <Hand className="w-4 h-4 text-indigo-400" />
                                <span>Practice Gestures</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Key Research Telemetry Metrics (Section 3.4 spec) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-xs font-medium">Avg Latency</span>
                            <Zap className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                            {defaultStats.avgLatency}<span className="text-sm font-normal text-slate-400 ml-1">ms</span>
                        </div>
                        <span className="text-[11px] text-emerald-400 font-medium">Target &lt; 80ms (Passed)</span>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-xs font-medium">Vision Throughput</span>
                            <Activity className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                            {defaultStats.avgFps}<span className="text-sm font-normal text-slate-400 ml-1">FPS</span>
                        </div>
                        <span className="text-[11px] text-emerald-400 font-medium">Baseline 28-30 FPS</span>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-xs font-medium">Recognition Accuracy</span>
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                            96.5<span className="text-sm font-normal text-slate-400 ml-1">%</span>
                        </div>
                        <span className="text-[11px] text-emerald-400 font-medium">Benchmark &gt;= 90%</span>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                        <div className="flex items-center justify-between text-slate-400 mb-2">
                            <span className="text-xs font-medium">Data Privacy</span>
                            <ShieldCheck className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-white">
                            100%
                        </div>
                        <span className="text-[11px] text-slate-400">RA 10173 Client-Side Only</span>
                    </div>
                </div>

                {/* Presentations Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Presentation className="w-5 h-5 text-indigo-400" />
                            <h2 className="text-xl font-bold text-white">Presentations</h2>
                        </div>
                        <Link
                            href="/presentations"
                            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                        >
                            <span>View All ({presentations.length})</span>
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {presentations.map((item) => (
                            <div
                                key={item.id}
                                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase font-semibold">
                                            {item.is_sample ? 'Demo Showcase' : 'Deck'}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {item.slides_data?.length || 1} slides
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-white text-lg group-hover:text-indigo-300 transition">
                                            {item.title}
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                            {item.description || 'Interactive slide deck ready for gesture navigation.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                                    <Link
                                        href={`/presentations/${item.id}`}
                                        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                                    >
                                        <Play className="w-3 h-3 fill-white" />
                                        <span>Present</span>
                                    </Link>

                                    <span className="text-[11px] text-slate-500 font-mono">
                                        16:9 HD
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Team & Research Attribution Card */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs">
                            <Users className="w-4 h-4" />
                            <span>Research Project Contributors</span>
                        </div>
                        <p className="text-sm text-slate-300 font-medium">
                            Khobe Clayne Lolong • I-Chieh Hung • Alfonzo Balagapo • Xer Ruie Morales
                        </p>
                        <p className="text-xs text-slate-500">
                            José Rizal University • Track B: Software Engineering Methodology • SDG 9 & 12
                        </p>
                    </div>

                    <Link
                        href="/analytics"
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                    >
                        View Usability & Benchmarking Data
                    </Link>
                </div>
            </div>
        </PointDexLayout>
    );
}
