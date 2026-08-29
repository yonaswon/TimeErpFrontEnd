'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, CheckCircle2, CircleAlert, Clock3, Layers3,
  MessageSquareText, PackageCheck, Phone, RefreshCw, ShieldCheck, UserRound,
} from 'lucide-react';
import api from '@/api';
import LeadDetailsPanel from './LeadDetailsPanel';

export type WorkspaceTab = 'overview' | 'conversation' | 'design' | 'orders';

type LeadWorkspaceProps = {
  leadId: number;
  initialTab: WorkspaceTab;
  onBack: () => void;
};

const formatDate = (value?: string | null) => value
  ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
  : 'Not set';

function WorkspaceSkeleton() {
  return <div className="crm-workspace-skeleton" aria-label="Loading customer workspace">
    <div className="crm-sk crm-sk-header" />
    {Array.from({ length: 6 }).map((_, index) => <div className="crm-sk crm-sk-row" key={index} />)}
  </div>;
}

function FieldRow({ label, value, missing = false }: { label: string; value?: React.ReactNode; missing?: boolean }) {
  return <div className="crm-profile-field">
    <span>{label}</span>
    <strong className={missing ? 'is-missing' : ''}>{value || 'Not set'}</strong>
  </div>;
}

function OverviewTab({ lead }: { lead: any }) {
  const profile = lead.profile;
  return <div className="crm-workspace-overview">
    <section className="crm-ledger-section">
      <header><h3>Profile</h3><span>{profile.progress.completed} of {profile.progress.required} complete</span></header>
      <div className="crm-profile-grid">
        <FieldRow label="Customer name" value={profile.customer_name} missing={profile.missing_fields.includes('customer_name')} />
        <FieldRow label="Customer need" value={profile.customer_need} missing={profile.missing_fields.includes('interest_note')} />
        <FieldRow label="Source" value={profile.source?.name} missing={profile.missing_fields.includes('source')} />
        <FieldRow label="Category" value={profile.category?.name} missing={profile.missing_fields.includes('customer_category')} />
        <FieldRow label="Follow-up" value={profile.follow_up_at ? formatDate(profile.follow_up_at) : profile.no_follow_up_reason} missing={profile.missing_fields.includes('follow_up')} />
        {(profile.cold_reason || profile.lost_reason) && <FieldRow label={profile.cold_reason ? 'Cold reason' : 'Lost reason'} value={profile.cold_reason || profile.lost_reason} />}
      </div>
    </section>

    <section className="crm-ledger-section">
      <header><h3>Connected identities</h3><span>{lead.identities.length}</span></header>
      <div className="crm-identity-ledger">
        {lead.identities.map((identity: any) => <div key={identity.id} className="crm-identity-record">
          <span className="crm-identity-type">{identity.type === 'PHONE' ? <Phone /> : <MessageSquareText />}</span>
          <span className="crm-identity-value"><strong>{identity.display_value}</strong><small>{identity.type.replaceAll('_', ' ').toLowerCase()}</small></span>
          <span className="crm-identity-context"><b>{identity.owner?.name}</b><small>{identity.latest_communication_at ? `Last used ${formatDate(identity.latest_communication_at)}` : 'No communication recorded'}</small></span>
          {identity.is_primary && <span className="crm-primary-mark">Primary</span>}
        </div>)}
        {!lead.identities.length && <div className="crm-section-empty">No connected phone or Telegram identity.</div>}
      </div>
    </section>

    <section className="crm-ledger-section">
      <header><h3>Ownership</h3></header>
      <div className="crm-owner-row"><UserRound /><span><small>Primary owner</small><strong>{lead.owner.name}</strong></span></div>
      {lead.participants.map((person: any) => <div className="crm-owner-row" key={`${person.id}-${person.role}`}><ShieldCheck /><span><small>{person.role.toLowerCase()}</small><strong>{person.name}</strong></span><time>{person.latest_activity_at ? formatDate(person.latest_activity_at) : ''}</time></div>)}
    </section>

    <section className="crm-ledger-section">
      <header><h3>Business status</h3></header>
      <div className="crm-profile-grid">
        <FieldRow label="Pipeline" value={lead.pipeline_stage?.name || 'Needs Details'} />
        <FieldRow label="Profile" value={profile.profile_state === 'PROVISIONAL' ? 'Needs details' : profile.profile_state.toLowerCase()} />
        <FieldRow label="Latest communication" value={lead.latest_communication?.occurred_at ? `${lead.latest_communication.channel} · ${formatDate(lead.latest_communication.occurred_at)}` : 'No communication recorded'} />
        <FieldRow label="Mockups" value={lead.counts.mockups} />
        <FieldRow label="Orders" value={lead.counts.orders} />
        <FieldRow label="Consent" value={profile.consent_state.toLowerCase()} />
        <FieldRow label="Contact permission" value={profile.do_not_contact ? `Do not contact${profile.do_not_contact_reason ? `: ${profile.do_not_contact_reason}` : ''}` : 'Contact allowed'} />
      </div>
    </section>
  </div>;
}

