'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowDown, FileText, Loader2, MessageCircle, Pause, Phone, Play, RefreshCw, Send } from 'lucide-react';
import api from '@/api';
import { useCrmEvents } from './useCrmEvents';

type Channel = 'ALL' | 'CALL' | 'SMS' | 'TELEGRAM';
type Attachment = { media_type: string; mime_type?: string; filename?: string; processing_state: string; content_url?: string; thumbnail_url?: string; transcript?: string };
type Event = { event_id: number; channel: string; direction: string; occurred_at: string; preview?: string; duration_seconds?: number; salesperson?: { full_name?: string; username?: string }; identity?: { type: string; value: string }; call?: { status: string; duration_seconds: number }; attachments?: Attachment[] };
type Conversation = { lead: any; results: Event[]; next_cursor: string | null; counts: Record<string, number> };

const time = (value: string) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const day = (value: string) => new Date(value).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const duration = (seconds = 0) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

function AuthenticatedImage({ attachment }: { attachment: Attachment }) {
  const [source, setSource] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true; let objectUrl = '';
    if (!attachment.content_url) return;
    api.get(attachment.thumbnail_url || attachment.content_url, { responseType: 'blob' })
      .then(response => { if (active) { objectUrl = URL.createObjectURL(response.data); setSource(objectUrl); } })
      .catch(() => active && setFailed(true));
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [attachment.content_url, attachment.thumbnail_url]);
  if (failed) return <div className="crm-media-state">Image could not be loaded.</div>;
  if (!source) return <div className="crm-sk" style={{ width: 180, height: 120, marginTop: 6 }} />;
  return <button className="crm-chat-image" onClick={() => window.open(source, '_blank')}><img src={source} alt={attachment.filename || 'Shared image'} /></button>;
}

