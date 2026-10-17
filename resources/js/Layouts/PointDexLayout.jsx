import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    Presentation,
    Hand,
    BarChart3,
    LayoutDashboard,
    HelpCircle,
    Sparkles,
    ShieldCheck,
    Compass
} from 'lucide-react';

export default function PointDexLayout({ children, title = 'PointDex' }) {
    const { url } = usePage();
    const [showTutorial, setShowTutorial] = useState(false);

    const isPracticeMode = url.startsWith('/practice');
    const isHome = !isPracticeMode;

    const sidebarItems = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: LayoutDashboard,
            active: url === '/dashboard' || url === '/',
        },
        {
            name: 'My Presentations',
            href: '/presentations',
            icon: Presentation,
            active: url.startsWith('/presentations'),
        },
        {
            name: 'Practice Mode',
            href: '/practice',
            icon: Hand,
            active: url.startsWith('/practice'),
        },
        {
            name: 'Analytics',
            href: '/analytics',
            icon: BarChart3,
            active: url.startsWith('/analytics'),
        },
    ];

    return (
        <div className="min-h-screen bg-[#ECE8DA] text-clay-charcoal flex flex-col font-sans selection:bg-clay-gold selection:text-clay-charcoal">
            {/* Top Centered Mode Bar (Matches Figure 4.1 top tabs: Home | Practice Mode) */}
            <header className="pt-4 pb-2 px-4 sm:px-8 flex items-center justify-center">
                <div className="clay-card-sm px-3 py-1.5 flex items-center space-x-2">
                    <Link
                        href="/dashboard"
                        className={`px-5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isHome
                                ? 'clay-btn-gold text-clay-charcoal'
                                : 'text-clay-charcoal/70 hover:text-clay-charcoal'
                        }`}
                    >
                        Home
                    </Link>
                    <Link
                        href="/practice"
                        className={`px-5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isPracticeMode
                                ? 'clay-btn-gold text-clay-charcoal'
                                : 'text-clay-charcoal/70 hover:text-clay-charcoal'
                        }`}
                    >
                        Practice Mode
                    </Link>
                </div>
            </header>

            {/* Main Outer Workspace Container */}
            <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row gap-6">
                {/* Left Clay Sidebar (Matches Figure 4.1 Left Column) */}
                <aside className="lg:w-60 flex-shrink-0">
                    <div className="clay-card h-full p-5 flex flex-col justify-between min-h-[200px] lg:min-h-[calc(100vh-7.5rem)]">
                        <div className="space-y-6">
                            {/* Brand Emblem & PointDex Title */}
                            <Link href="/dashboard" className="flex flex-col items-center text-center pt-2 group">
                                <div className="w-16 h-16 rounded-full clay-btn-dark flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border-2 border-clay-gold">
                                    <Hand className="w-8 h-8 text-clay-gold" />
                                </div>
                                <span className="text-xl font-black tracking-tight text-clay-charcoal">
                                    PointDex
                                </span>
                                <div className="w-20 h-1 rounded-full bg-clay-gold mt-1.5" />
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-clay-charcoal/60 mt-1.5">
                                    Gesture Controller
                                </span>
                            </Link>

                            {/* Sidebar Navigation Links */}
                            <nav className="space-y-2 pt-2">
                                {sidebarItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                                                item.active
                                                    ? 'clay-btn-dark text-clay-cream'
                                                    : 'text-clay-charcoal/80 hover:bg-clay-gray/30 hover:text-clay-charcoal'
                                            }`}
                                        >
                                            <Icon className={`w-4 h-4 ${item.active ? 'text-clay-gold' : 'text-clay-charcoal/70'}`} />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}

                                {/* Tutorial Modal Trigger (Matches Figure 4.1 "Tutorial" item) */}
                                <button
                                    type="button"
                                    onClick={() => setShowTutorial(true)}
                                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold text-clay-charcoal/80 hover:bg-clay-gray/30 hover:text-clay-charcoal transition-all text-left"
                                >
                                    <HelpCircle className="w-4 h-4 text-clay-charcoal/70" />
                                    <span>Tutorial</span>
                                </button>
                            </nav>
                        </div>

                        {/* Sidebar Bottom Quick Demo & Privacy Badge */}
                        <div className="pt-6 space-y-3 border-t border-clay-gray/50">
                            <Link
                                href="/presentations/1"
                                className="w-full clay-btn-gold py-2.5 px-4 flex items-center justify-center space-x-2 text-xs"
                            >
                                <Sparkles className="w-4 h-4" />
                                <span>Launch Task Tamer</span>
                            </Link>

                            <div className="clay-inset p-2.5 flex items-center justify-center space-x-1.5 text-[10px] font-semibold text-clay-charcoal/75">
                                <ShieldCheck className="w-3.5 h-3.5 text-clay-charcoal" />
                                <span>Local WASM • RA 10173</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area (Center + Right Panels) */}
                <main className="flex-1 min-w-0">
                    {children}
                </main>
            </div>

            {/* Claymorphic Tutorial Modal */}
            {showTutorial && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-clay-charcoal/50 backdrop-blur-sm">
                    <div className="clay-card max-w-2xl w-full p-6 sm:p-8 relative">
                        <div className="flex items-center justify-between pb-4 border-b border-clay-gray/60">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-xl clay-btn-gold flex items-center justify-center">
                                    <HelpCircle className="w-5 h-5 text-clay-charcoal" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-clay-charcoal">
                                        PointDex Gesture Guide
                                    </h3>
                                    <p className="text-xs text-clay-charcoal/70">
                                        Control your slides hands-free from 1.0m to 3.5m away
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowTutorial(false)}
                                className="clay-btn-light w-8 h-8 flex items-center justify-center text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                            <div className="clay-inset p-4">
                                <div className="text-2xl mb-1">👉</div>
                                <h4 className="font-extrabold text-clay-charcoal text-sm">Swipe Right</h4>
                                <p className="text-xs text-clay-charcoal/75 mt-1">
                                    Move your open hand rapidly to the right to advance to the <strong>Next Slide</strong> (<code>ArrowRight</code>).
                                </p>
                            </div>

                            <div className="clay-inset p-4">
                                <div className="text-2xl mb-1">👈</div>
                                <h4 className="font-extrabold text-clay-charcoal text-sm">Swipe Left</h4>
                                <p className="text-xs text-clay-charcoal/75 mt-1">
                                    Move your open hand rapidly to the left to return to the <strong>Previous Slide</strong> (<code>ArrowLeft</code>).
                                </p>
                            </div>

                            <div className="clay-inset p-4">
                                <div className="text-2xl mb-1">✊</div>
                                <h4 className="font-extrabold text-clay-charcoal text-sm">Closed Fist (Hold 1.5s)</h4>
                                <p className="text-xs text-clay-charcoal/75 mt-1">
                                    Hold a closed fist for 1.5 seconds to toggle <strong>Fullscreen Mode</strong> (<code>F5</code>).
                                </p>
                            </div>

                            <div className="clay-inset p-4">
                                <div className="text-2xl mb-1">✋</div>
                                <h4 className="font-extrabold text-clay-charcoal text-sm">Open Palm (Stop Sign)</h4>
                                <p className="text-xs text-clay-charcoal/75 mt-1">
                                    Hold an open palm facing the camera to toggle <strong>Pause / Blank Screen</strong>.
                                </p>
                            </div>
                        </div>

                        <div className="clay-card-sm p-3.5 text-xs text-clay-charcoal flex items-center justify-between">
                            <span>
                                <strong>Cooldown Broker:</strong> An 800ms refractory lock prevents accidental double-slide skips.
                            </span>
                            <button
                                onClick={() => setShowTutorial(false)}
                                className="clay-btn-dark px-5 py-2 text-xs ml-4 flex-shrink-0"
                            >
                                Got It
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}