function DesignWorkTab({ leadId }: { leadId: number }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const load = () => {
    setError('');
    api.get(`/lead/crm/leads/${leadId}/design-work/`).then(response => setData(response.data)).catch(error => setError(error?.response?.data?.detail || 'Design work could not be loaded.'));
  };
  useEffect(load, [leadId]);
  if (!data && !error) return <WorkspaceSkeleton />;
  if (error) return <div className="crm-local-error"><CircleAlert /> <span>{error}</span><button onClick={load}>Retry</button></div>;
  if (!data.results.length) return <div className="crm-section-empty">No mockups or modifications for this customer.</div>;
  return <div className="crm-design-ledger">
    <div className="crm-tab-summary"><span><b>{data.counts.active}</b> active</span><span><b>{data.counts.returned}</b> returned</span><span><b>{data.counts.modifications}</b> modifications</span></div>
    {data.results.map((mockup: any) => <details className="crm-work-chain" key={mockup.id} open={mockup.status === 'STARTED'}>
      <summary><span><strong>{mockup.name}</strong><small>{mockup.designer.name} · {formatDate(mockup.requested_at)}</small></span><b>{mockup.progress_percent}%</b></summary>
      <div className="crm-work-progress"><i style={{ width: `${mockup.progress_percent}%` }} /></div>
      <div className="crm-work-facts"><FieldRow label="Status" value={mockup.status.toLowerCase()} /><FieldRow label="Size" value={mockup.width && mockup.height ? `${mockup.width} × ${mockup.height}` : 'Not set'} /><FieldRow label="Price" value={mockup.price ? `${mockup.price.toLocaleString()} ETB${mockup.price_with_vat ? ' incl. VAT' : ''}` : 'Not set'} /><FieldRow label="Note" value={mockup.note} /></div>
      {mockup.returned_media && <a className="crm-returned-media" href={mockup.returned_media} target="_blank" rel="noreferrer">View returned design</a>}
      {!!mockup.modifications.length && <div className="crm-revision-list"><h4>Modifications</h4>{mockup.modifications.map((revision: any, index: number) => <div key={revision.id}><span><strong>Revision {mockup.modifications.length - index}</strong><small>{revision.status.toLowerCase()} · {formatDate(revision.requested_at)}</small></span><b>{revision.progress_percent}%</b></div>)}</div>}
    </details>)}
  </div>;
}

