'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, CalendarDays, ChevronDown, ChevronRight,
  CircleAlert, Layers3, PackageCheck, RefreshCw, Search, Users, X,
} from 'lucide-react';
import api from '@/api';
import LeadWorkspace, { WorkspaceTab } from './LeadWorkspace';
import './CrmAdminDashboard.css';

type Preset = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'single' | 'custom';
type FilterState = { preset: Preset; date: string; date_from: string; date_to: string; salesperson_id: string };
type Metric = { code: string; title: string; extra?: Record<string, string> };
type WorkspaceSelection = { leadId: number; tab: WorkspaceTab };

const isoToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Addis_Ababa' });
const defaults: FilterState = { preset: 'today', date: isoToday(), date_from: isoToday(), date_to: isoToday(), salesperson_id: '' };
const presetLabels: Record<Preset, string> = { today: 'Today', yesterday: 'Yesterday', this_week: 'This week', this_month: 'This month', single: 'Date', custom: 'Custom range' };

function initialFilters(): FilterState {
  if (typeof window === 'undefined') return defaults;
  const params = new URLSearchParams(window.location.search);
  const preset = params.get('crm_preset') as Preset;
  return {
    ...defaults,
    preset: Object.keys(presetLabels).includes(preset) ? preset : 'today',
    date: params.get('crm_date') || defaults.date,
    date_from: params.get('crm_from') || defaults.date_from,
    date_to: params.get('crm_to') || defaults.date_to,
    salesperson_id: params.get('crm_salesperson') || '',
  };
}

function requestParams(filters: FilterState) {
  const params: Record<string, string> = { preset: filters.preset, timezone: 'Africa/Addis_Ababa' };
  if (filters.preset === 'single') params.date = filters.date;
  if (filters.preset === 'custom') { params.date_from = filters.date_from; params.date_to = filters.date_to; }
  if (filters.salesperson_id) params.salesperson_id = filters.salesperson_id;
  return params;
}

function tabForMetric(code: string): WorkspaceTab {
  if (code.includes('MOCKUP') || code.includes('MODIFICATION')) return 'design';
  if (code.includes('ORDER') || code === 'CLIENTS_ORDERED' || code === 'CONVERTED') return 'orders';
  if (code === 'DETAILS_MISSING' || code === 'DETAILS_COMPLETE' || code === 'NEW_LEAD' || code === 'MARKED_COLD' || code === 'COLD_REASON' || code === 'PIPELINE_STAGE' || code === 'RETURNED_WITHOUT_ORDER') return 'overview';
  return 'conversation';
}

function DashboardSkeleton() {
  return <div className="crm-dashboard-skeleton" aria-label="Loading CRM dashboard">
    <div className="crm-sk crm-sk-toolbar" /><div className="crm-sk crm-sk-summary" /><div className="crm-sk crm-sk-strip" /><div className="crm-sk crm-sk-pipeline" /><div className="crm-sk crm-sk-section" /><div className="crm-sk crm-sk-section" />
  </div>;
}

function metricIdentity(row: any) {
  const primary = row.identities?.find((identity: any) => identity.is_primary) || row.identities?.[0];
  return primary?.display_value || row.identity || 'No connected identity';
}

