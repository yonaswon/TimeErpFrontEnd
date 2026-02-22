import { useEffect, useRef, useState, useCallback } from 'react';
import { base_url } from '@/api';

interface UseChatSocketProps {
    mockupId?: number;
    mockupModificationId?: number;
    onMessageReceived: (message: any) => void;
}

export function useChatSocket({ mockupId, mockupModificationId, onMessageReceived }: UseChatSocketProps) {
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        if (!mockupId && !mockupModificationId) return;

        // Convert base_url (http:// or https://) to ws:// or wss://
        const wsBaseUrl = base_url.replace(/^http/, 'ws');

        const endpoint = mockupId
            ? `/ws/chat/mockup/${mockupId}/`
            : `/ws/chat/modification/${mockupModificationId}/`;

        if (wsRef.current) {
            wsRef.current.close();
        }

        console.log(`Setting up WebSocket connection to ${wsBaseUrl}${endpoint}`);
        const ws = new WebSocket(`${wsBaseUrl}${endpoint}`);

        ws.onopen = () => {
            console.log('Chat WebSocket Connected');
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.message) {
                    onMessageReceived(data.message);
                }
            } catch (e) {
                console.error('Error parsing WebSocket message:', e);
            }
        };

        ws.onclose = () => {
            console.log('Chat WebSocket Disconnected. Attempting to reconnect in 3s...');
            setIsConnected(false);

            // Auto reconnect
            reconnectTimeoutRef.current = setTimeout(() => {
                connect();
            }, 3000);
        };

        ws.onerror = (error) => {
            console.warn('Chat WebSocket Error encountered (transient).');
            ws.close();
        };

        wsRef.current = ws;
    }, [mockupId, mockupModificationId, onMessageReceived]);

    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                // Clear onclose handler before closing to prevent auto-reconnect infinite loop during unmount
                wsRef.current.onclose = null;
                wsRef.current.close();
            }
        };
    }, [connect]);

    return { isConnected };
}
