import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import PointDexLayout from '@/Layouts/PointDexLayout';
import { 
    Presentation, 
    Plus, 
    Play, 
    Trash2, 
    ExternalLink, 
    Sparkles, 
    Layers,
    FileText,
    Check
} from 'lucide-react';

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
            }
        });
    };

    return (
        <PointDexLayout title="My Presentations">
            <Head title="My Presentations - PointDex" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-white">Presentation Decks</h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Select a presentation to launch into gesture-controlled presenter mode.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition"
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
                            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition group"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                                        item.is_sample 
                                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                    }`}>
                                        {item.is_sample ? 'Sample Deck' : 'Custom'}
                                    </span>
                                    <span className="text-xs text-slate-400 font-mono">
                                        {item.slides_data?.length || 1} slides
                                    </span>
                                </div>

                                <h3 className="font-extrabold text-white text-lg group-hover:text-indigo-400 transition">
                                    {item.title}
                                </h3>

                                <p className="text-xs text-slate-400 line-clamp-3">
                                    {item.description || 'Gesture-enabled presentation ready for real-time delivery.'}
                                </p>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                                <Link
                                    href={`/presentations/${item.id}`}
                                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition"
                                >
                                    <Play className="w-3.5 h-3.5 fill-white" />
                                    <span>Start Presenting</span>
                                </Link>

                                <span className="text-xs text-slate-500 font-mono">
                                    {item.aspect_ratio || '16:9'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Create Presentation Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <h3 className="text-base font-bold text-white">Create New Presentation Deck</h3>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-slate-400 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Presentation Title *</label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        required
                                        placeholder="e.g. AI & Future of Web Dev"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                    />
                                    {errors.title && <p className="text-red-400 mt-1">{errors.title}</p>}
                                </div>

                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Description / Topic</label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                        placeholder="Brief summary or subject matter..."
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-300 font-semibold mb-1">Cloud Presentation URL (Optional)</label>
                                    <input
                                        type="url"
                                        value={data.presentation_url}
                                        onChange={(e) => setData('presentation_url', e.target.value)}
                                        placeholder="e.g. https://docs.google.com/presentation/... or Canva link"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                                    />
                                    <p className="text-[11px] text-slate-500 mt-1">If blank, an interactive built-in PointDex slide deck will be generated.</p>
                                </div>

                                <div className="pt-2 flex justify-end space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow"
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
