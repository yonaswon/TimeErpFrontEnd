'use client';
import React, { useState, useEffect } from 'react';
import { Mic, Search, Calendar, ChevronDown, ChevronUp, Play, Pause, FileText, User as UserIcon } from 'lucide-react';
import api from '../../../api';

interface CallRecording {
    id: number;
    audio_file: string | null;
    duration_seconds: number;
    file_size: number;
    uploaded_at: string;
    transcript: string | null;
    call_log: {
        id: number;
        phone_number: string;
        full_name: string;
        status: string;
        started_at: string | null;
        ended_at: string | null;
        duration: number;
        date: string;
    } | null;
    sales: {
        id: number;
        username: string;
        full_name: string;
    } | null;
}

interface PagedResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: CallRecording[];
}

interface SalesUser {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
}

const STATUS_COLORS: Record<string, string> = {
    ANSWERED: 'var(--admin-success)',
    MISSED: 'var(--admin-danger)',
    REJECTED: 'var(--admin-warning)',
    OUTGOING: 'var(--admin-info)',
};

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatSize(bytes: number): string {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function formatDate(iso: string | null): string {
    if (!iso) return '-';
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

export default function CallRecordingsList() {
    const [records, setRecords] = useState<CallRecording[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [salesId, setSalesId] = useState<string>('');
    const [salesUsers, setSalesUsers] = useState<SalesUser[]>([]);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 25;

    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [playingId, setPlayingId] = useState<number | null>(null);
    const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

    const fetchRecordings = async () => {
        setLoading(true);
        setError('');
        try {
            const params: Record<string, string> = { page: page.toString(), page_size: pageSize.toString() };
            if (search.trim()) params.search = search.trim();
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            if (salesId) params.sales_id = salesId;

            const res = await api.get<PagedResponse>('/lead/call-recordings/', { params });
            setRecords(res.data.results || []);
            setTotalCount(res.data.count || 0);
        } catch (err: any) {
            console.error('Failed to fetch recordings:', err);
            setError(err?.response?.data?.detail || 'Failed to load recordings.');
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchSalesUsers = async () => {
        try {
            const res = await api.get('/auth/users/');
            const list: SalesUser[] = res.data.results || res.data || [];
            setSalesUsers(list);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        }
    };

    useEffect(() => {
        fetchSalesUsers();
    }, []);

    useEffect(() => {
        fetchRecordings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchRecordings();
    };

    const togglePlay = (rec: CallRecording) => {
        if (!rec.audio_file) return;
        if (playingId === rec.id) {
            audioEl?.pause();
            setPlayingId(null);
            setAudioEl(null);
            return;
        }
        audioEl?.pause();
        const audio = new Audio(rec.audio_file);
        audio.play().catch((e) => console.error('Audio play failed:', e));
        audio.onended = () => {
            setPlayingId(null);
            setAudioEl(null);
        };
        setAudioEl(audio);
        setPlayingId(rec.id);
    };

    const toggleExpand = (id: number) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return (
        <div style={{ padding: '16px' }}>
            {/* Filters */}
            <form
                onSubmit={handleSearch}
                style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '20px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                }}
            >
                <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '220px' }}>
                    <Search
                        size={16}
                        style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--admin-text-secondary)',
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Search phone or name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px 10px 36px',
                            border: '1px solid var(--admin-border)',
                            borderRadius: '8px',
                            background: 'var(--admin-card-bg)',
                            color: 'var(--admin-text)',
                        }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <UserIcon size={16} color="var(--admin-text-secondary)" />
                    <select
                        value={salesId}
                        onChange={(e) => setSalesId(e.target.value)}
                        style={{
                            padding: '10px 12px',
                            border: '1px solid var(--admin-border)',
                            borderRadius: '8px',
                            background: 'var(--admin-card-bg)',
                            color: 'var(--admin-text)',
                            minWidth: '160px',
                        }}
                    >
                        <option value="">All sales users</option>
                        {salesUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                                {(u.first_name || u.last_name) ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : u.username}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Calendar size={16} color="var(--admin-text-secondary)" />
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        style={{
                            padding: '10px 12px',
                            border: '1px solid var(--admin-border)',
                            borderRadius: '8px',
                            background: 'var(--admin-card-bg)',
                            color: 'var(--admin-text)',
                        }}
                    />
                    <span>–</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        style={{
                            padding: '10px 12px',
                            border: '1px solid var(--admin-border)',
                            borderRadius: '8px',
                            background: 'var(--admin-card-bg)',
                            color: 'var(--admin-text)',
                        }}
                    />
                </div>
                <button
                    type="submit"
                    style={{
                        padding: '10px 20px',
                        background: 'var(--admin-primary)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 500,
                    }}
                >
                    Apply
                </button>
            </form>

            {error && (
                <div
                    style={{
                        padding: '12px 16px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--admin-danger)',
                        borderRadius: '8px',
                        marginBottom: '16px',
                    }}
                >
                    {error}
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--admin-text-secondary)' }}>
                    Loading recordings...
                </div>
            ) : records.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--admin-text-secondary)' }}>
                    <Mic size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
                    <div>No call recordings found.</div>
                </div>
            ) : (
                <>
                    <div style={{ marginBottom: '12px', color: 'var(--admin-text-secondary)', fontSize: '14px' }}>
                        {totalCount} recording{totalCount !== 1 ? 's' : ''} total
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {records.map((rec) => {
                            const cl = rec.call_log;
                            const isExpanded = expandedId === rec.id;
                            const isPlaying = playingId === rec.id;
                            const status = cl?.status || '';
                            return (
                                <div
                                    key={rec.id}
                                    style={{
                                        background: 'var(--admin-card-bg)',
                                        border: '1px solid var(--admin-border)',
                                        borderRadius: '10px',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '14px 16px',
                                        }}
                                    >
                                        {/* Play button */}
                                        <button
                                            onClick={() => togglePlay(rec)}
                                            disabled={!rec.audio_file}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: rec.audio_file ? 'var(--admin-primary)' : 'var(--admin-border)',
                                                color: '#fff',
                                                border: 'none',
                                                cursor: rec.audio_file ? 'pointer' : 'not-allowed',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                            title={rec.audio_file ? 'Play recording' : 'No audio file'}
                                        >
                                            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                                        </button>

                                        {/* Main info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    flexWrap: 'wrap',
                                                }}
                                            >
                                                <div style={{ fontWeight: 600, color: 'var(--admin-text)' }}>
                                                    {cl?.full_name || cl?.phone_number || '(unknown)'}
                                                </div>
                                                {cl?.phone_number && cl?.full_name && (
                                                    <span style={{ color: 'var(--admin-text-secondary)', fontSize: '13px' }}>
                                                        {cl.phone_number}
                                                    </span>
                                                )}
                                                {status && (
                                                    <span
                                                        style={{
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '11px',
                                                            fontWeight: 600,
                                                            background: STATUS_COLORS[status] || 'var(--admin-border)',
                                                            color: '#fff',
                                                        }}
                                                    >
                                                        {status}
                                                    </span>
                                                )}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: '12px',
                                                    color: 'var(--admin-text-secondary)',
                                                    marginTop: '2px',
                                                    display: 'flex',
                                                    gap: '12px',
                                                    flexWrap: 'wrap',
                                                }}
                                            >
                                                <span>Sales: {rec.sales?.full_name || rec.sales?.username || '-'}</span>
                                                <span>Duration: {formatDuration(rec.duration_seconds || cl?.duration || 0)}</span>
                                                <span>Size: {formatSize(rec.file_size)}</span>
                                                <span>Call: {formatDate(cl?.started_at || cl?.date || null)}</span>
                                            </div>
                                        </div>

                                        {/* Transcript toggle */}
                                        <button
                                            onClick={() => toggleExpand(rec.id)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '8px 12px',
                                                background: 'transparent',
                                                color: 'var(--admin-text)',
                                                border: '1px solid var(--admin-border)',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                            }}
                                            title="Toggle transcript"
                                        >
                                            <FileText size={14} />
                                            Transcript
                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                    </div>

                                    {isExpanded && (
                                        <div
                                            style={{
                                                borderTop: '1px solid var(--admin-border)',
                                                padding: '14px 16px',
                                                background: 'rgba(0,0,0,0.02)',
                                                fontSize: '13.5px',
                                                lineHeight: 1.6,
                                                whiteSpace: 'pre-wrap',
                                                color: 'var(--admin-text)',
                                            }}
                                        >
                                            {rec.transcript
                                                ? rec.transcript
                                                : <span style={{ color: 'var(--admin-text-secondary)', fontStyle: 'italic' }}>
                                                    No transcript yet (may still be processing).
                                                </span>}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '12px',
                                marginTop: '20px',
                            }}
                        >
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                style={{
                                    padding: '8px 16px',
                                    border: '1px solid var(--admin-border)',
                                    borderRadius: '6px',
                                    background: 'var(--admin-card-bg)',
                                    color: 'var(--admin-text)',
                                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                                    opacity: page <= 1 ? 0.5 : 1,
                                }}
                            >
                                Previous
                            </button>
                            <span style={{ color: 'var(--admin-text-secondary)', fontSize: '14px' }}>
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                style={{
                                    padding: '8px 16px',
                                    border: '1px solid var(--admin-border)',
                                    borderRadius: '6px',
                                    background: 'var(--admin-card-bg)',
                                    color: 'var(--admin-text)',
                                    cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                                    opacity: page >= totalPages ? 0.5 : 1,
                                }}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
