import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Hand, ArrowRight, Maximize, Pause, Sparkles } from 'lucide-react';

const DEMO_SLIDES = [
    { tag: 'Intro', title: 'Hello, PointDex', kind: 'bullets' },
    { tag: 'Agenda', title: 'What we will cover', kind: 'list' },
    { tag: 'Results', title: 'Gesture accuracy', kind: 'chart' },
    { tag: 'Thanks', title: 'Questions?', kind: 'center' },
];

const GESTURES = [
    { icon: ArrowRight, name: 'Swipe', action: 'Next slide' },
    { icon: Maximize, name: 'Fist', action: 'Fullscreen' },
    { icon: Pause, name: 'Palm', action: 'Pause' },
];

const SWIPE_MS = 3200;

function DemoSlide({ slide }) {
    return (
        <div className="absolute inset-0 p-5 flex flex-col pdx-anim animate-[pdx-slide-in_0.5s_ease-out]">
            <span className="w-fit px-2 py-0.5 rounded-full bg-clay-charcoal text-clay-cream text-[9px] font-bold uppercase">
                {slide.tag}
            </span>

            <div className="mt-3 text-base font-black text-clay-charcoal uppercase tracking-tight">
                {slide.title}
            </div>
            <div className="w-10 h-1 rounded-full bg-clay-gold mt-1.5" />

            {slide.kind === 'bullets' && (
                <div className="mt-4 space-y-2">
                    {[80, 64, 72].map((w) => (
                        <div key={w} className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-clay-gold" />
                            <span className="h-1.5 rounded-full bg-clay-gray" style={{ width: `${w}%` }} />
                        </div>
                    ))}
                </div>
            )}

            {slide.kind === 'list' && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                    {['01', '02', '03', '04'].map((n) => (
                        <div key={n} className="clay-inset rounded-lg px-2 py-1.5 flex items-center space-x-1.5">
                            <span className="text-[9px] font-mono font-black text-clay-gold">{n}</span>
                            <span className="h-1.5 flex-1 rounded-full bg-clay-gray" />
                        </div>
                    ))}
                </div>
            )}

            {slide.kind === 'chart' && (
                <div className="mt-auto flex items-end space-x-2 h-20">
                    {[45, 62, 78, 93].map((h, i) => (
                        <div
                            key={h}
                            className={`flex-1 rounded-t-md ${i === 3 ? 'bg-clay-gold' : 'bg-clay-charcoal/80'}`}
                            style={{ height: `${h}%` }}
                        />
                    ))}
                </div>
            )}

            {slide.kind === 'center' && (
                <div className="mt-auto mb-2 flex justify-center">
                    <div className="w-12 h-12 rounded-full clay-btn-dark flex items-center justify-center border-2 border-clay-gold">
                        <Hand className="w-6 h-6 text-clay-gold" />
                    </div>
                </div>
            )}
        </div>
    );
}

// Live demo: a hand swipes across the stage and the slide advances, on a loop.
function GestureShowcase() {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setTick((t) => t + 1), SWIPE_MS);
        return () => clearInterval(timer);
    }, []);

    const slide = DEMO_SLIDES[tick % DEMO_SLIDES.length];

    return (
        <div className="relative">
            <div className="relative clay-card p-3 rotate-[-2deg]">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-clay-cream border border-clay-gray/60">
                    <DemoSlide key={tick} slide={slide} />
                    <span className="absolute bottom-2 right-3 text-[9px] font-mono font-bold text-clay-charcoal/60">
                        {(tick % DEMO_SLIDES.length) + 1} / {DEMO_SLIDES.length}
                    </span>
                </div>
            </div>

            {/* The hand that "performs" the swipe */}
            <div
                key={tick}
                className="absolute -bottom-6 right-6 pdx-anim"
                style={{ animation: `pdx-swipe ${SWIPE_MS}ms ease-in-out forwards` }}
            >
                <div className="w-14 h-14 rounded-2xl clay-btn-gold flex items-center justify-center">
                    <Hand className="w-7 h-7 text-clay-charcoal" />
                </div>
            </div>

            {/* Webcam bubble */}
            <div className="absolute -top-5 -right-4 clay-card-sm px-3 py-1.5 flex items-center space-x-1.5 rotate-[4deg]">
                <span className="relative flex w-2 h-2">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-500 opacity-75 pdx-anim animate-ping" />
                    <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-600" />
                </span>
                <span className="text-[10px] font-extrabold text-clay-charcoal">Hand detected</span>
            </div>
        </div>
    );
}

