import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
    Presentation, 
    Hand, 
    BarChart3, 
    LayoutDashboard, 
    HelpCircle, 
    Sparkles,
    ChevronRight,
    Camera,
    ShieldCheck
} from 'lucide-react';

export default function PointDexLayout({ children, title = 'PointDex' }) {
    const { url } = usePage();
    const [showTutorial, setShowTutorial] = useState(false);

    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, active: url === '/dashboard' || url === '/' },
        { name: 'My Presentations', href: '/presentations', icon: Presentation, active: url.startsWith('/presentations') },
        { name: 'Practice Mode', href: '/practice', icon: Hand, active: url.startsWith('/practice') },
        { name: 'Analytics & Benchmarks', href: '/analytics', icon: BarChart3, active: url.startsWith('/analytics') },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Brand Logo */}
                        <div className="flex items-center space-x-3">
                            <Link href="/dashboard" className="flex items-center space-x-3 group">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                                    <Hand className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center space-x-1.5">
                                        <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">PointDex</span>
                                        <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">v1.0 (50%)</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 hidden sm:block">Gesture-Based Remote Presentation Controller</p>
                                </div>
                            </Link>
                        </div>

                        {/* Navigation Links */}
                        <nav className="hidden md:flex items-center space-x-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            item.active
                                                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                                                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowTutorial(true)}
                                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                            >
                                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Tutorial</span>
                            </button>

                            <Link
                                href="/presentations/1"
                                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-md shadow-indigo-500/20 transition"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Launch Demo</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden flex overflow-x-auto py-2 px-4 border-t border-slate-800 space-x-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap ${
                                item.active ? 'bg-indigo-600 text-white' : 'text-slate-300 bg-slate-800/80'
                            }`}
                        >
                            <span>{item.name}</span>
                        </Link>
                    ))}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500 text-center">
                <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p>© 2026 PointDex — José Rizal University. Research Track B (Software Engineering).</p>
                    <p className="flex items-center space-x-1 text-slate-400">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Client-Side ML Inference (RA 10173 Data Privacy Compliant)</span>
                    </p>
                </div>
            </footer>

            {/* Tutorial Modal */}
            {showTutorial && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                            <div className="flex items-center space-x-2.5">
                                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                                    <HelpCircle className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-white">How to Control Presentations with PointDex</h3>
                            </div>
                            <button
                                onClick={() => setShowTutorial(false)}
                                className="text-slate-400 hover:text-white text-xl font-bold p-1"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                                <div className="text-2xl mb-1">👉</div>
                                <h4 className="font-semibold text-white text-sm">Swipe Right</h4>
                                <p className="text-xs text-slate-300 mt-1">Move your open hand rapidly to the right to advance to the <strong>Next Slide</strong> (dispatches ArrowRight).</p>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                                <div className="text-2xl mb-1">👈</div>
                                <h4 className="font-semibold text-white text-sm">Swipe Left</h4>
                                <p className="text-xs text-slate-300 mt-1">Move your open hand rapidly to the left to navigate to the <strong>Previous Slide</strong> (dispatches ArrowLeft).</p>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                                <div className="text-2xl mb-1">✊</div>
                                <h4 className="font-semibold text-white text-sm">Closed Fist (Hold 1.5s)</h4>
                                <p className="text-xs text-slate-300 mt-1">Make a fist and hold statically for 1.5 seconds to toggle <strong>Fullscreen Presentation</strong> (dispatches F5).</p>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                                <div className="text-2xl mb-1">✋</div>
                                <h4 className="font-semibold text-white text-sm">Open Palm (Stop Sign)</h4>
                                <p className="text-xs text-slate-300 mt-1">Hold open palm facing the webcam to toggle <strong>Pause / Blank Screen</strong> overlay.</p>
                            </div>
                        </div>

                        <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-3 text-xs text-indigo-300 flex items-start space-x-2">
                            <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                            <span><strong>Cooldown Prevention:</strong> To prevent multiple accidental slide skips, a configurable 800ms cooldown engages after each detected gesture.</span>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowTutorial(false)}
                                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition"
                            >
                                Got it, let's present!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