function Drilldown({ metric, filters, mobile, onClose }: { metric: Metric; filters: FilterState; mobile: boolean; onClose: () => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [workspace, setWorkspace] = useState<WorkspaceSelection | null>(null);

  const load = useCallback(async (next?: string | null, append = false) => {
    setLoading(true); setError('');
    try {
      const response = await api.get('/lead/crm/admin-dashboard/drilldown/', { params: { ...requestParams(filters), metric: metric.code, query, cursor: next || undefined, ...metric.extra } });
      setRows(previous => append ? [...previous, ...response.data.results] : response.data.results);
      setCursor(response.data.next_cursor); setTotal(response.data.total);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail || 'This customer list could not be loaded.');
    } finally { setLoading(false); }
  }, [filters, metric, query]);

  useEffect(() => { const timer = window.setTimeout(() => load(), 250); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') workspace ? setWorkspace(null) : onClose(); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose, workspace]);

  return <div className={`crm-drawer-backdrop ${mobile ? 'is-mobile' : ''}`} role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="crm-drawer" role="dialog" aria-modal="true" aria-labelledby="crm-detail-title">
      <header className="crm-drawer-header"><div><h2 id="crm-detail-title">{metric.title}</h2><span>{total.toLocaleString()} {total === 1 ? 'record' : 'records'}</span></div><button onClick={onClose} aria-label="Close customer list"><X /></button></header>
      <label className="crm-detail-search"><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name, phone or Telegram" /></label>
      {error && <div className="crm-inline-error"><span>{error}</span><button onClick={() => load()}>Retry</button></div>}
      <div className="crm-detail-list">
        {loading && !rows.length && Array.from({ length: 6 }).map((_, index) => <div className="crm-customer-row-skeleton" key={index} />)}
        {rows.map((row, index) => {
          const identityCount = row.identity_count || row.identities?.length || 0;
          const canOpen = Boolean(row.lead_id);
          return <button className="crm-customer-row" key={`${row.row_type}-${row.id}-${index}`} disabled={!canOpen} onClick={() => canOpen && setWorkspace({ leadId: row.lead_id, tab: tabForMetric(metric.code) })}>
            <span className="crm-avatar">{(row.customer_name || '?').split(/\s+/).slice(0, 2).map((part: string) => part[0]).join('').toUpperCase()}</span>
            <span className="crm-customer-main"><strong>{row.customer_name || row.order_name || 'Unknown customer'}</strong><span>{metricIdentity(row)}{identityCount > 1 ? ` · +${identityCount - 1} contacts` : ''}</span><small>{row.customer_need || row.category || row.source || 'Customer details not completed'}</small></span>
            <span className="crm-customer-fact"><b>{row.metric_fact || row.pipeline_stage?.name || row.status?.replaceAll('_', ' ').toLowerCase() || row.profile_state?.toLowerCase()}</b><small>{row.owner?.name || row.salesperson || ''}</small></span>
            {canOpen && <ChevronRight />}
          </button>;
        })}
        {!loading && !rows.length && <div className="crm-empty"><Users /><strong>No customers match this view</strong><span>Change the date, salesperson, or search text.</span></div>}
        {loading && !!rows.length && <div className="crm-list-loading"><RefreshCw className="spin" /> Loading more customers</div>}
      </div>
      {cursor && !loading && <button className="crm-load-more" onClick={() => load(cursor, true)}>Load older records</button>}
      {workspace && <div className="crm-workspace-overlay"><LeadWorkspace leadId={workspace.leadId} initialTab={workspace.tab} onBack={() => setWorkspace(null)} /></div>}
    </section>
  </div>;
}

function SummaryMetric({ label, value, onClick, emphasis = false }: { label: string; value: number; onClick: () => void; emphasis?: boolean }) {
  return <button className={emphasis ? 'is-emphasis' : ''} onClick={onClick} aria-label={`${label}: ${value}. Open customers`}><strong>{value.toLocaleString()}</strong><span>{label}</span></button>;
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return <header className="crm-ledger-heading"><h3>{title}</h3>{action}</header>;
}

export default function CrmAdminDashboard({ mobile = false, onBack }: { mobile?: boolean; onBack?: () => void }) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [drilldown, setDrilldown] = useState<Metric | null>(null);

  const load = useCallback(async (preserve = false) => {
    preserve ? setRefreshing(true) : setLoading(true); setError('');
    try { const response = await api.get('/lead/crm/admin-dashboard/', { params: requestParams(filters) }); setData(response.data); }
    catch (requestError: any) { setError(requestError?.response?.data?.detail || 'CRM activity could not be loaded.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [filters]);

  useEffect(() => { load(Boolean(data)); }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('crm_preset', filters.preset); params.set('crm_date', filters.date); params.set('crm_from', filters.date_from); params.set('crm_to', filters.date_to);
    filters.salesperson_id ? params.set('crm_salesperson', filters.salesperson_id) : params.delete('crm_salesperson');
    window.history.replaceState({}, '', `${window.location.pathname}?${params}${window.location.hash}`);
  }, [filters]);

  const activity = data?.period_activity || data;
  const pipeline = data?.pipeline_current || data?.pipeline || [];
  const team = data?.team || data?.salespeople || [];
  const pipelineTotal = useMemo(() => pipeline.reduce((sum: number, stage: any) => sum + stage.count, 0), [pipeline]);
  const maxStageCount = useMemo(() => Math.max(1, ...pipeline.map((stage: any) => stage.count)), [pipeline]);
  const stageCount = (code: string) => pipeline.find((stage: any) => stage.code === code)?.count || 0;
  const movementCount = (code: string) => (data?.pipeline_movements || []).find((move: any) => move.stage_code === code || move.stage?.toUpperCase().replaceAll(' ', '_') === code)?.count || 0;
  const periodLabel = filters.preset === 'single' ? filters.date : filters.preset === 'custom' ? `${filters.date_from} to ${filters.date_to}` : presetLabels[filters.preset];

  if (loading && !data) return <div className={`crm-admin-dashboard ${mobile ? 'is-mobile' : ''}`}><DashboardSkeleton /></div>;
  return <main className={`crm-admin-dashboard ${mobile ? 'is-mobile' : ''}`}>
    <header className="crm-toolbar">{mobile && <button className="crm-icon-button" onClick={onBack} aria-label="Back to Mobile Admin"><ArrowLeft /></button>}<div><h1>CRM</h1><span>{periodLabel}</span></div><button className="crm-icon-button" onClick={() => load(true)} disabled={refreshing} aria-label="Refresh CRM dashboard"><RefreshCw className={refreshing ? 'spin' : ''} /></button></header>
    {refreshing && <div className="crm-refresh-line" />}
    <section className="crm-filter-bar" aria-label="CRM dashboard filters">
      <CalendarDays />
      <div className="crm-presets">{(Object.entries(presetLabels) as [Preset, string][]).map(([id, label]) => <button className={filters.preset === id ? 'active' : ''} key={id} onClick={() => setFilters(value => ({ ...value, preset: id }))}>{label}</button>)}</div>
      {filters.preset === 'single' && <input aria-label="Selected date" type="date" value={filters.date} onChange={event => setFilters(value => ({ ...value, date: event.target.value }))} />}
      {filters.preset === 'custom' && <div className="crm-date-range"><input aria-label="Start date" type="date" value={filters.date_from} onChange={event => setFilters(value => ({ ...value, date_from: event.target.value }))} /><ArrowRight /><input aria-label="End date" type="date" value={filters.date_to} onChange={event => setFilters(value => ({ ...value, date_to: event.target.value }))} /></div>}
      <select value={filters.salesperson_id} onChange={event => setFilters(value => ({ ...value, salesperson_id: event.target.value }))} aria-label="Salesperson"><option value="">All salespeople</option>{team.map((person: any) => <option value={person.id} key={person.id}>{person.name}</option>)}</select>
    </section>
    {error && <div className="crm-inline-error"><span>{error}</span><button onClick={() => load(Boolean(data))}>Retry</button></div>}
    {data && <>
      <section className="crm-operational-summary">
        <div className="crm-summary-primary">
          <SummaryMetric emphasis label="Unique customers" value={activity.calls.unique_customers} onClick={() => setDrilldown({ code: 'UNIQUE_CUSTOMERS', title: 'Unique customers' })} />
          <SummaryMetric label="Total calls" value={activity.calls.total} onClick={() => setDrilldown({ code: 'TOTAL_CALLS', title: 'Total calls' })} />
          <SummaryMetric label="Needs details" value={data.attention?.needs_details ?? activity.profile_completion.missing} onClick={() => setDrilldown({ code: 'DETAILS_MISSING', title: 'Needs details' })} />
          <SummaryMetric label="Converted clients" value={activity.orders.clients_ordered} onClick={() => setDrilldown({ code: 'CLIENTS_ORDERED', title: 'Converted clients' })} />
        </div>
        <div className="crm-summary-secondary">
          <button onClick={() => setDrilldown({ code: 'DETAILS_COMPLETE', title: 'Completed profiles' })}><b>{activity.profile_completion.complete}</b> completed profiles</button>
          <button onClick={() => setDrilldown({ code: 'PIPELINE_STAGE', title: 'New leads', extra: { stage_code: 'NEW_LEAD' } })}><b>{stageCount('NEW_LEAD')}</b> new leads</button>
          <button onClick={() => setDrilldown({ code: 'MOCKUP_IN_PROGRESS', title: 'Open mockup work' })}><b>{activity.mockups.currently_open ?? activity.mockups.in_progress}</b> open mockups</button>
          <button onClick={() => setDrilldown({ code: 'PIPELINE_STAGE', title: 'Cold customers', extra: { stage_code: 'COLD' } })}><b>{stageCount('COLD') + stageCount('LOST')}</b> cold or lost</button>
        </div>
      </section>
      <section className="crm-call-ledger" aria-label="Call outcomes">{[['ANSWERED_CALLS', 'Answered', activity.calls.answered, 'success'], ['OUTGOING_CALLS', 'Outgoing', activity.calls.outgoing, 'primary'], ['MISSED_CALLS', 'Missed', activity.calls.missed, 'warning'], ['REJECTED_CALLS', 'Rejected', activity.calls.rejected, 'danger']].map(([code, label, rawValue, tone]) => { const value = Number(rawValue); const percent = activity.calls.total ? Math.round(value * 100 / activity.calls.total) : 0; return <button className={`tone-${tone}`} key={String(code)} onClick={() => setDrilldown({ code: String(code), title: `${label} calls` })}><i /><span><strong>{value.toLocaleString()}</strong><small>{label}</small></span><b>{percent}%</b></button>; })}</section>
      {!activity.calls.total && !activity.mockups.requested && !activity.orders.clients_ordered && <div className="crm-period-empty">No CRM activity for {periodLabel.toLowerCase()}.</div>}
      <section className="crm-ledger-section crm-pipeline-section">
        <SectionHeader title="Pipeline" action={<span>{pipelineTotal.toLocaleString()} tracked customers</span>} />
        <div className="crm-pipeline-rail">{pipeline.map((stage: any) => <button key={stage.code} onClick={() => setDrilldown({ code: 'PIPELINE_STAGE', title: stage.name, extra: { stage_code: stage.code } })}><span><i style={{ backgroundColor: stage.color }} /><strong>{stage.name}</strong></span><b>{stage.count.toLocaleString()}</b><em><i style={{ width: `${stage.count * 100 / maxStageCount}%`, backgroundColor: stage.color }} /></em></button>)}</div>
        <p className="crm-pipeline-movement">{movementCount('NEW_LEAD')} entered New Lead · {movementCount('MOCKUP_REQUESTED')} requested mockups · {movementCount('CONVERTED')} converted · {movementCount('LOST')} lost</p>
      </section>
      <div className="crm-management-grid">
        <section className="crm-ledger-section crm-design-section"><SectionHeader title="Design work" action={<Layers3 />} />{([['Mockups', 'MOCKUP', activity.mockups], ['Modifications', 'MODIFICATION', activity.modifications]] as any[]).map(([label, prefix, group]) => <div className="crm-work-ledger" key={prefix}><h4>{label}</h4>{[['Requested', 'REQUESTED', group.requested], ['In progress', 'IN_PROGRESS', group.in_progress], ['Returned', 'RETURNED', group.returned], ['Open now', 'IN_PROGRESS', group.currently_open ?? group.in_progress]].map(([name, suffix, value]) => <button key={String(name)} onClick={() => setDrilldown({ code: `${prefix}_${suffix}`, title: `${label} ${String(name).toLowerCase()}` })}><span>{name}</span><strong>{Number(value).toLocaleString()}</strong></button>)}</div>)}<div className="crm-attention-row"><button onClick={() => setDrilldown({ code: 'MOCKUP_IN_PROGRESS', title: 'Stalled work', extra: { stalled: '1' } })}><CircleAlert /><span>Stalled work</span><b>{data.attention?.stalled_mockups || 0}</b></button><button onClick={() => setDrilldown({ code: 'RETURNED_WITHOUT_ORDER', title: 'Returned without order' })}><PackageCheck /><span>Returned without order</span><b>{data.attention?.returned_without_order || 0}</b></button></div></section>
        <section className="crm-ledger-section crm-conversion-section"><SectionHeader title="Orders" /><button className="crm-order-statement" onClick={() => setDrilldown({ code: 'CLIENTS_ORDERED', title: 'Converted clients' })}><strong>{activity.orders.clients_ordered}</strong><span>clients created</span><strong>{activity.orders.orders_created}</strong><span>order lines</span><ChevronRight /></button><div className="crm-profile-grid"><div className="crm-profile-field"><span>Linked customers</span><strong>{activity.orders.unique_customers}</strong></div><div className="crm-profile-field"><span>Orders per client</span><strong>{activity.orders.average_orders_per_client}</strong></div><div className="crm-profile-field"><span>Marked cold</span><strong>{data.cold_dispositions.marked_cold}</strong></div><div className="crm-profile-field"><span>Overdue follow-ups</span><strong>{data.attention?.overdue_follow_ups || 0}</strong></div></div>{!!data.cold_reasons.length && <div className="crm-cold-list"><h4>Cold reasons</h4>{data.cold_reasons.slice(0, 5).map((reason: any) => <button key={reason.reason} onClick={() => setDrilldown({ code: 'COLD_REASON', title: reason.reason, extra: { reason: reason.reason } })}><span>{reason.reason}</span><b>{reason.count}</b></button>)}</div>}</section>
      </div>
      <section className="crm-ledger-section crm-team-section"><SectionHeader title="Sales team" action={<Users />} /><div className="crm-team-list">{team.map((person: any) => <details key={person.id} className={!person.tracking_active ? 'is-inactive' : ''}><summary><span><strong>{person.name}</strong><small>{person.tracking_active ? `${person.unique_customers} customers · ${person.total_calls} calls` : 'Tracking not activated'}</small></span>{person.tracking_active && <span className="crm-team-totals"><b>{person.needs_details}</b><small>need details</small><b>{person.open_mockups}</b><small>open mockups</small><b>{person.clients_ordered}</b><small>converted</small></span>}<ChevronDown /></summary>{person.tracking_active && <div className="crm-team-detail"><div className="crm-team-metrics">{[['Answered', person.answered], ['Missed', person.missed], ['Rejected', person.rejected], ['Profiles completed', person.details_completed], ['Mockups requested', person.mockups_requested], ['Mockups returned', person.mockups_returned], ['Cold', person.marked_cold], ['Order lines', person.orders_created]].map(([label, value]) => <span key={String(label)}><small>{label}</small><b>{value}</b></span>)}</div><div className="crm-mini-pipeline">{person.pipeline?.map((stage: any) => <span key={stage.code}><i style={{ background: pipeline.find((item: any) => item.code === stage.code)?.color }} /><small>{stage.name}</small><b>{stage.count}</b></span>)}</div><button onClick={() => setFilters(value => ({ ...value, salesperson_id: String(person.id) }))}>Filter dashboard to {person.name}</button></div>}</details>)}</div></section>
      {(data.data_quality.legacy_call_date_fallback > 0 || data.data_quality.containers_without_lead > 0) && <aside className="crm-quality-note">{data.data_quality.legacy_call_date_fallback} calls used legacy timestamps · {data.data_quality.containers_without_lead} order containers are not linked to a CRM customer.</aside>}
    </>}
    {drilldown && <Drilldown metric={drilldown} filters={filters} mobile={mobile} onClose={() => setDrilldown(null)} />}
  </main>;
}
