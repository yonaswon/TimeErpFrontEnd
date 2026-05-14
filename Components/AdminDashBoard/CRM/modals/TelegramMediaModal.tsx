'use client';
import React, { useEffect, useState } from 'react';
import { X, Send, Download, FileText } from 'lucide-react';
import api from '../../../../api';

interface Props {
    msgId: number;
    onClose: () => void;
}

export default function TelegramMediaModal({ msgId, onClose }: Props) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        let mounted = true;
        api.get(`/lead/crm/telegram-message/${msgId}/`)
            .then((res) => { if (mounted) setData(res.data); })
            .catch((err) => { if (mounted) setError(err?.response?.data?.detail || 'Failed to load.'); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [msgId]);

    const isImage = data?.mime_type?.startsWith('image/') || data?.message_type === 'photo';
    const isAudio = data?.mime_type?.startsWith('audio/') || data?.message_type === 'voice' || data?.message_type === 'audio';
    const isVideo = data?.mime_type?.startsWith('video/') || data?.message_type === 'video';

    return (
        <div className="crm-modal-overlay" onClick={onClose}>
            <div className="crm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="crm-modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Send size={18} />
                        <strong>Telegram Message</strong>
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
                                    <div style={{ fontSize: 11, color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>From</div>
                                    <div style={{ fontWeight: 600 }}>{data.is_outgoing ? 'You (Sales)' : (data.sender_name || 'Unknown')}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>Type</div>
                                    <div style={{ fontWeight: 600 }}>{data.message_type || 'text'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>When</div>
                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{data.timestamp ? new Date(data.timestamp).toLocaleString() : '-'}</div>
                                </div>
                                {data.file_name && (
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--admin-text-secondary)', textTransform: 'uppercase' }}>File</div>
                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{data.file_name}</div>
                                    </div>
                                )}
                            </div>

                            {data.media_url && isImage && (
                                <div className="crm-modal-section">
                                    <img src={data.media_url} alt="Telegram media" className="crm-modal-image" />
                                </div>
                            )}

                            {data.media_url && isAudio && (
                                <div className="crm-modal-section">
                                    <h4>Audio</h4>
                                    <audio src={data.media_url} controls style={{ width: '100%' }} />
                                </div>
                            )}

                            {data.media_url && isVideo && (
                                <div className="crm-modal-section">
                                    <video src={data.media_url} controls style={{ width: '100%', maxHeight: '60vh', borderRadius: 8 }} />
                                </div>
                            )}

                            {data.media_url && !isImage && !isAudio && !isVideo && (
                                <div className="crm-modal-section">
                                    <a
                                        href={data.media_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#2563eb', color: 'white', borderRadius: 8, textDecoration: 'none' }}
                                    >
                                        <Download size={16} /> Download file
                                    </a>
                                </div>
                            )}

                            {data.message_text && (
                                <div className="crm-modal-section">
                                    <h4>Message Text</h4>
                                    <div className="crm-transcript">{data.message_text}</div>
                                </div>
                            )}

                            {data.ai_transcript && (
                                <div className="crm-modal-section">
                                    <h4><FileText size={12} style={{ display: 'inline', marginRight: 6 }} />AI {isImage ? 'Description / OCR' : 'Transcript'}</h4>
                                    <div className="crm-transcript">{data.ai_transcript}</div>
                                </div>
                            )}

                            {!data.ai_transcript && data.media_url && (
                                <div className="crm-modal-section">
                                    <div style={{ color: 'var(--admin-text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '8px' }}>
                                        {data.ai_processed ? 'No AI analysis available.' : 'AI analysis pending…'}
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