export default function GuestLayout({ children, title, subtitle, showTabs = false }) {
    const { url } = usePage();
    const onRegister = url.startsWith('/register');

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#ECE8DA] text-clay-charcoal font-sans">
            {/* Soft clay blobs */}
            <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-clay-gold/25 blur-3xl pdx-anim animate-[pdx-float_9s_ease-in-out_infinite]" />
            <div className="pointer-events-none absolute bottom-[-6rem] right-[-4rem] w-96 h-96 rounded-full bg-clay-cream blur-3xl pdx-anim animate-[pdx-float_11s_ease-in-out_infinite_reverse]" />

            <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 sm:px-8">
                <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
                    {/* Brand + live demo */}
                    <section className="hidden lg:block">
                        <div className="relative rounded-[2rem] bg-clay-charcoal p-10 text-clay-cream shadow-2xl overflow-hidden">
                            <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full border-[18px] border-clay-gold/15" />
                            <div className="pointer-events-none absolute -bottom-20 -left-10 w-48 h-48 rounded-full border-[14px] border-clay-cream/5" />

                            <Link href="/" className="relative inline-flex items-center space-x-3">
                                <span className="w-11 h-11 rounded-full bg-clay-charcoal border-2 border-clay-gold flex items-center justify-center shadow-[inset_3px_3px_6px_rgba(95,95,95,0.45)]">
                                    <Hand className="w-5 h-5 text-clay-gold" />
                                </span>
                                <span className="text-2xl font-black tracking-tight">PointDex</span>
                            </Link>

                            <h1 className="relative mt-8 text-4xl font-black leading-tight">
                                Present with a{' '}
                                <span className="relative whitespace-nowrap text-clay-gold">
                                    wave of your hand
                                    <span className="absolute -bottom-1 left-0 h-1.5 w-full rounded-full bg-clay-gold/40" />
                                </span>
                                .
                            </h1>
                            <p className="relative mt-4 max-w-md text-sm font-medium text-clay-cream/70">
                                Upload your PowerPoint, step back from the keyboard, and control every slide
                                with simple hand gestures through your webcam.
                            </p>

                            <div className="relative mt-10 mb-8 px-4">
                                <GestureShowcase />
                            </div>

                            <div className="relative grid grid-cols-3 gap-3">
                                {GESTURES.map(({ icon: Icon, name, action }) => (
                                    <div key={name} className="rounded-2xl bg-white/5 border border-white/10 px-3 py-3">
                                        <Icon className="w-4 h-4 text-clay-gold" />
                                        <div className="mt-2 text-xs font-extrabold">{name}</div>
                                        <div className="text-[10px] font-semibold text-clay-cream/60">{action}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Form card */}
                    <section className="mx-auto w-full max-w-md">
                        <div className="mb-6 flex flex-col items-center text-center lg:hidden">
                            <Link href="/" className="flex flex-col items-center">
                                <span className="w-14 h-14 rounded-full clay-btn-dark flex items-center justify-center border-2 border-clay-gold">
                                    <Hand className="w-7 h-7 text-clay-gold" />
                                </span>
                                <span className="mt-2 text-2xl font-black tracking-tight">PointDex</span>
                                <span className="mt-1 h-1 w-16 rounded-full bg-clay-gold" />
                            </Link>
                            <p className="mt-3 text-xs font-semibold text-clay-charcoal/70">
                                Gesture-controlled presentations, right from your webcam.
                            </p>
                        </div>

                        <div className="clay-card p-6 sm:p-8">
                            {showTabs && (
                                <div className="clay-inset mb-6 grid grid-cols-2 gap-1 p-1.5">
                                    <Link
                                        href={route('login')}
                                        className={`rounded-xl py-2 text-center text-xs font-bold transition-all ${
                                            !onRegister ? 'clay-btn-gold' : 'text-clay-charcoal/60 hover:text-clay-charcoal'
                                        }`}
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className={`rounded-xl py-2 text-center text-xs font-bold transition-all ${
                                            onRegister ? 'clay-btn-gold' : 'text-clay-charcoal/60 hover:text-clay-charcoal'
                                        }`}
                                    >
                                        Sign up
                                    </Link>
                                </div>
                            )}

                            {title && (
                                <div className="mb-6">
                                    <h2 className="flex items-center text-2xl font-black text-clay-charcoal">
                                        {title}
                                        <Sparkles className="ml-2 w-5 h-5 text-clay-gold" />
                                    </h2>
                                    {subtitle && (
                                        <p className="mt-1 text-xs font-medium text-clay-charcoal/70">{subtitle}</p>
                                    )}
                                </div>
                            )}

                            {children}
                        </div>

                        <p className="mt-6 text-center text-[11px] font-semibold text-clay-charcoal/50">
                            PointDex Presenter · Gesture-Based Remote Presentation Controller
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
