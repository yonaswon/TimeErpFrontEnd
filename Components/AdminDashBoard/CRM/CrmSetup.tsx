'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Archive, ArrowDown, ArrowUp, CircleDot, Edit3, Phone, Plus, RefreshCw, RotateCcw, Search, Tags, Trash2, X } from 'lucide-react';
import api from '@/api';
import './CrmAdminDashboard.css';
import './CrmSetup.css';

type Resource = 'sources' | 'categories' | 'disposition_reasons' | 'staff_numbers';
const definitions: Record<Resource, { title: string; description: string; endpoint: string; icon: React.ElementType }> = {
  sources: { title: 'Lead sources', description: 'Where customers first found the company.', endpoint: '/lead/sources/', icon: CircleDot },
  categories: { title: 'Customer categories', description: 'Company-wide customer classification.', endpoint: '/lead/customer-categories/', icon: Tags },
  disposition_reasons: { title: 'Disposition reasons', description: 'Cold and no-follow-up reasons used by sales.', endpoint: '/lead/disposition-reasons/', icon: Archive },
  staff_numbers: { title: 'Staff numbers', description: 'Internal Ethiopian mobile numbers excluded from customer CRM activity.', endpoint: '/lead/staff-phone-numbers/', icon: Phone },
};

const emptyForm = { name: '', phone_number: '', code: '', color: '#64748B', icon: 'circle-dot', sort_order: 0, reason_type: 'COLD', requires_custom_text: false, stage_group: 'OPEN', control_type: 'MANUAL', transition_requirements: {} };

function resourcePayload(resource: Resource, form: any) {
  if (resource === 'staff_numbers') return { phone_number: form.phone_number };
  if (resource === 'sources') return { name: form.name, color: form.color, icon: form.icon, sort_order: form.sort_order };
  if (resource === 'categories') return { name: form.name, color: form.color, icon: form.icon, sort_order: form.sort_order };
  return { name: form.name, reason_type: form.reason_type, sort_order: form.sort_order, requires_custom_text: form.requires_custom_text };
}

