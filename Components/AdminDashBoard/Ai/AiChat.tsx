'use client';
import React, { useState, useRef, useEffect } from 'react';
import api from '../../../api';
import { Bot, Send, User, AlertCircle, Sparkles, X, MessageSquare, Plus, Menu, Brain } from 'lucide-react';
import './AiChat.css';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    functionCalls?: Array<{ function: string; args: Record<string, any> }>;
    created_at?: string;
    function_calls?: Array<{ function: string; args: Record<string, any> }>;
}

interface ChatSession {
    id: number;
    title: string;
    created_at: string;
    updated_at: string;
    messages: ChatMessage[];
}

// Simple markdown-to-HTML renderer
function renderMarkdown(text: string): string {
    let html = text;

    // Code blocks (must come before inline code)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) => {
        return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
    });

    // Headers
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Tables
    html = html.replace(
        /^\|(.+)\|\s*\n\|[-\s|:]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm,
        (_match, headerRow, bodyRows) => {
            const headers = headerRow.split('|').map((h: string) => h.trim()).filter(Boolean);
            const rows = bodyRows.trim().split('\n').map((row: string) =>
                row.split('|').map((c: string) => c.trim()).filter(Boolean)
            );
            let table = '<table><thead><tr>';
            headers.forEach((h: string) => { table += `<th>${h}</th>`; });
            table += '</tr></thead><tbody>';
            rows.forEach((row: string[]) => {
                table += '<tr>';
                row.forEach((cell: string) => { table += `<td>${cell}</td>`; });
                table += '</tr>';
            });
            table += '</tbody></table>';
            return table;
        }
    );

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Images — render as clickable images
    html = html.replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img src="$2" alt="$1" title="$1" loading="lazy" />'
    );

    // Links — handle download links with 📥
    html = html.replace(
        /\[([^\]]*)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Unordered lists
    html = html.replace(/^[\s]*[-*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');

    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Cleanup whitespace around block elements to prevent double-spacing
    html = html.replace(/(<\/?(?:h[1-6]|table|thead|tbody|tr|th|td|ul|ol|li|pre|code)>)\s+/gi, '$1');
    html = html.replace(/\s+(<\/?(?:h[1-6]|table|thead|tbody|tr|th|td|ul|ol|li|pre|code)>)/gi, '$1');

    // Compress ANY sequence of newlines into a SINGLE line break for ultra-compact view
    html = html.replace(/\n+/g, '<br/>');

    // Strip accidental leading/trailing breaks
    html = html.replace(/^(?:<br\/>)+|(?:<br\/>)+$/g, '');

    // Wrap in span to avoid default paragraph margins
    if (!html.startsWith('<')) {
        html = `<span>${html}</span>`;
    }

    return html;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

const SUGGESTION_ITEMS = [
    { icon: '🚨', text: 'Show me alerts and what needs attention' },
    { icon: '📊', text: 'Compare this month\'s revenue vs last month' },
    { icon: '📈', text: 'Show the order trend over the last 6 months' },
    { icon: '🏭', text: 'Where are our production bottlenecks?' },
    { icon: '📦', text: 'Which materials will run out soon?' },
    { icon: '💰', text: 'Show financial summary for this month' },
    { icon: '🔍', text: 'Search everything about client ABC' },
    { icon: '🚀', text: 'Show lead conversion analytics' },
];

export default function AiChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [input, setInput] = useState('');
    const [modelProvider, setModelProvider] = useState('gemini');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [imageModal, setImageModal] = useState<string | null>(null);
    const [isDeepThink, setIsDeepThink] = useState(false);
    const [deepThinkState, setDeepThinkState] = useState<'idle' | 'planning' | 'awaiting_approval' | 'executing'>('idle');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    // Fetch sessions on mount
    const fetchSessions = async () => {
        try {
            const res = await api.get('/ai-agent/chat-sessions/');
            setSessions(res.data.results || res.data);
        } catch (err) {
            console.error('Failed to fetch sessions', err);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    // Load a specific session
    const loadSession = (session: ChatSession) => {
        setActiveSessionId(session.id);
        const formattedMessages = (session.messages || []).map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content || '',
            timestamp: new Date(m.created_at || new Date()),
            functionCalls: m.function_calls || []
        }));
        setMessages(formattedMessages);
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    const startNewChat = () => {
        setActiveSessionId(null);
        setMessages([]);
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '44px';
            textareaRef.current.style.height =
                Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    }, [input]);

    // Handle image clicks in messages
    useEffect(() => {
        const handleImageClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'IMG' && target.closest('.ai-message-content')) {
                setImageModal((target as HTMLImageElement).src);
            }
        };
        document.addEventListener('click', handleImageClick);
        return () => document.removeEventListener('click', handleImageClick);
    }, []);

    const sendMessage = async (text: string, overrideDeepThinkMode?: 'plan' | 'execute') => {
        if (!text.trim() || loading) return;

        let currentDeepThinkMode = undefined;
        if (overrideDeepThinkMode) {
            currentDeepThinkMode = overrideDeepThinkMode;
            if (overrideDeepThinkMode === 'execute') setDeepThinkState('executing');
        } else if (isDeepThink) {
            if (deepThinkState === 'idle') {
                currentDeepThinkMode = 'plan';
                setDeepThinkState('planning');
            } else if (deepThinkState === 'awaiting_approval') {
                currentDeepThinkMode = 'execute';
                setDeepThinkState('executing');
            }
        }

        const userMessage: ChatMessage = {
            role: 'user',
            content: text.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        setError('');

        try {
            // Build conversation history for context
            const conversationHistory = messages.map(m => ({
                role: m.role,
                content: m.content,
            }));

            const response = await api.post('/ai-agent/chat/', {
                message: text.trim(),
                conversation_history: conversationHistory,
                model_provider: modelProvider,
                session_id: activeSessionId,
                deep_think_mode: currentDeepThinkMode || undefined
            });

            const newSessionId = response.data.session_id;

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: response.data.response || 'No response received.',
                timestamp: new Date(),
                functionCalls: response.data.function_calls,
            };

            setMessages(prev => [...prev, assistantMessage]);

            if (!activeSessionId && newSessionId) {
                setActiveSessionId(newSessionId);
            }
            // Update session title from AI-generated title
            if (response.data.session_title) {
                setSessions(prev => prev.map(s =>
                    s.id === (newSessionId || activeSessionId)
                        ? { ...s, title: response.data.session_title }
                        : s
                ));
            }
            fetchSessions();

            if (currentDeepThinkMode === 'plan') {
                setDeepThinkState('awaiting_approval');
            } else if (currentDeepThinkMode === 'execute') {
                setDeepThinkState('idle');
            }

        } catch (err: any) {
            const errorMsg = err?.response?.data?.error ||
                err?.message ||
                'Failed to get response from AI';
            setError(errorMsg);

            // Add error as assistant message
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: `⚠️ Error: ${errorMsg}`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    const handleSuggestionClick = (text: string) => {
        sendMessage(text);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="ai-chat-layout">
            {/* Sidebar */}
            <div className={`ai-chat-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="ai-chat-sidebar-header">
                    <button className="ai-new-chat-btn" onClick={startNewChat}>
                        <Plus size={16} />
                        New Chat
                    </button>
                    {window.innerWidth < 768 && (
                        <button className="ai-close-sidebar-btn" onClick={() => setSidebarOpen(false)}>
                            <X size={18} />
                        </button>
                    )}
                </div>
                <div className="ai-chat-session-list">
                    {sessions.map(session => (
                        <div
                            key={session.id}
                            className={`ai-chat-session-item ${activeSessionId === session.id ? 'active' : ''}`}
                            onClick={() => loadSession(session)}
                        >
                            <MessageSquare size={16} className="ai-chat-session-icon" />
                            <div className="ai-chat-session-title">{session.title}</div>
                        </div>
                    ))}
                    {sessions.length === 0 && (
                        <div className="ai-chat-no-sessions">No recent chats</div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="ai-chat-container">
                {/* Header */}
                <div className="ai-chat-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <button className="ai-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            <Menu size={20} />
                        </button>
                        <div className="ai-chat-header-icon">
                            <Bot size={22} />
                        </div>
                        <div className="ai-chat-header-info">
                            <h3>TimeERP AI Assistant</h3>
                            <p>
                                <span className="ai-chat-status-dot" style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} />
                                Ready
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                            className={`ai-deep-think-toggle ${isDeepThink ? 'active' : ''}`}
                            onClick={() => setIsDeepThink(!isDeepThink)}
                            disabled={loading || deepThinkState !== 'idle'}
                            title="Enable DeepThink for complex planning"
                        >
                            <Brain size={16} /> <span>DeepThink</span>
                        </button>
                        <select
                            value={modelProvider}
                            onChange={(e) => setModelProvider(e.target.value)}
                            className="ai-model-selector"
                            disabled={loading}
                        >
                            <option value="gemini">Gemini 2.0 Flash</option>
                            <option value="openai">OpenAI GPT-4o</option>
                            <option value="anthropic">Claude 3.5 Sonnet</option>
                        </select>
                    </div>
                </div>

                {/* Messages */}
                <div className="ai-chat-messages">
                    {messages.length === 0 && !loading ? (
                        <div className="ai-welcome">
                            <div className="ai-welcome-icon">
                                <Sparkles size={28} />
                            </div>
                            <div className="ai-suggestions">
                                <div className="ai-suggestions-title">
                                    What can I help you with?
                                </div>
                                <div className="ai-suggestions-subtitle">
                                    I can analyze orders, finance, stock, leads, production, and more.
                                </div>
                                <div className="ai-suggestions-grid">
                                    {SUGGESTION_ITEMS.map((item, idx) => (
                                        <button
                                            key={idx}
                                            className="ai-suggestion-chip"
                                            onClick={() => handleSuggestionClick(item.text)}
                                        >
                                            <span className="ai-suggestion-chip-icon">{item.icon}</span>
                                            {item.text}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`ai-message-row ${msg.role}`}>
                                    <div className={`ai-message-wrapper ${msg.role}`}>
                                        <div className="ai-message-avatar">
                                            {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div className="ai-message-bubble">
                                                {msg.role === 'assistant' ? (
                                                    <div
                                                        className="ai-message-content"
                                                        dangerouslySetInnerHTML={{
                                                            __html: renderMarkdown(msg.content)
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="ai-message-content">
                                                        {msg.content}
                                                    </div>
                                                )}
                                            </div>
                                            {msg.functionCalls && msg.functionCalls.length > 0 && (
                                                <div className="ai-function-calls">
                                                    {msg.functionCalls.map((fc, fIdx) => (
                                                        <span key={fIdx} className="ai-function-tag">
                                                            ⚡ {fc.function}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="ai-message-row assistant">
                                    <div className="ai-message-wrapper assistant">
                                        <div className="ai-message-avatar">
                                            <Bot size={16} />
                                        </div>
                                        <div className="ai-thinking">
                                            <div className="ai-thinking-dots">
                                                <span />
                                                <span />
                                                <span />
                                            </div>
                                            Analyzing data...
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && !loading && (
                                <div className="ai-error-msg">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}
                        </>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="ai-chat-input-area">
                    {deepThinkState === 'awaiting_approval' && (
                        <div className="ai-deep-think-prompt">
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <AlertCircle size={16} />
                                Review the plan. Modify it below, or approve directly.
                            </span>
                            <button
                                onClick={() => sendMessage("I approve the plan. Please proceed to execute.", "execute")}
                                className="ai-dt-approve-btn"
                            >
                                <Sparkles size={16} /> Approve & Execute
                            </button>
                        </div>
                    )}
                    <div className="ai-chat-input-wrapper">
                        <textarea
                            ref={textareaRef}
                            className="ai-chat-input"
                            placeholder="Ask about orders, finance, stock, leads..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            disabled={loading}
                        />
                        <button
                            className="ai-chat-send-btn"
                            onClick={() => sendMessage(input)}
                            disabled={!input.trim() || loading}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>

                {/* Image Modal */}
                {imageModal && (
                    <div
                        className="ai-image-modal-overlay"
                        onClick={() => setImageModal(null)}
                    >
                        <button
                            onClick={() => setImageModal(null)}
                            style={{
                                position: 'absolute', top: 16, right: 16,
                                background: 'rgba(0,0,0,0.5)', border: 'none',
                                color: '#fff', borderRadius: 8, padding: 8,
                                cursor: 'pointer', display: 'flex'
                            }}
                        >
                            <X size={20} />
                        </button>
                        <img
                            src={imageModal}
                            alt="Full size"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
