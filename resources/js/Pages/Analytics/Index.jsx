import React from 'react';
import { Head } from '@inertiajs/react';
import PointDexLayout from '@/Layouts/PointDexLayout';
import { FileSpreadsheet } from 'lucide-react';

export default function AnalyticsIndex({ sessions = [], metrics = {} }) {
    const {
        totalSessions = 0,
        totalGestures = 0,
        avgLatency = 0,
        avgFps = 0,
    } = metrics;

    const exportCsv = () => {
        const headers = ['Session Code', 'Mode', 'Lighting', 'Distance (m)', 'FPS', 'Latency (ms)', 'Gestures'];
        const rows = sessions.map((s) => [
            s.session_code,
            s.mode,
            s.lighting_condition,
            s.distance_meters,
            s.avg_fps,
            s.avg_latency_ms,
            s.total_gestures_detected,
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].map((e) => e.join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'pointdex_logs.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <PointDexLayout title="Analytics">
            <Head title="Analytics - PointDex" />

            <div className="space-y-6">
                <div className="clay-card-sm p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-black text-clay-charcoal">
                            Session Logs &amp; Telemetry
                        </h1>
                        <p className="text-xs text-clay-charcoal/75 font-medium mt-0.5">
                            Recorded gesture logs and frame rate data from presentation sessions.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={exportCsv}
                        className="clay-btn-dark px-4 py-2 text-xs inline-flex items-center space-x-2"
                    >
                        <FileSpreadsheet className="w-4 h-4 text-clay-gold" />
                        <span>Export CSV</span>
                    </button>
                </div>

                {/* Real Database Totals */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="clay-card-sm p-5">
                        <span className="text-xs font-bold text-clay-charcoal/70">Total Sessions</span>
                        <div className="text-2xl font-black text-clay-charcoal font-mono mt-1">
                            {totalSessions}
                        </div>
                    </div>

                    <div className="clay-card-sm p-5">
                        <span className="text-xs font-bold text-clay-charcoal/70">Gestures Logged</span>
                        <div className="text-2xl font-black text-clay-charcoal font-mono mt-1">
                            {totalGestures}
                        </div>
                    </div>

                    <div className="clay-card-sm p-5">
                        <span className="text-xs font-bold text-clay-charcoal/70">Avg Latency</span>
                        <div className="text-2xl font-black text-clay-charcoal font-mono mt-1">
                            {avgLatency} ms
                        </div>
                    </div>

                    <div className="clay-card-sm p-5">
                        <span className="text-xs font-bold text-clay-charcoal/70">Avg Frame Rate</span>
                        <div className="text-2xl font-black text-clay-charcoal font-mono mt-1">
                            {avgFps} FPS
                        </div>
                    </div>
                </div>

                {/* Recent Sessions Table */}
                <div className="clay-card p-6 space-y-4">
                    <h2 className="text-base font-black text-clay-charcoal">
                        Recent Sessions
                    </h2>

                    <div className="overflow-x-auto clay-inset p-3">
                        <table className="w-full text-xs text-left text-clay-charcoal">
                            <thead className="uppercase font-extrabold border-b border-clay-gray">
                                <tr>
                                    <th className="px-3 py-2.5">Session Code</th>
                                    <th className="px-3 py-2.5">Mode</th>
                                    <th className="px-3 py-2.5">Lighting</th>
                                    <th className="px-3 py-2.5">Distance</th>
                                    <th className="px-3 py-2.5">Gestures</th>
                                    <th className="px-3 py-2.5">Avg FPS</th>
                                    <th className="px-3 py-2.5">Latency</th>
                                    <th className="px-3 py-2.5">Duration</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-clay-gray/50 font-medium">
                                {sessions.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-3 py-6 text-center text-clay-charcoal/60">
                                            No sessions recorded yet. Open a presentation to start logging.
                                        </td>
                                    </tr>
                                ) : (
                                    sessions.map((s) => (
                                        <tr key={s.id}>
                                            <td className="px-3 py-2.5 font-mono font-bold">{s.session_code}</td>
                                            <td className="px-3 py-2.5">{s.mode}</td>
                                            <td className="px-3 py-2.5">{s.lighting_condition}</td>
                                            <td className="px-3 py-2.5">{s.distance_meters}m</td>
                                            <td className="px-3 py-2.5 font-mono font-bold">{s.total_gestures_detected}</td>
                                            {s.total_frames_processed > 0 ? (
                                                <>
                                                    <td className="px-3 py-2.5 font-mono">{s.avg_fps}</td>
                                                    <td className="px-3 py-2.5 font-mono">{s.avg_latency_ms} ms</td>
                                                    <td className="px-3 py-2.5 font-mono">
                                                        {Math.floor(s.duration_seconds / 60)}m {s.duration_seconds % 60}s
                                                    </td>
                                                </>
                                            ) : (
                                                <td colSpan={3} className="px-3 py-2.5 text-clay-charcoal/50">
                                                    Not measured
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </PointDexLayout>
    );
}