import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    Presentation,
    Hand,
    BarChart3,
    LayoutDashboard,
    HelpCircle,
    UserCircle,
    LogOut,
    ChevronLeft
} from 'lucide-react';

const COLLAPSE_KEY = 'pointdex.sidebar.collapsed';

function readCollapsed() {
    try {
        return window.localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch (e) {
        return false;
    }
}

export default function PointDexLayout({ children }) {
    const { url, props } = usePage();
    const user = props.auth?.user;
    const [showTutorial, setShowTutorial] = useState(false);
    const [collapsed, setCollapsed] = useState(readCollapsed);

    const isPracticeMode = url.startsWith('/practice');

    const toggleCollapsed = () => {
        setCollapsed((prev) => {
            try {
                window.localStorage.setItem(COLLAPSE_KEY, prev ? '0' : '1');
            } catch (e) {
                // Remembering the choice is optional.
            }
            return !prev;
        });
    };

    const sidebarItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, active: url === '/dashboard' || url === '/' },
        { name: 'My Presentations', href: '/presentations', icon: Presentation, active: url.startsWith('/presentations') },
        { name: 'Practice Mode', href: '/practice', icon: Hand, active: url.startsWith('/practice') },
        { name: 'Analytics', href: '/analytics', icon: BarChart3, active: url.startsWith('/analytics') },
    ];

    // Collapsed (desktop only): icons centred, labels hidden.
    const itemLayout = collapsed ? 'lg:justify-center lg:px-0 lg:space-x-0' : '';
    const labelLayout = collapsed ? 'lg:hidden' : '';

    return (
        <div className="min-h-screen bg-[#ECE8DA] text-clay-charcoal font-sans">
            <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-4 flex flex-col lg:flex-row gap-6">
                {/* Sidebar: stays in view while the page scrolls */}
                <aside
                    className={`flex-shrink-0 lg:sticky lg:top-4 lg:self-start lg:h-[calc(100vh-2rem)] transition-[width] duration-300 ${
                        collapsed ? 'lg:w-20' : 'lg:w-60'
                    }`}
                >
                    <div className={`clay-card relative h-full flex flex-col justify-between py-5 ${collapsed ? 'px-5 lg:px-3' : 'px-5'}`}>
                        <button
                            type="button"
                            onClick={toggleCollapsed}
                            title={collapsed ? 'Expand menu' : 'Collapse menu'}
                            aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
                            className="hidden lg:flex absolute top-1/2 -right-3.5 -translate-y-1/2 z-10 w-7 h-7 rounded-full clay-btn-gold items-center justify-center"
                        >
                            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
                        </button>

                        <div className="space-y-6 overflow-y-auto overflow-x-hidden">
                            <Link href="/dashboard" className="flex flex-col items-center text-center pt-2" title="PointDex">
                                <div
                                    className={`rounded-full clay-btn-dark flex items-center justify-center border-2 border-clay-gold flex-shrink-0 ${
                                        collapsed ? 'w-14 h-14 mb-2.5 lg:mb-0 lg:w-11 lg:h-11' : 'w-14 h-14 mb-2.5'
                                    }`}
                                >
                                    <Hand className={`text-clay-gold ${collapsed ? 'w-7 h-7 lg:w-5 lg:h-5' : 'w-7 h-7'}`} />
                                </div>
                                <span className={`text-xl font-black tracking-tight text-clay-charcoal ${labelLayout}`}>
                                    PointDex
                                </span>
                                <div className={`w-16 h-1 rounded-full bg-clay-gold mt-1 ${labelLayout}`} />
                            </Link>

                            <nav className="space-y-2 pt-2">
                                {sidebarItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            title={item.name}
                                            className={`flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${itemLayout} ${
                                                item.active
                                                    ? 'clay-btn-dark text-clay-cream'
                                                    : 'text-clay-charcoal/80 hover:bg-clay-gray/30 hover:text-clay-charcoal'
                                            }`}
                                        >
                                            <Icon className={`w-4 h-4 flex-shrink-0 ${item.active ? 'text-clay-gold' : 'text-clay-charcoal/70'}`} />
                                            <span className={`whitespace-nowrap ${labelLayout}`}>{item.name}</span>
                                        </Link>
                                    );
                                })}

                                <button
                                    type="button"
                                    onClick={() => setShowTutorial(true)}
                                    title="Tutorial"
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold text-clay-charcoal/80 hover:bg-clay-gray/30 hover:text-clay-charcoal transition-all text-left ${itemLayout}`}
                                >
                                    <HelpCircle className="w-4 h-4 flex-shrink-0 text-clay-charcoal/70" />
                                    <span className={labelLayout}>Tutorial</span>
                                </button>
                            </nav>
                        </div>

                        <div className="pt-4 border-t border-clay-gray/50 space-y-1">
                            {user && (
                                <>
                                    <Link
                                        href="/profile"
                                        title="Profile & Security"
                                        className={`flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${itemLayout} ${
                                            url.startsWith('/profile')
                                                ? 'clay-btn-dark text-clay-cream'
                                                : 'text-clay-charcoal/80 hover:bg-clay-gray/30 hover:text-clay-charcoal'
                                        }`}
                                    >
                                        <UserCircle className="w-4 h-4 flex-shrink-0" />
                                        <span className={`min-w-0 ${labelLayout}`}>
                                            <span className="block truncate">{user.name}</span>
                                            <span className="block text-[10px] font-semibold opacity-70">Profile &amp; Security</span>
                                        </span>
                                    </Link>
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        title="Log Out"
                                        className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-xs font-bold text-clay-charcoal/80 hover:bg-clay-gray/30 hover:text-clay-charcoal transition-all text-left ${itemLayout}`}
                                    >
                                        <LogOut className="w-4 h-4 flex-shrink-0 text-clay-charcoal/70" />
                                        <span className={labelLayout}>Log Out</span>
                                    </Link>
                                </>
                            )}
                            <div className={`text-center pt-1 ${labelLayout}`}>
                                <span className="text-[11px] font-semibold text-clay-charcoal/60">
                                    PointDex Presenter
                                </span>
                            </div>
                        </div>
                    </div>
                </aside>

                <div className="flex-1 min-w-0 flex flex-col">
                    {/* Top Navigation Switcher */}
                    <header className="pb-4 flex items-center justify-center">
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

                    <main className="flex-1 min-w-0">
                        {children}
                    </main>
                </div>
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