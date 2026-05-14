'use client';
import React, { useEffect, useRef, useState } from 'react';
import { X, Play, Pause, Phone, AlertTriangle, CheckSquare, FileText } from 'lucide-react';
import api from '../../../../api';

interface Props {
    callLogId: number;
    onClose: () => void;
}

export default function CallDetailModal({ callLogId, onClose }: Props) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [data, setData] = useState<any>(null);
    const [playing, setPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        let mounted = true;
        api.get(`/lead/crm/call/${callLogId}/`)
            .then((res) => { if (mounted) setData(res.data); })
            .catch((err) => { if (mounted) setError(err?.response?.data?.detail || 'Failed to load call detail.'); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [callLogId]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (playing) {
            audio.pause();
        } else {
            audio.play();
        }
        setPlaying(!playing);
    };

    const fmtDuration = (s: number) => {
        if (!s) return '0:00';
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <div className="crm-modal-overlay" onClick={onClose}>
            <div className="crm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="crm-modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Phone size={18} />
                        <strong>Call Details</strong>
                    </div>
                    <button className="crm-modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="crm-modal-body">
                    {loading && <div style={{ textAlign: 'center', padding: '40px' }}>Loading…</div>}
                    {error && <div style={{ color: 'var(--admin-danger)', padding: '20px' }}>{error}</div>}
                    {data && (
                        <>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>Caller</div>
                                    <div style={{ fontWeight: 600 }}>{data.call.full_name || data.call.phone_number}</div>
                                    {data.call.full_name && <div style={{ fontSize: 12, color: 'var(--admin-text-secondary)' }}>{data.call.phone_number}</div>}
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>Status</div>
                                    <div style={{ fontWeight: 600 }}>{data.call.status || '-'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>Duration</div>
                                    <div style={{ fontWeight: 600 }}>{fmtDuration(data.call.duration)}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>Sales</div>
                                    <div style={{ fontWeight: 600 }}>{data.call.sales?.full_name || '-'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>When</div>
                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{data.call.started_at ? new Date(data.call.started_at).toLocaleString() : '-'}</div>
                                </div>
                            </div>

                            {data.recording?.audio_url && (
                                <div className="crm-modal-section">
                                    <h4>Recording</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--admin-bg, #f7f8fa)', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                                        <button
                                            onClick={togglePlay}
                                            style={{ width: 42, height: 42, borderRadius: '50%', background: '#2563eb', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            {playing ? <Pause size={18} /> : <Play size={18} />}
                                        </button>
                                        <audio
                                            ref={audioRef}
                                            src={data.recording.audio_url}
                                            controls
                                            style={{ flex: 1 }}
                                            onPlay={() => setPlaying(true)}
                                            onPause={() => setPlaying(false)}
                                            onEnded={() => setPlaying(false)}
                                        />
                                    </div>
                                </div>
                            )}

                            {data.analysis?.transcript && (
                                <div className="crm-modal-section">
                                    <h4><FileText size={12} style={{ display: 'inline', marginRight: 6 }} />Transcript</h4>
                                    <div className="crm-transcript">{data.analysis.transcript}</div>
                                </div>
                            )}

                            {data.analysis?.ai_summary && (
                                <div className="crm-modal-section">
                                    <h4>AI Summary</h4>
                                    <div className="crm-transcript" style={{ fontStyle: 'italic' }}>{data.analysis.ai_summary}</div>
                                </div>
                            )}

                            {data.analysis?.action_items?.length > 0 && (
                                <div className="crm-modal-section">
                                    <h4><CheckSquare size={12} style={{ display: 'inline', marginRight: 6 }} />Action Items</h4>
                                    <ul style={{ paddingLeft: 20, fontSize: 13, color: 'var(--admin-text)' }}>
                                        {data.analysis.action_items.map((it: any, i: number) => (
                                            <li key={i} style={{ marginBottom: 4 }}>{typeof it === 'string' ? it : JSON.stringify(it)}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {data.analysis?.red_flags?.length > 0 && (
                                <div className="crm-modal-section">
                                    <h4 style={{ color: 'var(--admin-danger, #dc2626)' }}>
                                        <AlertTriangle size={12} style={{ display: 'inline', marginRight: 6 }} />Red Flags
                                    </h4>
                                    <ul style={{ paddingLeft: 20, fontSize: 13, color: 'var(--admin-danger, #dc2626)' }}>
                                        {data.analysis.red_flags.map((it: any, i: number) => (
                                            <li key={i} style={{ marginBottom: 4 }}>{typeof it === 'string' ? it : JSON.stringify(it)}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {!data.analysis && (
                                <div className="crm-modal-section">
                                    <div style={{ color: 'var(--admin-text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '12px' }}>
                                        No transcript/analysis yet (may still be processing).
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
