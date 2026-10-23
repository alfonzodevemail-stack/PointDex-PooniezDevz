import React, { useRef, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Upload, Link2, X, FileText, Image as ImageIcon, Presentation as DeckIcon } from 'lucide-react';

const ACCEPT = '.pptx,.ppt,.pdf,.jpg,.jpeg,.png,.gif,.webp,image/*,application/pdf,'
    + 'application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint';

const SOURCES = [
    { key: 'file', label: 'Upload Files', icon: Upload },
    { key: 'link', label: 'From Link', icon: Link2 },
];

const COPY = {
    create: { heading: 'Create New Presentation', submit: 'Create Presentation', busy: 'Importing...' },
    add: { heading: 'Add to Presentation', submit: 'Add Slides', busy: 'Adding...' },
    replace: { heading: 'Replace Presentation', submit: 'Replace', busy: 'Replacing...' },
};

function FileKindIcon({ name }) {
    if (/\.(jpe?g|png|gif|webp)$/i.test(name)) return <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />;
    if (/\.pdf$/i.test(name)) return <FileText className="w-3.5 h-3.5 flex-shrink-0" />;
    return <DeckIcon className="w-3.5 h-3.5 flex-shrink-0" />;
}

/**
 * Upload PowerPoint / PDF / pictures or paste a link.
 * mode "create" makes a new presentation, "add" appends slides, "replace" swaps all content.
 */
export default function PresentationSourceModal({ mode = 'create', presentationId = null, onClose }) {
    const copy = COPY[mode];
    const inputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    const { data, setData, post, processing, progress, errors, clearErrors } = useForm({
        source: 'file',
        title: '',
        description: '',
        presentation_url: '',
        files: [],
        replace: mode === 'replace',
    });

    const fileErrors = Object.entries(errors)
        .filter(([key]) => key === 'files' || key.startsWith('files.'))
        .map(([, message]) => message);

    const addFiles = (fileList) => {
        const incoming = Array.from(fileList || []);
        if (!incoming.length) return;
        clearErrors();
        setData((prev) => ({
            ...prev,
            files: [...prev.files, ...incoming],
            // Pre-fill the title from the first file name, without the extension.
            title: prev.title || incoming[0].name.replace(/\.[^.]+$/, ''),
        }));
    };

    const removeFile = (index) => {
        setData('files', data.files.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const url = mode === 'create' ? '/presentations' : route('presentations.content.store', presentationId);
        post(url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-clay-charcoal/50 backdrop-blur-sm">
            <div className="clay-card max-w-lg w-full p-6 relative max-h-[calc(100vh-2rem)] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-clay-gray/60">
                    <h3 className="text-base font-black text-clay-charcoal">{copy.heading}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="clay-btn-light w-8 h-8 flex items-center justify-center"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
                    {mode === 'replace' && (
                        <p className="rounded-xl bg-clay-gold/20 px-3 py-2 font-bold text-clay-charcoal">
                            All current slides will be replaced with the new file or link.
                        </p>
                    )}

                    <div className="grid grid-cols-2 gap-2">
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
                                PowerPoint, PDF or Pictures *
                            </label>
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => inputRef.current?.click()}
                                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    addFiles(e.dataTransfer.files);
                                }}
                                className={`w-full clay-inset px-3.5 py-5 flex flex-col items-center justify-center text-center cursor-pointer hover:ring-2 hover:ring-clay-gold ${
                                    isDragging ? 'ring-2 ring-clay-gold' : ''
                                }`}
                            >
                                <Upload className="w-5 h-5 text-clay-charcoal mb-1.5" />
                                <span className="font-bold text-clay-charcoal">
                                    Click or drop files here
                                </span>
                                <span className="text-[10px] text-clay-charcoal/60 mt-0.5">
                                    .pptx, .ppt, .pdf, .jpg, .png, .gif, .webp · up to 100 MB each · pick several at once
                                </span>
                                <input
                                    ref={inputRef}
                                    type="file"
                                    multiple
                                    accept={ACCEPT}
                                    onChange={(e) => {
                                        addFiles(e.target.files);
                                        e.target.value = '';
                                    }}
                                    className="hidden"
                                />
                            </div>

                            {data.files.length > 0 && (
                                <ul className="mt-2 space-y-1.5">
                                    {data.files.map((file, index) => (
                                        <li
                                            key={`${file.name}-${index}`}
                                            className="clay-card-sm px-3 py-1.5 flex items-center justify-between gap-2 font-semibold text-clay-charcoal"
                                        >
                                            <span className="flex items-center gap-2 min-w-0">
                                                <FileKindIcon name={file.name} />
                                                <span className="truncate">{file.name}</span>
                                            </span>
                                            <span className="flex items-center gap-2 flex-shrink-0">
                                                <span className="text-[10px] text-clay-charcoal/60 font-mono">
                                                    {(file.size / 1024 / 1024).toFixed(1)} MB
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(index)}
                                                    className="text-clay-charcoal/50 hover:text-red-600"
                                                    aria-label={`Remove ${file.name}`}
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {fileErrors.map((message) => (
                                <p key={message} className="text-red-600 font-bold mt-1">{message}</p>
                            ))}

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
                                share links, or a direct link to a .pptx, .pdf or picture.
                            </p>
                            {errors.presentation_url && (
                                <p className="text-red-600 font-bold mt-1">{errors.presentation_url}</p>
                            )}
                        </div>
                    )}

                    {mode === 'create' && (
                        <>
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
                        </>
                    )}

                    <div className="pt-2 flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="clay-btn-light px-4 py-2 text-xs">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="clay-btn-gold px-5 py-2 text-xs disabled:opacity-60"
                        >
                            {processing ? copy.busy : copy.submit}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
