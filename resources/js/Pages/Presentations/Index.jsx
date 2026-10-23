import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PointDexLayout from '@/Layouts/PointDexLayout';
import PresentationSourceModal from '@/Components/PresentationSourceModal';
import { Plus, Play, Trash2 } from 'lucide-react';

const TYPE_LABELS = { pdf: 'PDF', pptx: 'PowerPoint', image: 'Picture' };

// e.g. "PowerPoint · 3 Pictures"
function contentSummary(assets = []) {
    const counts = {};
    assets.forEach((asset) => {
        counts[asset.type] = (counts[asset.type] || 0) + 1;
    });
    return Object.entries(counts)
        .map(([type, count]) => (count > 1 ? `${count} ${TYPE_LABELS[type]}s` : TYPE_LABELS[type]))
        .join(' · ');
}

export default function PresentationsIndex({ presentations = [] }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);

    const deleteDeck = (id) => {
        router.delete(`/presentations/${id}`, {
            preserveScroll: true,
            onFinish: () => setPendingDeleteId(null),
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

                {presentations.length === 0 && (
                    <div className="clay-inset p-8 text-center space-y-3">
                        <p className="text-sm font-bold text-clay-charcoal">You don't have any presentations yet.</p>
                        <p className="text-xs text-clay-charcoal/70 font-medium">
                            Upload a PowerPoint, PDF or pictures, or paste a Google Slides link to get started.
                        </p>
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(true)}
                            className="clay-btn-gold px-4 py-2 text-xs inline-flex items-center space-x-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New Presentation</span>
                        </button>
                    </div>
                )}

                {/* Presentation Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {presentations.map((item) => (
                        <div
                            key={item.id}
                            className="clay-card p-6 flex flex-col justify-between"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase bg-clay-charcoal text-clay-cream truncate">
                                        {contentSummary(item.assets) || 'Empty'}
                                    </span>
                                    <span className="text-xs text-clay-charcoal/70 font-mono font-bold flex-shrink-0">
                                        {item.slides_data?.length || 0} slides
                                    </span>
                                </div>

                                <h3 className="font-black text-clay-charcoal text-lg">
                                    {item.title}
                                </h3>

                                <p className="text-xs text-clay-charcoal/75 line-clamp-3 font-medium">
                                    {item.description || item.assets?.[0]?.original_filename || 'Gesture-enabled presentation ready for real-time delivery.'}
                                </p>
                            </div>

                            <div className="mt-6 pt-4 border-t border-clay-gray/50 flex items-center justify-between gap-2">
                                <Link
                                    href={`/presentations/${item.id}`}
                                    className="clay-btn-dark px-4 py-2 text-xs inline-flex items-center space-x-1.5"
                                >
                                    <Play className="w-3.5 h-3.5 fill-clay-gold text-clay-gold" />
                                    <span>Start Presenting</span>
                                </Link>

                                {pendingDeleteId === item.id ? (
                                    <div className="flex items-center space-x-1.5">
                                        <button
                                            type="button"
                                            onClick={() => deleteDeck(item.id)}
                                            className="px-2.5 py-1.5 rounded-xl bg-red-600 text-white text-[11px] font-bold"
                                        >
                                            Delete
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPendingDeleteId(null)}
                                            className="clay-btn-light px-2.5 py-1.5 text-[11px]"
                                        >
                                            Keep
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setPendingDeleteId(item.id)}
                                        title="Delete deck"
                                        className="clay-btn-light p-2"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 text-clay-charcoal" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showCreateModal && (
                <PresentationSourceModal mode="create" onClose={() => setShowCreateModal(false)} />
            )}
        </PointDexLayout>
    );
}
