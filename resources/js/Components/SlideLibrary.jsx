import React, { useCallback, useState } from 'react';
import { Check, FileText, Image as ImageIcon, Presentation as DeckIcon, Loader2, Trash2 } from 'lucide-react';
import { PdfThumbnail, PptxThumbnail, PptxThumbnailSource } from '@/Components/DeckRenderers';

const TYPE_ICONS = { pdf: FileText, pptx: DeckIcon, image: ImageIcon };

/**
 * Every page of every file uploaded to this presentation, so slides that were
 * removed can be picked and added back.
 */
export default function SlideLibrary({ assets, slides, onAdd, onDeleteAsset }) {
    const [selected, setSelected] = useState([]); // ["assetId:page", ...] in click order
    const [pptxNodes, setPptxNodes] = useState({});
    const [pendingDeleteId, setPendingDeleteId] = useState(null);

    const inDeck = new Set(slides.map((s) => `${s.asset_id}:${s.page}`));

    const handlePptxReady = useCallback((asset, nodes) => {
        setPptxNodes((prev) => ({ ...prev, [asset.id]: nodes }));
    }, []);

    const toggle = (id) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const addSelected = () => {
        onAdd(selected.map((id) => {
            const [assetId, page] = id.split(':').map(Number);
            return { asset_id: assetId, page };
        }));
    };

    if (assets.length === 0) {
        return (
            <p className="clay-inset p-4 text-center font-semibold text-clay-charcoal/70">
                No files have been uploaded to this presentation yet.
            </p>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-[11px] font-medium text-clay-charcoal/70">
                Every slide from the files and links you've uploaded to this presentation. Pick the ones
                to add back; they go to the end of the deck.
            </p>

            {assets
                .filter((asset) => asset.type === 'pptx')
                .map((asset) => (
                    <PptxThumbnailSource key={asset.id} asset={asset} onReady={handlePptxReady} onError={() => {}} />
                ))}

            <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
                {assets.map((asset) => {
                    const Icon = TYPE_ICONS[asset.type] || FileText;
                    const pages = asset.page_count ?? 0;
                    return (
                        <div key={asset.id} className="clay-inset p-3 space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                                <span className="flex items-center gap-1.5 min-w-0 font-bold text-clay-charcoal">
                                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="truncate">{asset.original_filename || 'File'}</span>
                                    {asset.page_count != null && (
                                        <span className="text-[10px] font-mono text-clay-charcoal/60 flex-shrink-0">
                                            {pages} {pages === 1 ? 'slide' : 'slides'}
                                        </span>
                                    )}
                                </span>

                                {pendingDeleteId === asset.id ? (
                                    <span className="flex items-center gap-1 flex-shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPendingDeleteId(null);
                                                setSelected((prev) => prev.filter((id) => !id.startsWith(`${asset.id}:`)));
                                                onDeleteAsset(asset);
                                            }}
                                            className="px-2 py-0.5 rounded-lg bg-red-600 text-white text-[10px] font-bold"
                                        >
                                            Delete file
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPendingDeleteId(null)}
                                            className="px-2 py-0.5 rounded-lg clay-btn-light text-[10px]"
                                        >
                                            Keep
                                        </button>
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setPendingDeleteId(asset.id)}
                                        title="Delete this file for good (also removes its slides)"
                                        className="text-clay-charcoal/50 hover:text-red-600 flex-shrink-0"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {asset.page_count == null ? (
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-clay-charcoal/60">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-clay-gold" />
                                    <span>Still reading this file...</span>
                                </div>
                            ) : (
                                <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))]">
                                    {Array.from({ length: pages }, (_, page) => {
                                        const id = `${asset.id}:${page}`;
                                        const isSelected = selected.includes(id);
                                        return (
                                            <button
                                                key={id}
                                                type="button"
                                                onClick={() => toggle(id)}
                                                className={`relative aspect-video rounded-lg overflow-hidden bg-black transition-all ${
                                                    isSelected ? 'ring-[3px] ring-clay-gold' : 'ring-1 ring-clay-gray hover:ring-clay-gold/60'
                                                }`}
                                            >
                                                {asset.type === 'image' && (
                                                    <img src={asset.url} alt="" className="absolute inset-0 w-full h-full object-contain" />
                                                )}
                                                {asset.type === 'pdf' && <PdfThumbnail url={asset.url} page={page} />}
                                                {asset.type === 'pptx' && <PptxThumbnail node={pptxNodes[asset.id]?.[page] || null} />}

                                                <span className="absolute top-1 right-1 z-10 px-1 rounded bg-clay-charcoal/85 text-clay-cream text-[9px] font-mono font-bold">
                                                    {page + 1}
                                                </span>
                                                {inDeck.has(id) && (
                                                    <span className="absolute bottom-1 left-1 z-10 px-1 rounded bg-emerald-600 text-white text-[8px] font-bold">
                                                        In deck
                                                    </span>
                                                )}
                                                {isSelected && (
                                                    <span className="absolute top-1 left-1 z-10 w-4 h-4 rounded-full bg-clay-gold flex items-center justify-center">
                                                        <Check className="w-3 h-3 text-clay-charcoal" />
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-end">
                <button
                    type="button"
                    disabled={selected.length === 0}
                    onClick={addSelected}
                    className="clay-btn-gold px-5 py-2 text-xs disabled:opacity-50"
                >
                    {selected.length === 0
                        ? 'Select slides to add'
                        : `Add ${selected.length} ${selected.length === 1 ? 'slide' : 'slides'}`}
                </button>
            </div>
        </div>
    );
}
