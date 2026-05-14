import { useEffect, useRef, useCallback } from 'react';
import { base_url } from '../../../api';

export type CrmEventType =
    | 'reanalyze.started'
    | 'reanalyze.progress'
    | 'reanalyze.done'
    | 'reanalyze.error'
    | 'lead.merged'
    | 'lead.created'
    | 'followup.due'
    | 'transcript.updated';

export interface CrmEvent {
    type: CrmEventType;
    payload: Record<string, any>;
}

type Handler = (event: CrmEvent) => void;

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000];

/**
 * useCrmEvents — subscribes to the Django Channels CRM progress WebSocket.
 * Automatically reconnects with exponential backoff on disconnect.
 *
 * @param onEvent  callback invoked for every incoming event
 * @param enabled  set to false to skip connecting (e.g. when logged out)
 */
export function useCrmEvents(onEvent: Handler, enabled = true) {
    const wsRef = useRef<WebSocket | null>(null);
    const retryRef = useRef(0);
    const mountedRef = useRef(true);
    const onEventRef = useRef(onEvent);
    onEventRef.current = onEvent;

    const connect = useCallback(() => {
        if (!mountedRef.current || !enabled) return;

        const token = localStorage.getItem('access_token');
        if (!token) return;

        // Build WS URL from base_url (http→ws, https→wss)
        const wsBase = base_url.replace(/^http/, 'ws');
        const url = `${wsBase}/ws/crm/progress/?token=${encodeURIComponent(token)}`;

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            retryRef.current = 0;
        };

        ws.onmessage = (ev) => {
            try {
                const data = JSON.parse(ev.data);
                if (data?.type && mountedRef.current) {
                    onEventRef.current({ type: data.type, payload: data.payload || data });
                }
            } catch {
                // ignore malformed frames
            }
        };

        ws.onclose = () => {
            if (!mountedRef.current) return;
            const delay = RECONNECT_DELAYS[Math.min(retryRef.current, RECONNECT_DELAYS.length - 1)];
            retryRef.current += 1;
            setTimeout(connect, delay);
        };

        ws.onerror = () => {
            ws.close();
        };
    }, [enabled]);

    useEffect(() => {
        mountedRef.current = true;
        if (enabled) connect();
        return () => {
            mountedRef.current = false;
            wsRef.current?.close();
        };
    }, [connect, enabled]);
}