export default function LeadDetailsPanel({ leadId, showProfileHeader = true }: { leadId: number; showProfileHeader?: boolean }) {
  const [data, setData] = useState<Conversation | null>(null);
  const [channel, setChannel] = useState<Channel>('ALL');
  const [loading, setLoading] = useState(true);
  const [olderLoading, setOlderLoading] = useState(false);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState<number | null>(null);
  const [buffering, setBuffering] = useState<number | null>(null);
  const [position, setPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [expandedTranscript, setExpandedTranscript] = useState<number | null>(null);
  const [newActivity, setNewActivity] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (cursor?: string, append = false) => {
    append ? setOlderLoading(true) : setLoading(true); setError('');
    const beforeHeight = scrollRef.current?.scrollHeight || 0;
    if (!append) abortRef.current?.abort();
    const controller = new AbortController();
    if (!append) abortRef.current = controller;
    try {
      const response = await api.get(`/lead/crm/leads/${leadId}/conversation/`, { params: { page_size: 30, channel: channel === 'ALL' ? undefined : channel, cursor }, signal: controller.signal });
      setData(previous => append && previous ? { ...response.data, lead: previous.lead, results: [...previous.results, ...response.data.results] } : response.data);
      requestAnimationFrame(() => { const element = scrollRef.current; if (!element) return; if (append) element.scrollTop += element.scrollHeight - beforeHeight; else element.scrollTop = element.scrollHeight; });
    } catch (requestError: any) {
      if (requestError?.code !== 'ERR_CANCELED') setError(requestError?.response?.data?.detail || 'Conversation could not be loaded.');
    } finally { setLoading(false); setOlderLoading(false); }
  }, [leadId, channel]);

  useEffect(() => { setData(null); load(); return () => abortRef.current?.abort(); }, [load]);
  useEffect(() => () => { audioRef.current?.pause(); if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); }, []);
  useCrmEvents(event => {
    if (!['communication.committed', 'communication.created', 'communication.updated', 'communication.attachment_updated'].includes(event.type)) return;
    if (Number(event.payload?.lead_id) !== leadId) return;
    const element = scrollRef.current;
    const nearBottom = element ? element.scrollHeight - element.scrollTop - element.clientHeight < 100 : true;
    if (nearBottom) load(); else setNewActivity(true);
  });

  const play = async (eventId: number, attachment: Attachment) => {
    if (playing === eventId) { audioRef.current?.pause(); setPlaying(null); return; }
    setBuffering(eventId); setError('');
    try {
      audioRef.current?.pause(); if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      if (!attachment.content_url) throw new Error('unavailable');
      const response = await api.get(attachment.content_url, { responseType: 'blob' });
      const objectUrl = URL.createObjectURL(response.data); objectUrlRef.current = objectUrl;
      const audio = new Audio(objectUrl); audioRef.current = audio;
      audio.ontimeupdate = () => setPosition(audio.currentTime);
      audio.onloadedmetadata = () => setAudioDuration(audio.duration || 0);
      audio.onended = () => { setPlaying(null); setPosition(0); };
      audio.onerror = () => { setPlaying(null); setError('This recording could not be played.'); };
      await audio.play(); setPlaying(eventId);
    } catch { setError('This recording could not be played or is no longer available.'); }
    finally { setBuffering(null); }
  };

  const events = useMemo(() => [...(data?.results || [])].reverse(), [data?.results]);
  const channels: { id: Channel; label: string; count: number }[] = [
    { id: 'ALL', label: 'All', count: (data?.counts?.call || 0) + (data?.counts?.sms || 0) + (data?.counts?.telegram || 0) },
    { id: 'CALL', label: 'Calls', count: data?.counts?.call || 0 }, { id: 'SMS', label: 'SMS', count: data?.counts?.sms || 0 }, { id: 'TELEGRAM', label: 'Telegram', count: data?.counts?.telegram || 0 },
  ];
  let previousDay = '';

  return <div className="crm-conversation">
    {showProfileHeader && data?.lead && <div className="crm-conversation-profile"><div className="crm-conversation-avatar">{data.lead.display_name.split(/\s+/).slice(0, 2).map((part: string) => part[0]).join('').toUpperCase()}</div><div><strong>{data.lead.display_name}</strong><span>{data.lead.identities?.find((identity: any) => identity.is_primary)?.value || data.lead.identities?.[0]?.value || 'No primary identity'}</span></div><div className="crm-conversation-state"><b>{data.lead.profile_state === 'PROVISIONAL' ? 'Needs details' : data.lead.profile_state?.toLowerCase()}</b>{data.lead.pipeline_stage?.name && <span>{data.lead.pipeline_stage.name}</span>}</div></div>}
    <div className="crm-channel-tabs">{channels.map(item => <button key={item.id} className={channel === item.id ? 'active' : ''} onClick={() => setChannel(item.id)}>{item.label}<span>{item.count}</span></button>)}</div>
    {error && <div className="crm-conversation-error"><AlertCircle size={16} />{error}<button onClick={() => load()}>Retry</button></div>}
    <div className="crm-message-list" ref={scrollRef}>
      {loading && !data && <div className="crm-bubble-skeletons">{Array.from({ length: 7 }).map((_, index) => <i key={index} />)}</div>}
      {data?.next_cursor && <button className="crm-load-older" onClick={() => load(data.next_cursor!, true)} disabled={olderLoading}>{olderLoading ? <Loader2 className="spin" /> : <RefreshCw />} Load older activity</button>}
      {!loading && data && !events.length && <div className="crm-conversation-empty"><MessageCircle /><strong>No communication recorded</strong><span>No eligible activity exists since TimeCRM tracking started.</span></div>}
      {events.map(event => {
        const eventDay = day(event.occurred_at); const showDay = eventDay !== previousDay; previousDay = eventDay;
        const incoming = event.direction.toUpperCase() === 'INCOMING';
        const audio = event.attachments?.find(item => ['CALL_RECORDING', 'VOICE', 'AUDIO'].includes(item.media_type));
        const transcript = audio?.transcript || event.attachments?.find(item => item.transcript)?.transcript;
        return <React.Fragment key={event.event_id}>{showDay && <div className="crm-day-separator"><span>{eventDay}</span></div>}<article className={`crm-message ${incoming ? 'incoming' : 'outgoing'}`}><div className="crm-message-bubble">
          <header>{event.channel === 'CALL' ? <Phone /> : event.channel === 'TELEGRAM' ? <Send /> : <MessageCircle />}<b>{event.channel === 'CALL' ? (event.call?.status || 'Call').toLowerCase().replace('_', ' ') : event.channel === 'TELEGRAM' ? 'Telegram' : 'SMS'}</b>{event.identity?.value && <span className="crm-event-identity">{event.identity.type === 'TELEGRAM_USERNAME' && !event.identity.value.startsWith('@') ? '@' : ''}{event.identity.value}</span>}</header>
          {event.preview && <p>{event.preview}</p>}
          {event.attachments?.filter(item => item.mime_type?.startsWith('image/')).map((item, index) => item.content_url && <AuthenticatedImage attachment={item} key={index} />)}
          {event.attachments?.filter(item => item.mime_type && !item.mime_type.startsWith('image/') && !['CALL_RECORDING', 'VOICE', 'AUDIO'].includes(item.media_type)).map((item, index) => <div className="crm-document" key={index}><FileText /><span>{item.filename || 'Attachment'}</span><small>{item.processing_state?.toLowerCase()}</small></div>)}
          {audio && <div className="crm-audio-row"><button onClick={() => play(event.event_id, audio)} disabled={buffering === event.event_id || !audio.content_url}>{buffering === event.event_id ? <Loader2 className="spin" /> : playing === event.event_id ? <Pause /> : <Play />}</button><input type="range" min="0" max={playing === event.event_id ? audioDuration || 1 : event.duration_seconds || event.call?.duration_seconds || 1} value={playing === event.event_id ? position : 0} onChange={e => { if (audioRef.current) audioRef.current.currentTime = Number(e.target.value); }} disabled={playing !== event.event_id} /><span>{duration(playing === event.event_id ? Math.floor(position) : event.duration_seconds || event.call?.duration_seconds || 0)}</span></div>}
          {audio && !audio.content_url && <small className="crm-media-state">{audio.processing_state === 'EXPIRED' ? 'Recording expired' : audio.processing_state === 'FAILED' ? 'Upload failed' : 'Recording is not ready'}</small>}
          {transcript && <div className="crm-transcript"><button onClick={() => setExpandedTranscript(expandedTranscript === event.event_id ? null : event.event_id)}>Transcript</button>{expandedTranscript === event.event_id && <p>{transcript}</p>}</div>}
          <footer>{!incoming && <span>{event.salesperson?.full_name || event.salesperson?.username}</span>}<time>{time(event.occurred_at)}</time></footer>
        </div></article></React.Fragment>;
      })}
    </div>
    {newActivity && <button className="crm-new-activity" onClick={() => { setNewActivity(false); load(); }}><ArrowDown /> New activity</button>}
  </div>;
}
