'use client';
import React, { useState } from 'react';
import { Phone, Send, Package, Edit3, User } from 'lucide-react';

interface Props {
    lead: any | null;
    events: any[];
}

export default function LeadDetailsPanel({ lead, events }: Props) {
    const [tab, setTab] = useState<'profile' | 'mockups' | 'mods' | 'phones'>('profile');

    if (!lead) {
        return (
            <div className="crm-right">
                <div className="crm-empty"><User size={32} /><div>Select a lead to see details.</div></div>
            </div>
        );
    }

    const mockups = (events || []).filter((e) => e.type === 'mockup');
    const mods = (events || []).filter((e) => e.type === 'modification');

    return (
        <div className="crm-right">
            <div className="crm-right-tabs">
                <button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>Profile</button>
                <button className={tab === 'mockups' ? 'active' : ''} onClick={() => setTab('mockups')}>Mockups ({mockups.length})</button>
                <button className={tab === 'mods' ? 'active' : ''} onClick={() => setTab('mods')}>Mods ({mods.length})</button>
                <button className={tab === 'phones' ? 'active' : ''} onClick={() => setTab('phones')}>Contacts</button>
            </div>
            <div className="crm-right-content">
                {tab === 'profile' && (
                    <>
                        <div className="crm-info-row">
                            <span className="crm-info-label">Name</span>
                            <span className="crm-info-value">{lead.name || lead.customer_name || '-'}</span>
                        </div>
                        <div className="crm-info-row">
                            <span className="crm-info-label">Customer</span>
                            <span className="crm-info-value">{lead.customer_name || '-'}</span>
                        </div>
                        <div className="crm-info-row">
                            <span className="crm-info-label">Status</span>
                            <span className="crm-info-value">
                                <span className={`crm-status-badge crm-status-${lead.status}`}>{lead.status}</span>
                            </span>
                        </div>
                        <div className="crm-info-row">
                            <span className="crm-info-label">Temperature</span>
                            <span className="crm-info-value">
                                <span className={`crm-status-badge crm-status-${lead.temperature}`}>{lead.temperature}</span>
                            </span>
                        </div>
                        <div className="crm-info-row">
                            <span className="crm-info-label">Source</span>
                            <span className="crm-info-value">{lead.source || '-'}</span>
                        </div>
                        <div className="crm-info-row">
                            <span className="crm-info-label">Sales</span>
                            <span className="crm-info-value">{lead.sales?.full_name || '-'}</span>
                        </div>
                        <div className="crm-info-row">
                            <span className="crm-info-label">Created</span>
                            <span className="crm-info-value" style={{ fontSize: 12 }}>
                                {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '-'}
                            </span>
                        </div>
                        {lead.note && (
                            <div style={{ marginTop: 14 }}>
                                <div className="crm-info-label" style={{ marginBottom: 6 }}>Note</div>
                                <div style={{ fontSize: 13, padding: 10, background: 'var(--admin-bg, #f7f8fa)', borderRadius: 6, border: '1px solid var(--admin-border)' }}>
                                    {lead.note}
                                </div>
                            </div>
                        )}
                        {lead.interest_note && (
                            <div style={{ marginTop: 14 }}>
                                <div className="crm-info-label" style={{ marginBottom: 6 }}>Interest</div>
                                <div style={{ fontSize: 13, padding: 10, background: 'var(--admin-bg, #f7f8fa)', borderRadius: 6, border: '1px solid var(--admin-border)' }}>
                                    {lead.interest_note}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {tab === 'mockups' && (
                    <>
                        {mockups.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 20, color: 'var(--admin-text-secondary)' }}>No mockups.</div>
                        ) : mockups.map((m) => (
                            <div key={m.id} style={{ border: '1px solid var(--admin-border)', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <strong style={{ fontSize: 13 }}><Package size={12} style={{ display: 'inline' }} /> Mockup #{m.id}</strong>
                                    <span className={`crm-status-badge crm-status-${m.request_status}`}>{m.request_status}</span>
                                </div>
                                {m.image && <img src={m.image} alt="mockup" style={{ width: '100%', borderRadius: 6 }} />}
                                <div style={{ fontSize: 12, color: 'var(--admin-text-secondary)', marginTop: 4 }}>
                                    {m.designer?.full_name || '-'} • {m.price ? `${Number(m.price).toLocaleString()} ETB` : '-'}
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {tab === 'mods' && (
                    <>
                        {mods.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 20, color: 'var(--admin-text-secondary)' }}>No modifications.</div>
                        ) : mods.map((m) => (
                            <div key={m.id} style={{ border: '1px solid var(--admin-border)', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <strong style={{ fontSize: 13 }}><Edit3 size={12} style={{ display: 'inline' }} /> Mod #{m.id}</strong>
                                    <span className={`crm-status-badge crm-status-${m.request_status}`}>{m.request_status}</span>
                                </div>
                                {m.image && <img src={m.image} alt="mod" style={{ width: '100%', borderRadius: 6 }} />}
                                <div style={{ fontSize: 12, color: 'var(--admin-text-secondary)', marginTop: 4 }}>
                                    Mockup #{m.mockup_id} • {m.price ? `${Number(m.price).toLocaleString()} ETB` : '-'}
                                </div>
                                {m.note && <div style={{ fontSize: 12, marginTop: 4 }}>{m.note}</div>}
                            </div>
                        ))}
                    </>
                )}

                {tab === 'phones' && (
                    <>
                        <div className="crm-info-label" style={{ marginBottom: 8, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            <Phone size={11} style={{ display: 'inline', marginRight: 4 }} /> Phones
                        </div>
                        {(lead.phones || []).length === 0 ? (
                            <div style={{ fontSize: 12, color: 'var(--admin-text-secondary)' }}>No linked phones.</div>
                        ) : (
                            (lead.phones || []).map((p: any) => (
                                <div key={p.id} className="crm-info-row">
                                    <span className="crm-info-value">{p.phone_number}</span>
                                    <span className="crm-info-label">{p.label || (p.is_primary ? 'primary' : '')}</span>
                                </div>
                            ))
                        )}

                        <div className="crm-info-label" style={{ marginTop: 16, marginBottom: 8, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            <Send size={11} style={{ display: 'inline', marginRight: 4 }} /> Telegram
                        </div>
                        {(lead.telegrams || []).length === 0 ? (
                            <div style={{ fontSize: 12, color: 'var(--admin-text-secondary)' }}>No linked Telegram accounts.</div>
                        ) : (
                            (lead.telegrams || []).map((t: any) => (
                                <div key={t.id} className="crm-info-row">
                                    <span className="crm-info-value">{t.telegram_username || t.telegram_phone || `id:${t.telegram_user_id}`}</span>
                                    <span className="crm-info-label">{t.is_primary ? 'primary' : ''}</span>
                                </div>
                            ))
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
