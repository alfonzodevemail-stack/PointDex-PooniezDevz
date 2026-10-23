import React, { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import PointDexLayout from '@/Layouts/PointDexLayout';
import { Plus, Play, Upload, Link2, FileText, Trash2 } from 'lucide-react';

const SOURCES = [
    { key: 'file', label: 'Upload File', icon: Upload },
    { key: 'link', label: 'From Link', icon: Link2 },
    { key: 'blank', label: 'Blank Deck', icon: FileText },
];

const DECK_LABELS = {
    pdf: 'PDF',
    pptx: 'PowerPoint',
    slides: null,
};

export default function PresentationsIndex({ presentations = [] }) {
    const { auth } = usePage().props;
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);

    const { data, setData, post, processing, progress, errors, reset, clearErrors } = useForm({
        source: 'file',
        title: '',
        description: '',
        aspect_ratio: '16:9',
        presentation_url: '',
        file: null,
    });

    const closeModal = () => {
        setShowCreateModal(false);
        clearErrors();
        reset();
    };

    const handleFileChange = (file) => {
        setData((prev) => ({
            ...prev,
            file,
            // Pre-fill the title from the file name, without the extension.
            title: prev.title || (file ? file.name.replace(/\.(pptx?|pdf)$/i, '') : ''),
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/presentations', {
            forceFormData: data.source === 'file',
            onSuccess: () => {
                setShowCreateModal(false);
                reset();
            },
        });
    };

    const deleteDeck = (id) => {
        router.delete(`/presentations/${id}`, {
            preserveScroll: true,
            onFinish: () => setPendingDeleteId(null),
        });
    };

    const deckSummary = (item) => {
        if (DECK_LABELS[item.source_type]) {
            return DECK_LABELS[item.source_type];
        }
        return `${item.slides_data?.length || 1} slides`;
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
                                        {deckSummary(item)}
                                    </span>
                                </div>

                                <h3 className="font-black text-clay-charcoal text-lg">
                                    {item.title}
                                </h3>

                                <p className="text-xs text-clay-charcoal/75 line-clamp-3 font-medium">
                                    {item.description || item.original_filename || 'Gesture-enabled presentation ready for real-time delivery.'}
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

                                {item.user_id === auth.user?.id && !item.is_sample ? (
                                    pendingDeleteId === item.id ? (
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
                                    )
                                ) : (
                                    <span className="text-xs text-clay-charcoal/60 font-mono font-bold">
                                        {item.aspect_ratio || '16:9'}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Create Presentation Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-clay-charcoal/50 backdrop-blur-sm">
                        <div className="clay-card max-w-lg w-full p-6 relative max-h-[calc(100vh-2rem)] overflow-y-auto">
                            <div className="flex items-center justify-between pb-3 border-b border-clay-gray/60">
                                <h3 className="text-base font-black text-clay-charcoal">
                                    Create New Presentation Deck
                                </h3>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="clay-btn-light w-8 h-8 flex items-center justify-center text-xs font-bold"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
                                <div className="grid grid-cols-3 gap-2">
                                    {SOURCES.map(({ key, label, icon: Icon }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => {
                                                clearErrors();
                                                setData('source', key);
                                            }}
                                            className={`py-2 px-2 text-[11px] inline-flex items-center justify-center space-x-1.5 ${
                                                data.source === key ? 'clay-btn-gold' : 'clay-btn-light'
                                            }`}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            <span>{label}</span>
                                        </button>
                                    ))}
                                </div>

                                {data.source === 'file' && (
                                    <div>
                                        <label className="block text-clay-charcoal font-bold mb-1">
                                            PowerPoint or PDF File *
                                        </label>
                                        <label className="w-full clay-inset px-3.5 py-5 flex flex-col items-center justify-center text-center cursor-pointer hover:ring-2 hover:ring-clay-gold">
                                            <Upload className="w-5 h-5 text-clay-charcoal mb-1.5" />
                                            <span className="font-bold text-clay-charcoal">
                                                {data.file ? data.file.name : 'Click to choose a .pptx, .ppt or .pdf file'}
                                            </span>
                                            <span className="text-[10px] text-clay-charcoal/60 mt-0.5">
                                                {data.file
                                                    ? `${(data.file.size / 1024 / 1024).toFixed(1)} MB`
                                                    : 'Up to 100 MB'}
                                            </span>
                                            <input
                                                type="file"
                                                accept=".pptx,.ppt,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint"
                                                onChange={(e) => handleFileChange(e.target.files[0] || null)}
                                                className="hidden"
                                            />
                                        </label>
                                        {errors.file && <p className="text-red-600 font-bold mt-1">{errors.file}</p>}
                                        {progress && (
                                            <div className="w-full clay-inset h-2 rounded-full overflow-hidden mt-2">
                                                <div
                                                    className="h-full bg-clay-gold transition-all"
                                                    style={{ width: `${progress.percentage}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {data.source === 'link' && (
                                    <div>
                                        <label className="block text-clay-charcoal font-bold mb-1">
                                            Presentation Link *
                                        </label>
                                        <input
                                            type="url"
                                            value={data.presentation_url}
                                            onChange={(e) => setData('presentation_url', e.target.value)}
                                            required
                                            placeholder="https://docs.google.com/presentation/d/..."
                                            className="w-full clay-inset px-3.5 py-2.5 text-clay-charcoal font-semibold focus:outline-none focus:ring-2 focus:ring-clay-gold"
                                        />
                                        <p className="text-[10px] text-clay-charcoal/65 font-medium mt-1">
                                            Google Slides links (shared as "Anyone with the link"), OneDrive/SharePoint
                                            share links, or a direct link to a .pptx / .pdf file.
                                        </p>
                                        {errors.presentation_url && (
                                            <p className="text-red-600 font-bold mt-1">{errors.presentation_url}</p>
                                        )}
                                    </div>
                                )}

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
                                        rows={2}
                                        placeholder="Brief summary or group name..."
                                        className="w-full clay-inset px-3.5 py-2.5 text-clay-charcoal font-semibold focus:outline-none focus:ring-2 focus:ring-clay-gold"
                                    />
                                </div>

                                <div className="pt-2 flex justify-end space-x-2">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="clay-btn-light px-4 py-2 text-xs"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="clay-btn-gold px-5 py-2 text-xs"
                                    >
                                        {processing
                                            ? data.source === 'blank' ? 'Creating...' : 'Importing...'
                                            : 'Create Deck'}
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