export default function CrmSetup() {
  const [resource, setResource] = useState<Resource>('sources');
  const [rows, setRows] = useState<any[]>([]);
  const [archived, setArchived] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');
  const confirmSuccess = (message: string) => { setSuccess(message); window.setTimeout(() => setSuccess(''), 2600); };

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const response = await api.get(definitions[resource].endpoint, { params: { include_archived: 1 } }); setRows(response.data.results || response.data || []); }
    catch { setError('CRM setup values could not be loaded.'); }
    finally { setLoading(false); }
  }, [resource]);
  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => rows.filter(row => Boolean(row.is_archived) === archived && JSON.stringify(row).toLowerCase().includes(query.toLowerCase())), [rows, archived, query]);
  const startEdit = (row?: any) => {
    setEditing(row || {}); setFieldErrors({});
    setForm(row ? { ...emptyForm, ...row, name: row.name || row.display_name || '' } : { ...emptyForm, sort_order: rows.length });
  };
  const save = async () => {
    if (resource === 'staff_numbers' && !form.phone_number.trim()) { setFieldErrors({ phone_number: 'Phone number is required.' }); return; }
    if (resource !== 'staff_numbers' && !form.name.trim()) { setFieldErrors({ name: 'Name is required.' }); return; }
    setSaving(true); setFieldErrors({});
    try {
      const payload = resourcePayload(resource, form);
      editing?.id ? await api.patch(`${definitions[resource].endpoint}${editing.id}/`, payload) : await api.post(definitions[resource].endpoint, payload);
      setEditing(null); await load(); confirmSuccess('Configuration saved.');
    } catch (requestError: any) {
      const details = requestError?.response?.data || {};
      const normalized: Record<string, string> = {};
      Object.entries(details).forEach(([key, value]: any) => normalized[key] = Array.isArray(value) ? value[0] : String(value));
      setFieldErrors(Object.keys(normalized).length ? normalized : { form: 'This configuration could not be saved.' });
    } finally { setSaving(false); }
  };
  const usage = async (row: any) => resource === 'staff_numbers' ? 0 : (await api.get('/lead/crm/setup/usage/', { params: { resource, id: row.id } })).data.usage_count;
  const archiveRow = async (row: any) => {
    const count = await usage(row);
    const prompt = resource === 'staff_numbers'
      ? `Archive ${row.phone_number}? Future communications with it will no longer be excluded.`
      : `${count} customer records use this value. Archive it? Historical records will keep it.`;
    if (!window.confirm(prompt)) return;
    await api.post(`${definitions[resource].endpoint}${row.id}/archive/`); await load(); confirmSuccess('Configuration archived.');
  };
  const restoreRow = async (row: any) => { await api.post(`${definitions[resource].endpoint}${row.id}/restore/`); await load(); confirmSuccess('Configuration restored.'); };
  const deleteRow = async (row: any) => {
    if (resource === 'staff_numbers') { await archiveRow(row); return; }
    const count = await usage(row);
    if (count) { await archiveRow(row); return; }
    if (!window.confirm(`Permanently delete “${row.name || row.display_name}”? This cannot be undone.`)) return;
    await api.delete(`${definitions[resource].endpoint}${row.id}/`); await load(); confirmSuccess('Unused configuration deleted.');
  };
  const move = async (row: any, direction: -1 | 1) => {
    const active = [...visible]; const index = active.findIndex(item => item.id === row.id); const target = index + direction;
    if (target < 0 || target >= active.length) return;
    [active[index], active[target]] = [active[target], active[index]];
    await api.post('/lead/crm/setup/reorder/', { resource, ids: active.map(item => item.id) }); await load(); confirmSuccess('Order updated.');
  };
  const def = definitions[resource];
  return <div className="crm-setup-shell">
    <aside className="crm-setup-nav"><div><p>CRM administration</p><h2>Setup</h2><span>Global values used by sales and reporting.</span></div>{(Object.keys(definitions) as Resource[]).map(key => { const Icon = definitions[key].icon; return <button className={resource === key ? 'active' : ''} onClick={() => setResource(key)} key={key}><Icon size={18} /><span><strong>{definitions[key].title}</strong><small>{definitions[key].description}</small></span></button>; })}</aside>
    <main className="crm-setup-main">
      <header><div><p>Configuration</p><h2>{def.title}</h2><span>{def.description}</span></div><button className="crm-setup-create" onClick={() => startEdit()}><Plus size={17} /> Create</button></header>
      <div className="crm-setup-tools"><label><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={`Search ${def.title.toLowerCase()}…`} /></label><div><button className={!archived ? 'active' : ''} onClick={() => setArchived(false)}>Active</button><button className={archived ? 'active' : ''} onClick={() => setArchived(true)}>Archived</button></div><button onClick={load} aria-label="Refresh"><RefreshCw size={17} /></button></div>
      {error && <div className="crm-inline-error">{error}<button onClick={load}>Retry</button></div>}
      {success && <div className="crm-setup-success">{success}</div>}
      <div className="crm-setup-list">
        {visible.map((row, index) => <article key={row.id}>
          <span className="crm-config-mark" style={{ background: row.color || '#64748B' }}>{resource === 'staff_numbers' ? '☎' : row.icon ? row.icon.slice(0, 1).toUpperCase() : ''}</span>
          <span className="crm-config-copy"><strong>{row.phone_number || row.name || row.display_name}</strong><small>{resource === 'staff_numbers' ? 'Ignored by customer CRM tracking' : resource === 'disposition_reasons' ? `${row.reason_type === 'COLD' ? 'Cold reason' : 'No follow-up'}${row.requires_custom_text ? ' · explanation required' : ''}` : row.icon || 'No icon'}</small></span>
          {!archived && resource !== 'staff_numbers' && <span className="crm-reorder"><button disabled={index === 0} onClick={() => move(row, -1)} aria-label="Move up"><ArrowUp /></button><button disabled={index === visible.length - 1} onClick={() => move(row, 1)} aria-label="Move down"><ArrowDown /></button></span>}
          <span className="crm-config-actions"><button onClick={() => startEdit(row)} aria-label="Edit"><Edit3 /></button>{archived ? <button onClick={() => restoreRow(row)} aria-label="Restore"><RotateCcw /></button> : <button disabled={row.is_default} onClick={() => archiveRow(row)} aria-label="Archive"><Archive /></button>}<button disabled={row.is_default} onClick={() => deleteRow(row)} aria-label="Delete"><Trash2 /></button></span>
        </article>)}
        {!loading && !visible.length && <div className="crm-empty">{React.createElement(def.icon)}<strong>No {archived ? 'archived' : 'active'} values</strong><span>{query ? 'Clear search to see all values.' : 'Create the first configuration value.'}</span></div>}
        {loading && <div className="crm-list-loading"><RefreshCw className="spin" /> Loading configuration…</div>}
      </div>
    </main>
    {editing && <div className="crm-config-modal-backdrop"><section className="crm-config-modal" role="dialog" aria-modal="true"><header><div><p>{editing.id ? 'Update configuration' : 'New configuration'}</p><h3>{def.title}</h3></div><button onClick={() => setEditing(null)}><X /></button></header>
      {fieldErrors.form && <div className="crm-inline-error">{fieldErrors.form}</div>}
      {resource === 'staff_numbers' ? <label>Staff phone number<input value={form.phone_number} onChange={event => setForm({ ...form, phone_number: event.target.value })} placeholder="+251911234567" inputMode="tel" autoFocus />{fieldErrors.phone_number && <small>{fieldErrors.phone_number}</small>}<span className="crm-field-help">Use 07…, 09…, +2517…, or +2519…</span></label> : <label>Name<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} autoFocus />{fieldErrors.name && <small>{fieldErrors.name}</small>}</label>}
      {(resource === 'sources' || resource === 'categories') && <div className="crm-form-pair"><label>Color<input type="color" value={form.color} onChange={event => setForm({ ...form, color: event.target.value })} /></label><label>Lucide icon key<input value={form.icon} onChange={event => setForm({ ...form, icon: event.target.value })} placeholder="circle-dot" /></label></div>}
      {resource === 'disposition_reasons' && <><label>Reason group<select value={form.reason_type} onChange={event => setForm({ ...form, reason_type: event.target.value })}><option value="COLD">Cold reason</option><option value="NO_FOLLOW_UP">No-follow-up reason</option></select></label><label className="crm-check"><input type="checkbox" checked={form.requires_custom_text} onChange={event => setForm({ ...form, requires_custom_text: event.target.checked })} /> Require a custom explanation</label></>}
      <footer><button onClick={() => setEditing(null)}>Cancel</button><button className="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></footer>
    </section></div>}
  </div>;
}
