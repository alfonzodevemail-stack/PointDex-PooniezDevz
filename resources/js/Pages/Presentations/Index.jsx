import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import PointDexLayout from '@/Layouts/PointDexLayout';
import { Plus, Play } from 'lucide-react';

export default function PresentationsIndex({ presentations = [] }) {
    const [showCreateModal, setShowCreateModal] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        aspect_ratio: '16:9',
        presentation_url: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/presentations', {
            onSuccess: () => {
                setShowCreateModal(false);
                reset();
            },
        });
    };

    return (
        <PointDexLayout title="My Presentations">
            <Head title="My Presentations - PointDex" />

            <div className="space-y-6">
                {/* Header */}
                <div className="clay-card-sm p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-clay-charcoal">
                            My Presentation Decks
                        </h1>
                        <p className="text-xs text-clay-charcoal/75 font-medium mt-0.5">
                            Select a deck to open the gesture-controlled presenter studio.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        className="clay-btn-gold px-4 py-2.5 text-xs inline-flex items-center space-x-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Presentation</span>
                    </button>
                </div>

                {/* Presentation Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {presentations.map((item) => (
                        <div
                            key={item.id}
                            className="clay-card p-6 flex flex-col justify-between"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span
                                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                                            item.is_sample
                                                ? 'bg-clay-gold text-clay-charcoal'
                                                : 'bg-clay-charcoal text-clay-cream'
                                        }`}
                                    >
                                        {item.is_sample ? 'Sample Deck' : 'Custom Deck'}
                                    </span>
                                    <span className="text-xs text-clay-charcoal/70 font-mono font-bold">
                                        {item.slides_data?.length || 1} slides
                                    </span>
                                </div>

                                <h3 className="font-black text-clay-charcoal text-lg">
                                    {item.title}
                                </h3>

                                <p className="text-xs text-clay-charcoal/75 line-clamp-3 font-medium">
                                    {item.description || 'Gesture-enabled presentation ready for real-time delivery.'}
                                </p>
                            </div>

                            <div className="mt-6 pt-4 border-t border-clay-gray/50 flex items-center justify-between">
                                <Link
                                    href={`/presentations/${item.id}`}
                                    className="clay-btn-dark px-4 py-2 text-xs inline-flex items-center space-x-1.5"
                                >
                                    <Play className="w-3.5 h-3.5 fill-clay-gold text-clay-gold" />
                                    <span>Start Presenting</span>
                                </Link>

                                <span className="text-xs text-clay-charcoal/60 font-mono font-bold">
                                    {item.aspect_ratio || '16:9'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Create Presentation Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-clay-charcoal/50 backdrop-blur-sm">
                        <div className="clay-card max-w-lg w-full p-6 relative">
                            <div className="flex items-center justify-between pb-3 border-b border-clay-gray/60">
                                <h3 className="text-base font-black text-clay-charcoal">
                                    Create New Presentation Deck
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="clay-btn-light w-8 h-8 flex items-center justify-center text-xs font-bold"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
                                <div>
                                    <label className="block text-clay-charcoal font-bold mb-1">
                                        Presentation Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        required
                                        placeholder="e.g. PointDex Capstone Defense"
                                        className="w-full clay-inset px-3.5 py-2.5 text-clay-charcoal font-semibold focus:outline-none focus:ring-2 focus:ring-clay-gold"
                                    />
                                    {errors.title && <p className="text-red-600 font-bold mt-1">{errors.title}</p>}
                                </div>

                                <div>
                                    <label className="block text-clay-charcoal font-bold mb-1">
                                        Description / Subtitle
                                    </label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                        placeholder="Brief summary or group name..."
                                        className="w-full clay-inset px-3.5 py-2.5 text-clay-charcoal font-semibold focus:outline-none focus:ring-2 focus:ring-clay-gold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-clay-charcoal font-bold mb-1">
                                        Cloud Presentation URL (Optional)
                                    </label>
                                    <input
                                        type="url"
                                        value={data.presentation_url}
                                        onChange={(e) => setData('presentation_url', e.target.value)}
                                        placeholder="https://docs.google.com/presentation/..."
                                        className="w-full clay-inset px-3.5 py-2.5 text-clay-charcoal font-semibold focus:outline-none focus:ring-2 focus:ring-clay-gold"
                                    />
                                </div>

                                <div className="pt-2 flex justify-end space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="clay-btn-light px-4 py-2 text-xs"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="clay-btn-gold px-5 py-2 text-xs"
                                    >
                                        {processing ? 'Creating...' : 'Create Deck'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </PointDexLayout>
    );
}