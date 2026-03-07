'use client';
import React, { useState, useRef, useEffect } from 'react';
import api from '../../../api';
import { Bot, Send, User, AlertCircle, Sparkles, X, MessageSquare, Plus, Menu, Brain, Clock, Zap, Search, Database } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
    const chatRef = useRef<HTMLDivElement>(null);

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

        let isCurrentlyStreaming = false;

        try {
            // Build conversation history for context
            const conversationHistory = messages.map(m => ({
                role: m.role,
                content: m.content,
            }));

            // Use fetch for streaming response
            const token = localStorage.getItem("access_token");
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `JWT ${token}`;
            }

            const baseURL = api.defaults.baseURL || '';
            const response = await fetch(`${baseURL}/ai-agent/chat/`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    message: text.trim(),
                    conversation_history: conversationHistory,
                    model_provider: modelProvider,
                    session_id: activeSessionId,
                    deep_think_mode: currentDeepThinkMode || undefined
                })
            });

            if (!response.ok) {
                let errData;
                try { errData = await response.json(); } catch (e) { }
                throw new Error((errData && errData.error) || 'Failed to get response');
            }

            // Create placeholder assistant message
            const assistantMessageItem: ChatMessage = {
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                functionCalls: [],
            };
            setMessages(prev => [...prev, assistantMessageItem]);

            const reader = response.body?.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = '';

            let currentSessionId = activeSessionId;
            let finalSessionTitle = '';

            isCurrentlyStreaming = true;

            if (reader) {
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const parts = buffer.split('\n\n');
                    buffer = parts.pop() || '';

                    for (const part of parts) {
                        if (part.startsWith('data: ')) {
                            const dataStr = part.slice(6);
                            if (dataStr === '[DONE]') break;
                            try {
                                const data = JSON.parse(dataStr);

                                if (data.type === 'session_info') {
                                    currentSessionId = data.session_id;
                                    finalSessionTitle = data.session_title;
                                    if (!activeSessionId) setActiveSessionId(currentSessionId);
                                } else if (data.type === 'message') {
                                    setMessages(prev => {
                                        const newMsgs = [...prev];
                                        const last = { ...newMsgs[newMsgs.length - 1] };
                                        last.content = last.content + data.content;
                                        newMsgs[newMsgs.length - 1] = last;
                                        return newMsgs;
                                    });
                                } else if (data.type === 'tool_call') {
                                    setMessages(prev => {
                                        const newMsgs = [...prev];
                                        const last = { ...newMsgs[newMsgs.length - 1] };
                                        last.functionCalls = [...(last.functionCalls || []), { function: data.function, args: data.args }];
                                        newMsgs[newMsgs.length - 1] = last;
                                        return newMsgs;
                                    });
                                } else if (data.type === 'error') {
                                    setError(data.content);
                                }
                            } catch (e) {
                                console.error('Parse error', e, dataStr);
                            }
                        }
                    }
                }
                isCurrentlyStreaming = false;
            }

            if (finalSessionTitle) {
                setSessions(prev => prev.map(s =>
                    s.id === currentSessionId
                        ? { ...s, title: finalSessionTitle }
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
            const errorMsg = err?.message || 'Failed to get response from AI';

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
        <div className="flex h-[calc(100vh-100px)] bg-gray-50/50">
            {/* Sidebar for chat sessions */}
            <div className={`
                absolute md:static z-20 h-full w-64 bg-white border-r shadow-sm transition-transform duration-300
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="font-semibold text-gray-700">Chat History</h2>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                    <button
                        onClick={startNewChat}
                        className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-full transition-colors"
                        title="New Chat"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto h-[calc(100%-65px)]">
                    {sessions.map(session => (
                        <div
                            key={session.id}
                            onClick={() => loadSession(session)}
                            className={`
                                p-3 flex items-center gap-3 cursor-pointer border-b hover:bg-gray-50 transition-colors
                                ${activeSessionId === session.id ? 'bg-indigo-50/50 border-l-2 border-l-indigo-600' : ''}
                            `}
                        >
                            <MessageSquare className={`w-4 h-4 ${activeSessionId === session.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                            <div className="flex-1 truncate text-sm">
                                <span className={activeSessionId === session.id ? 'text-indigo-900 font-medium' : 'text-gray-600'}>
                                    {session.title || 'New Chat'}
                                </span>
                                <div className="text-xs text-gray-400">{new Date(session.created_at || '').toLocaleDateString()}</div>
                            </div>
                        </div>
                    ))}
                    {sessions.length === 0 && (
                        <div className="p-4 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-300" />
                            No history yet
                        </div>
                    )}
                </div>
            </div>

            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/20 z-10"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main chat area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white shadow-sm rounded-lg overflow-hidden m-4">
                {/* Header */}
                <div className="px-6 py-4 border-b bg-white flex justify-between items-center shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-500 hover:text-gray-700">
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-lg shadow-sm">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-800 tracking-tight">TimeERP Business Brain</h1>
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Agent Active
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50/80 p-1.5 rounded-lg border">
                        <Zap className={`w-4 h-4 ${modelProvider === 'gemini' ? 'text-blue-500' : 'text-gray-400'}`} />
                        <select
                            value={modelProvider}
                            onChange={(e) => setModelProvider(e.target.value as any)}
                            className="bg-transparent text-sm border-none focus:ring-0 text-gray-700 font-medium cursor-pointer"
                        >
                            <option value="gemini">Gemini 2.0 Flash</option>
                            <option value="openai">GPT-4o</option>
                            <option value="anthropic">Claude 3.5</option>
                        </select>
                    </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6" ref={chatRef}>
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 fade-in">
                            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-full flex items-center justify-center shadow-sm">
                                <Search className="w-8 h-8 text-indigo-400" />
                            </div>
                            <p className="text-lg font-medium text-gray-500">How can I help you analyze today?</p>
                            <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-xl">
                                {SUGGESTION_ITEMS.map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSuggestionClick(suggestion.text)}
                                        className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all font-medium flex items-center gap-1.5 shadow-sm"
                                    >
                                        <span>{suggestion.icon}</span>
                                        {suggestion.text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isLastMessage = idx === messages.length - 1;
                            const isStreamingMessage = isLastMessage && msg.role === 'assistant' && loading;

                            return (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                                >
                                    <div
                                        className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm relative ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-sm'
                                            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm ring-1 ring-black/5'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            {msg.role === 'user' ? (
                                                <User className="w-4 h-4 text-indigo-200" />
                                            ) : (
                                                <Bot className="w-4 h-4 text-indigo-500" />
                                            )}
                                            <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
                                                {msg.role === 'user' ? 'You' : 'AI Agent'}
                                            </span>
                                        </div>

                                        {msg.functionCalls && msg.functionCalls.length > 0 && (
                                            <div className="mb-3">
                                                {msg.functionCalls.map((fc, fIdx) => (
                                                    <div key={fIdx} className="mb-2 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 font-mono flex flex-col gap-1.5 shadow-inner">
                                                        <div className="flex items-center gap-2 text-indigo-700 font-bold border-b border-slate-200 pb-1.5">
                                                            <Database className="w-3.5 h-3.5" />
                                                            ⚙️ Executing: {fc.function}
                                                        </div>
                                                        <div className="pl-1 text-slate-500 overflow-x-auto whitespace-pre-wrap">
                                                            {typeof fc.args === 'object' ? JSON.stringify(fc.args, null, 2) : fc.args}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="text-sm md:text-base leading-relaxed break-words ai-message-content" style={msg.role === 'user' ? {} : { color: '#374151' }}>
                                            {msg.role === 'user' ? (
                                                msg.content
                                            ) : (
                                                <>
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            table: ({ node, ...props }) => <div className="overflow-x-auto my-4 rounded-xl border border-gray-200 shadow-sm"><table className="min-w-full divide-y divide-gray-200" {...props} /></div>,
                                                            thead: ({ node, ...props }) => <thead className="bg-gray-50" {...props} />,
                                                            th: ({ node, ...props }) => <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50" {...props} />,
                                                            td: ({ node, ...props }) => <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 border-t border-gray-100" {...props} />,
                                                            a: ({ node, ...props }) => <a className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium inline-flex items-center gap-1" target="_blank" rel="noopener noreferrer" {...props} />,
                                                            code: ({ node, inline, ...props }: any) =>
                                                                inline ? (
                                                                    <code className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-sm font-mono border border-indigo-100" {...props} />
                                                                ) : (
                                                                    <div className="my-4 rounded-xl overflow-hidden border shadow-sm">
                                                                        <div className="flex justify-between items-center bg-slate-800 px-4 py-2 text-xs text-slate-400 font-mono">
                                                                            <span>{props.className?.replace('language-', '') || 'code'}</span>
                                                                        </div>
                                                                        <div className="bg-slate-900 p-4 overflow-x-auto">
                                                                            <code className="text-sm font-mono text-slate-50" {...props} />
                                                                        </div>
                                                                    </div>
                                                                ),
                                                            img: ({ node, ...props }) => {
                                                                let src = props.src;
                                                                if (typeof src === 'string' && src.startsWith('/media/')) {
                                                                    const baseURL = api.defaults.baseURL?.replace(/\/+$/, '') || '';
                                                                    src = `${baseURL}${src}`;
                                                                }
                                                                return (
                                                                    <span className="block my-4">
                                                                        <img
                                                                            className="rounded-xl shadow-md cursor-zoom-in hover:opacity-95 transition-opacity max-h-96 object-contain bg-gray-50 w-full"
                                                                            loading="lazy"
                                                                            {...props}
                                                                            src={src as string}
                                                                            alt={props.alt || 'AI generated image'}
                                                                        />
                                                                        {props.alt && <span className="block text-center text-xs text-gray-500 mt-2 font-medium">{props.alt}</span>}
                                                                    </span>
                                                                );
                                                            },
                                                            ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
                                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
                                                            li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                            h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-3 text-gray-900" {...props} />,
                                                            h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-2 text-gray-900 flex items-center gap-2" {...props} />,
                                                            h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-4 mb-2 text-gray-800" {...props} />,
                                                            p: ({ node, ...props }) => <p className="my-2" {...props} />,
                                                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-indigo-300 bg-indigo-50/50 pl-4 py-2 italic my-3 rounded-r-lg" {...props} />,
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                    {isStreamingMessage && (
                                                        <span className="inline-block w-2 h-4 ml-1 bg-indigo-500 animate-pulse align-middle" style={{ animationDuration: '0.8s' }}></span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
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


///finalized