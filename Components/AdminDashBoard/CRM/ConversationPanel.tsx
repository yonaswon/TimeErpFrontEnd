'use client';
import React, { useState } from 'react';
import {
    Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed,
    MessageCircle, Send, FileText,
    Package, Edit3, Play, Pause, MessageSquare,
} from 'lucide-react';
import CallDetailModal from './modals/CallDetailModal';
import TelegramMediaModal from './modals/TelegramMediaModal';

export interface TimelineEvent {
    type: 'call' | 'sms' | 'telegram' | 'mockup' | 'modification';
    id: number;
    timestamp: string;
    [key: string]: any;
}

interface Props {
    events: TimelineEvent[];
    leadName?: string;
    leadPhones?: { phone_number: string; label?: string }[];
    leadTelegrams?: { telegram_username?: string; telegram_phone?: string }[];
    stats?: { calls: number; sms: number; telegram: number; mockups: number; modifications: number };
    loading?: boolean;
}

function formatTime(ts: string): string {
    if (!ts) return '';
    try {
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
}

function formatDayLabel(ts: string): string {
    if (!ts) return '';
    try {
        const d = new Date(ts);
        const today = new Date();
        const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
        if (d.toDateString() === today.toDateString()) return 'Today';
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return ''; }
}

function fmtDuration(s: number) {
    if (!s) return '0:00';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function ConversationPanel({ events, leadName, leadPhones, leadTelegrams, stats, loading }: Props) {
    const [callModalId, setCallModalId] = useState<number | null>(null);
    const [tgModalId, setTgModalId] = useState<number | null>(null);
    const [playingCallId, setPlayingCallId] = useState<number | null>(null);
    const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

    const inlinePlay = (e: React.MouseEvent, callId: number, url: string) => {
        e.stopPropagation();
        if (playingCallId === callId) {
            audioEl?.pause();
            setPlayingCallId(null);
            setAudioEl(null);
            return;
        }
        audioEl?.pause();
        const a = new Audio(url);
        a.play().catch(() => {});
        a.onended = () => { setPlayingCallId(null); setAudioEl(null); };
        setAudioEl(a);
        setPlayingCallId(callId);
    };

    // Group events by day for dividers
    const grouped: { day: string; items: TimelineEvent[] }[] = [];
    for (const ev of events) {
        const day = formatDayLabel(ev.timestamp);
        const last = grouped[grouped.length - 1];
        if (last && last.day === day) last.items.push(ev);
        else grouped.push({ day, items: [ev] });
    }

    return (
        <div className="crm-center">
            <div className="crm-conv-header">
                <div className="crm-lead-avatar" style={{ width: 44, height: 44 }}>
                    {(leadName || '#').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="crm-conv-header-info">
                    <div className="crm-conv-header-name">{leadName || 'Unknown'}</div>
                    <div className="crm-conv-header-meta">
                        {leadPhones?.slice(0, 3).map((p, i) => (
                            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Phone size={11} /> {p.phone_number}{p.label ? ` (${p.label})` : ''}
                            </span>
                        ))}
                        {leadTelegrams?.filter(t => t.telegram_username || t.telegram_phone).slice(0, 2).map((t, i) => (
                            <span key={`tg${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Send size={11} /> {t.telegram_username || t.telegram_phone}
                            </span>
                        ))}
                    </div>
                </div>
                {stats && (
                    <div className="crm-conv-stats">
                        <span>📞 {stats.calls}</span>
                        <span>💬 {stats.sms}</span>
                        <span>✈️ {stats.telegram}</span>
                        <span>📦 {stats.mockups}</span>
                        <span>✏️ {stats.modifications}</span>
                    </div>
                )}
            </div>

            <div className="crm-timeline">
                {loading ? (
                    <div className="crm-empty"><div>Loading conversation…</div></div>
                ) : events.length === 0 ? (
                    <div className="crm-empty">
                        <MessageSquare size={48} />
                        <div>No conversation events yet.</div>
                    </div>
                ) : (
                    grouped.map((g, gi) => (
                        <React.Fragment key={gi}>
                            <div className="crm-day-divider">{g.day}</div>
                            {g.items.map((ev) => {
                                if (ev.type === 'call') {
                                    const isOut = ev.direction === 'OUTGOING';
                                    const isMissed = ev.status === 'MISSED' || ev.status === 'REJECTED';
                                    const Icon = isMissed ? PhoneMissed : (isOut ? PhoneOutgoing : PhoneIncoming);
                                    return (
                                        <div key={`c${ev.id}`} className={`crm-bubble-row ${isOut ? 'right' : ''}`}>
                                            <div
                                                className={`crm-bubble ${isOut ? 'right' : ''}`}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => setCallModalId(ev.id)}
                                            >
                                                <div className="crm-bubble-header">
                                                    <Icon size={14} />
                                                    <span>{isOut ? 'Outgoing call' : (isMissed ? 'Missed call' : 'Incoming call')}</span>
                                                    <span style={{ marginLeft: 'auto', opacity: 0.7, fontSize: 11 }}>{fmtDuration(ev.duration)}</span>
                                                </div>
                                                {ev.transcript && (
                                                    <div className="crm-ai-snippet">{ev.transcript.slice(0, 180)}{ev.transcript.length > 180 ? '…' : ''}</div>
                                                )}
                                                {ev.recording_url && (
                                                    <div className="crm-call-controls">
                                                        <button
                                                            className="crm-play-btn"
                                                            onClick={(e) => inlinePlay(e, ev.id, ev.recording_url)}
                                                        >
                                                            {playingCallId === ev.id ? <Pause size={14} /> : <Play size={14} />}
                                                        </button>
                                                        <span style={{ fontSize: 11, opacity: 0.7 }}>Recording</span>
                                                    </div>
                                                )}
                                                <div className="crm-bubble-time">{formatTime(ev.timestamp)} • {ev.phone}</div>
                                            </div>
                                        </div>
                                    );
                                }
                                if (ev.type === 'sms') {
                                    const isOut = ev.direction === 'OUTGOING';
                                    return (
                                        <div key={`s${ev.id}`} className={`crm-bubble-row ${isOut ? 'right' : ''}`}>
                                            <div className={`crm-bubble ${isOut ? 'right' : ''}`}>
                                                <div className="crm-bubble-header">
                                                    <MessageCircle size={12} /> <span>SMS</span>
                                                </div>
                                                <div style={{ whiteSpace: 'pre-wrap', fontSize: 13.5 }}>{ev.body}</div>
                                                <div className="crm-bubble-time">{formatTime(ev.timestamp)} • {ev.phone}</div>
                                            </div>
                                        </div>
                                    );
                                }
                                if (ev.type === 'telegram') {
                                    const isOut = !!ev.is_outgoing;
                                    const isImage = (ev.mime_type || '').startsWith('image/') || ev.message_type === 'photo';
                                    const isVoice = ev.message_type === 'voice' || ev.message_type === 'audio' || (ev.mime_type || '').startsWith('audio/');
                                    const isDoc = !isImage && !isVoice && !!ev.media_url;
                                    return (
                                        <div key={`t${ev.id}`} className={`crm-bubble-row ${isOut ? 'right' : ''}`}>
                                            <div className={`crm-bubble ${isOut ? 'right' : ''}`}>
                                                <div className="crm-bubble-header">
                                                    <Send size={12} /> <span>{isOut ? 'You' : (ev.sender_name || 'Telegram')}</span>
                                                </div>
                                                {ev.message_text && (
                                                    <div style={{ whiteSpace: 'pre-wrap', fontSize: 13.5 }}>{ev.message_text}</div>
                                                )}
                                                {isImage && ev.media_url && (
                                                    <img
                                                        src={ev.media_url}
                                                        alt="tg"
                                                        className="crm-tg-image"
                                                        onClick={(e) => { e.stopPropagation(); setTgModalId(ev.id); }}
                                                    />
                                                )}
                                                {isVoice && ev.media_url && (
                                                    <audio src={ev.media_url} controls style={{ marginTop: 6, maxWidth: '100%' }} />
                                                )}
                                                {isDoc && (
                                                    <div
                                                        className="crm-tg-doc"
                                                        onClick={(e) => { e.stopPropagation(); setTgModalId(ev.id); }}
                                                    >
                                                        <FileText size={14} />
                                                        <span style={{ fontSize: 12 }}>{ev.file_name || 'Document'}</span>
                                                    </div>
                                                )}
                                                {ev.ai_transcript && (
                                                    <div
                                                        className="crm-ai-snippet"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={(e) => { e.stopPropagation(); setTgModalId(ev.id); }}
                                                    >
                                                        <strong style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>AI:</strong>{' '}
                                                        {ev.ai_transcript.slice(0, 160)}{ev.ai_transcript.length > 160 ? '…' : ''}
                                                    </div>
                                                )}
                                                <div className="crm-bubble-time">{formatTime(ev.timestamp)}</div>
                                            </div>
                                        </div>
                                    );
                                }
                                if (ev.type === 'mockup' || ev.type === 'modification') {
                                    const Icon = ev.type === 'mockup' ? Package : Edit3;
                                    return (
                                        <div key={`m${ev.type}${ev.id}`} className="crm-bubble-row" style={{ justifyContent: 'center' }}>
                                            <div className="crm-mockup-bubble">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13 }}>
                                                    <Icon size={14} />
                                                    {ev.type === 'mockup' ? 'Mockup' : 'Modification'}
                                                    <span
                                                        style={{
                                                            marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 10,
                                                            background: ev.request_status === 'CONVERTED' ? 'rgba(34,197,94,0.15)' :
                                                                ev.request_status === 'RETURNED' ? 'rgba(59,130,246,0.15)' :
                                                                'rgba(99,102,241,0.15)',
                                                            color: 'var(--admin-text)',
                                                            fontWeight: 700,
                                                        }}
                                                    >{ev.request_status}</span>
                                                </div>
                                                {ev.image && <img src={ev.image} alt="mockup" />}
                                                <div style={{ fontSize: 12, color: 'var(--admin-text-secondary)', marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>{ev.designer?.full_name || (ev.type === 'modification' ? 'Modification' : 'No designer')}</span>
                                                    <span>{ev.price ? `${Number(ev.price).toLocaleString()} ETB` : ''}</span>
                                                </div>
                                                <div className="crm-bubble-time">{formatTime(ev.timestamp)}</div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </React.Fragment>
                    ))
                )}
            </div>

            {callModalId !== null && <CallDetailModal callLogId={callModalId} onClose={() => setCallModalId(null)} />}
            {tgModalId !== null && <TelegramMediaModal msgId={tgModalId} onClose={() => setTgModalId(null)} />}
        </div>
    );
}
