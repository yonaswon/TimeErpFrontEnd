'use client';
import React, { useEffect, useState, useCallback } from 'react';
import api from '../../../api';
import LeadListPanel from './LeadListPanel';
import ConversationPanel, { TimelineEvent } from './ConversationPanel';
import LeadDetailsPanel from './LeadDetailsPanel';
import { useCrmEvents } from './useCrmEvents';
import { MessageSquare, UserPlus, Loader2 } from 'lucide-react';
import './CrmManager.css';

export default function CrmManager({ initialMode }: { initialMode?: 'leads' | 'conversations' }) {
    const [mode, setMode] = useState<'lead' | 'phone'>(initialMode === 'conversations' ? 'phone' : 'lead');
    const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
    const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

    const [lead, setLead] = useState<any | null>(null);
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loadingConv, setLoadingConv] = useState(false);
    const [creatingLead, setCreatingLead] = useState(false);
    const [resolvedTgName, setResolvedTgName] = useState<string>('');

    const loadConversationByLead = useCallback(async (id: number) => {
        setLoadingConv(true);
        try {
            const res = await api.get(`/lead/crm/leads/${id}/conversation/`);
            setLead(res.data.lead);
            setEvents(res.data.events || []);
            setStats(res.data.stats);
        } catch (err) {
            console.error('Failed to load conversation', err);
            setLead(null); setEvents([]); setStats(null);
        } finally {
            setLoadingConv(false);
        }
    }, []);

    // Real-time CRM events
    useCrmEvents((ev) => {
        if (ev.type === 'transcript.updated') {
            // Refresh conversation if the updated message belongs to the open lead
            if (mode === 'lead' && selectedLeadId) {
                loadConversationByLead(selectedLeadId);
            }
        }
        if (ev.type === 'lead.merged') {
            const { source_id, target_id } = ev.payload;
            // If we were viewing the source lead, switch to the target
            if (mode === 'lead' && selectedLeadId === source_id) {
                setSelectedLeadId(target_id);
            }
        }
    });

    const loadConversationByPhone = async (phone: string) => {
        setLoadingConv(true);
        try {
            const res = await api.get('/lead/crm/conversation-by-phone/', { params: { phone } });
            setLead(res.data.lead);
            setEvents(res.data.events || []);
            setStats(res.data.stats);
        } catch (err) {
            console.error('Failed to load phone conversation', err);
            setLead(null); setEvents([]); setStats(null);
        } finally {
            setLoadingConv(false);
        }
    };

    useEffect(() => {
        if (mode === 'lead' && selectedLeadId) loadConversationByLead(selectedLeadId);
    }, [selectedLeadId, mode]);

    useEffect(() => {
        if (mode === 'phone' && selectedPhone) {
            loadConversationByPhone(selectedPhone);
            setResolvedTgName('');
            // Best-effort Telegram name lookup so the banner can show a hint
            api.get('/lead/crm/lookup-telegram-name/', { params: { phone: selectedPhone } })
                .then((res) => {
                    if (res.data?.found && res.data?.display_name) {
                        setResolvedTgName(res.data.display_name);
                    }
                })
                .catch(() => {});
        }
    }, [selectedPhone, mode]);

    const handleCreateFromPhone = async () => {
        if (!selectedPhone) return;
        setCreatingLead(true);
        try {
            const res = await api.post('/lead/crm/auto-create-lead/', {
                phone: selectedPhone,
                name: resolvedTgName || '',
            });
            const newLeadId = res.data?.lead?.id;
            if (newLeadId) {
                setMode('lead');
                setSelectedPhone(null);
                setSelectedLeadId(newLeadId);
            }
        } catch (err: any) {
            console.error('auto-create-lead failed', err);
            alert('Could not create lead: ' + (err?.response?.data?.error || err.message));
        } finally {
            setCreatingLead(false);
        }
    };

    const empty = (
        <div className="crm-center">
            <div className="crm-empty">
                <MessageSquare size={64} />
                <div style={{ fontSize: 18, fontWeight: 600 }}>CRM Manager</div>
                <div style={{ fontSize: 13 }}>
                    {mode === 'lead'
                        ? 'Select a lead on the left to see their unified conversation across calls, SMS, and Telegram.'
                        : 'Enter a phone number to view its conversation.'}
                </div>
            </div>
        </div>
    );

    const hasConversation = mode === 'lead' ? selectedLeadId !== null : selectedPhone !== null;

    return (
        <div className="crm-wrapper">
            <LeadListPanel
                mode={mode}
                onModeChange={(m) => {
                    setMode(m);
                    setSelectedLeadId(null);
                    setSelectedPhone(null);
                    setLead(null);
                    setEvents([]);
                    setStats(null);
                }}
                selectedLeadId={selectedLeadId}
                onSelectLead={(id) => { setSelectedLeadId(id); setSelectedPhone(null); }}
                onSelectPhone={(p) => { setSelectedPhone(p); setSelectedLeadId(null); }}
            />

            {hasConversation ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    {mode === 'phone' && selectedPhone && !lead && !loadingConv && (
                        <div
                            style={{
                                padding: '12px 18px',
                                background: 'linear-gradient(90deg, rgba(99,102,241,0.12), rgba(37,99,235,0.08))',
                                borderBottom: '1px solid var(--admin-border)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                            }}
                        >
                            <UserPlus size={18} />
                            <div style={{ flex: 1, fontSize: 13 }}>
                                <strong>No lead linked to {selectedPhone}.</strong>{' '}
                                {resolvedTgName ? (
                                    <span>Telegram name found: <strong>{resolvedTgName}</strong></span>
                                ) : (
                                    <span>Create a lead from this number to organize the conversation.</span>
                                )}
                            </div>
                            <button
                                onClick={handleCreateFromPhone}
                                disabled={creatingLead}
                                style={{
                                    padding: '8px 14px',
                                    background: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 6,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: creatingLead ? 'wait' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                {creatingLead ? <Loader2 size={14} className="spin" /> : <UserPlus size={14} />}
                                {creatingLead ? 'Creating…' : 'Create Lead'}
                            </button>
                        </div>
                    )}
                    <ConversationPanel
                        events={events}
                        leadName={lead?.name || lead?.customer_name || selectedPhone || 'Conversation'}
                        leadPhones={lead?.phones}
                        leadTelegrams={lead?.telegrams}
                        stats={stats}
                        loading={loadingConv}
                    />
                </div>
            ) : empty}

            <LeadDetailsPanel lead={lead} events={events} />
        </div>
    );
}
