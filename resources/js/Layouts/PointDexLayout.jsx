import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    Presentation,
    Hand,
    BarChart3,
    LayoutDashboard,
    HelpCircle,
    UserCircle,
    LogOut
} from 'lucide-react';

export default function PointDexLayout({ children }) {
    const { url, props } = usePage();
    const user = props.auth?.user;
    const [showTutorial, setShowTutorial] = useState(false);

    const isPracticeMode = url.startsWith('/practice');

    const sidebarItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, active: url === '/dashboard' || url === '/' },
        { name: 'My Presentations', href: '/presentations', icon: Presentation, active: url.startsWith('/presentations') },
        { name: 'Practice Mode', href: '/practice', icon: Hand, active: url.startsWith('/practice') },
        { name: 'Analytics', href: '/analytics', icon: BarChart3, active: url.startsWith('/analytics') },
    ];

    return (
        <div className="min-h-screen bg-[#ECE8DA] text-clay-charcoal flex flex-col font-sans">
            {/* Top Navigation Switcher */}
            <header className="pt-4 pb-2 px-4 sm:px-8 flex items-center justify-center">
                <div className="clay-card-sm px-3 py-1.5 flex items-center space-x-2">
                    <Link
                        href="/dashboard"
                        className={`px-5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            !isPracticeMode
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

            <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row gap-6">
                {/* Sidebar */}
                <aside className="lg:w-60 flex-shrink-0">
                    <div className="clay-card h-full p-5 flex flex-col justify-between min-h-[200px] lg:min-h-[calc(100vh-7.5rem)]">
                        <div className="space-y-6">
                            <Link href="/dashboard" className="flex flex-col items-center text-center pt-2">
                                <div className="w-14 h-14 rounded-full clay-btn-dark flex items-center justify-center mb-2.5 border-2 border-clay-gold">
                                    <Hand className="w-7 h-7 text-clay-gold" />
                                </div>
                                <span className="text-xl font-black tracking-tight text-clay-charcoal">
                                    PointDex
                                </span>
                                <div className="w-16 h-1 rounded-full bg-clay-gold mt-1" />
                            </Link>

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

                        <div className="pt-4 border-t border-clay-gray/50 space-y-1">
                            {user && (
                                <>
                                    <Link
                                        href="/profile"
                                        className={`flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                                            url.startsWith('/profile')
                                                ? 'clay-btn-dark text-clay-cream'
                                                : 'text-clay-charcoal/80 hover:bg-clay-gray/30 hover:text-clay-charcoal'
                                        }`}
                                    >
                                        <UserCircle className="w-4 h-4 flex-shrink-0" />
                                        <span className="min-w-0">
                                            <span className="block truncate">{user.name}</span>
                                            <span className="block text-[10px] font-semibold opacity-70">Profile &amp; Security</span>
                                        </span>
                                    </Link>
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-xs font-bold text-clay-charcoal/80 hover:bg-clay-gray/30 hover:text-clay-charcoal transition-all text-left"
                                    >
                                        <LogOut className="w-4 h-4 text-clay-charcoal/70" />
                                        <span>Log Out</span>
                                    </Link>
                                </>
                            )}
                            <div className="text-center pt-1">
                                <span className="text-[11px] font-semibold text-clay-charcoal/60">
                                    PointDex Presenter
                                </span>
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 min-w-0">
                    {children}
                </main>
            </div>

            {/* Tutorial Modal */}
            {showTutorial && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-clay-charcoal/50 backdrop-blur-sm">
                    <div className="clay-card max-w-xl w-full p-6 relative">
                        <div className="flex items-center justify-between pb-3 border-b border-clay-gray/60">
                            <h3 className="text-base font-black text-clay-charcoal">
                                Gesture Controls Guide
                            </h3>
                            <button
                                onClick={() => setShowTutorial(false)}
                                className="clay-btn-light w-8 h-8 flex items-center justify-center text-xs font-bold"
                            >
                                X
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-5">
                            <div className="clay-inset p-4">
                                <h4 className="font-extrabold text-clay-charcoal text-sm">Swipe Right</h4>
                                <p className="text-xs text-clay-charcoal/75 mt-1">
                                    Move your open hand to the right to go to the next slide.
                                </p>
                            </div>

                            <div className="clay-inset p-4">
                                <h4 className="font-extrabold text-clay-charcoal text-sm">Swipe Left</h4>
                                <p className="text-xs text-clay-charcoal/75 mt-1">
                                    Move your open hand to the left to go to the previous slide.
                                </p>
                            </div>

                            <div className="clay-inset p-4">
                                <h4 className="font-extrabold text-clay-charcoal text-sm">Closed Fist</h4>
                                <p className="text-xs text-clay-charcoal/75 mt-1">
                                    Hold a closed fist for 1.5 seconds to toggle fullscreen.
                                </p>
                            </div>

                            <div className="clay-inset p-4">
                                <h4 className="font-extrabold text-clay-charcoal text-sm">Open Palm</h4>
                                <p className="text-xs text-clay-charcoal/75 mt-1">
                                    Hold an open palm still, facing the camera, for about a second to pause or resume.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowTutorial(false)}
                                className="clay-btn-dark px-5 py-2 text-xs"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}