function OrdersTab({ leadId }: { leadId: number }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const load = () => {
    setError('');
    api.get(`/lead/crm/leads/${leadId}/orders/`).then(response => setData(response.data)).catch(error => setError(error?.response?.data?.detail || 'Orders could not be loaded.'));
  };
  useEffect(load, [leadId]);
  if (!data && !error) return <WorkspaceSkeleton />;
  if (error) return <div className="crm-local-error"><CircleAlert /> <span>{error}</span><button onClick={load}>Retry</button></div>;
  if (!data.results.length) return <div className="crm-section-empty">No order has been created for this customer.</div>;
  return <div className="crm-order-ledger">{data.results.map((container: any) => <section key={container.id} className="crm-ledger-section">
    <header><h3>{container.client}</h3><span>{container.order_count} order{container.order_count === 1 ? '' : 's'}</span></header>
    <div className="crm-profile-grid"><FieldRow label="Created" value={formatDate(container.created_at)} /><FieldRow label="Delivery" value={formatDate(container.delivery_at)} /><FieldRow label="Location" value={container.location} /><FieldRow label="Total" value={`${Number(container.full_payment).toLocaleString()} ETB`} /><FieldRow label="Paid" value={`${Number(container.advance_payment).toLocaleString()} ETB`} /><FieldRow label="Remaining" value={`${Number(container.remaining_payment).toLocaleString()} ETB`} /></div>
    <div className="crm-order-lines">{container.orders.map((order: any) => <div key={order.id}><span><strong>{order.name}</strong><small>{order.design_type}</small></span><span><b>{Number(order.price).toLocaleString()} ETB</b><small>{order.status.replaceAll('-', ' ').toLowerCase()}</small></span></div>)}</div>
  </section>)}</div>;
}

export default function LeadWorkspace({ leadId, initialTab, onBack }: LeadWorkspaceProps) {
  const [tab, setTab] = useState<WorkspaceTab>(initialTab);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const load = () => {
    setError('');
    api.get(`/lead/crm/leads/${leadId}/workspace/`).then(response => setData(response.data)).catch(error => setError(error?.response?.data?.detail || 'Customer details could not be loaded.'));
  };
  useEffect(load, [leadId]);
  const tabs = useMemo(() => [
    { id: 'overview' as const, label: 'Overview', icon: UserRound },
    { id: 'conversation' as const, label: 'Conversation', icon: MessageSquareText },
    { id: 'design' as const, label: 'Design work', icon: Layers3 },
    { id: 'orders' as const, label: 'Orders', icon: PackageCheck },
  ], []);

  return <section className="crm-workspace" aria-label="Customer workspace">
    <header className="crm-workspace-header">
      <button onClick={onBack} aria-label="Back to customers"><ArrowLeft /></button>
      <div className="crm-workspace-title">
        <strong>{data?.lead?.display_name || 'Customer'}</strong>
        <span>{data?.lead?.pipeline_stage?.name || 'Loading customer status'}</span>
      </div>
      {data?.lead && <div className="crm-workspace-state"><span>{data.lead.profile.profile_completed ? <CheckCircle2 /> : <Clock3 />}{data.lead.profile.profile_completed ? 'Details complete' : `${data.lead.profile.progress.completed}/${data.lead.profile.progress.required} details`}</span><small>{data.lead.owner.name}</small></div>}
      <button onClick={load} aria-label="Refresh customer"><RefreshCw /></button>
    </header>
    <nav className="crm-workspace-tabs" aria-label="Customer sections">{tabs.map(item => { const Icon = item.icon; return <button className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)} key={item.id}><Icon />{item.label}</button>; })}</nav>
    <div className="crm-workspace-body">
      {!data && !error && <WorkspaceSkeleton />}
      {error && <div className="crm-local-error"><CircleAlert /><span>{error}</span><button onClick={load}>Retry</button></div>}
      {data && tab === 'overview' && <OverviewTab lead={data.lead} />}
      {data && tab === 'conversation' && <LeadDetailsPanel leadId={leadId} showProfileHeader={false} />}
      {data && tab === 'design' && <DesignWorkTab leadId={leadId} />}
      {data && tab === 'orders' && <OrdersTab leadId={leadId} />}
    </div>
  </section>;
}
