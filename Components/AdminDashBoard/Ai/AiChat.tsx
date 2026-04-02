'use client';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import api from '../../../api';
import { Bot, Send, User, AlertCircle, Sparkles, X, MessageSquare, Plus, Menu, Brain, Clock, Zap, Search, Database, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
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

const ArealMaterialGallery = ({ data, onImageClick }: { data: any, onImageClick?: (url: string) => void }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    if (!data || !data.cutting_sequence || data.cutting_sequence.length === 0) {
        return <div className="p-4 border border-dashed rounded-lg text-center opacity-70">No cutting files found for this material sheet.</div>;
    }

    const sequence = data.cutting_sequence;
    const currentCut = sequence[currentIndex];

    return (
        <div className="my-6 border rounded-xl overflow-hidden shadow-sm" style={{ borderColor: 'var(--admin-border)', backgroundColor: 'var(--admin-surface)' }}>
            <div className="p-3 border-b flex justify-between items-center" style={{ borderColor: 'var(--admin-border)', backgroundColor: 'var(--admin-background)' }}>
                <div>
                    <h4 className="font-semibold text-sm m-0" style={{ color: 'var(--admin-text)' }}>
                        {data.material_info.material_name} (Code: {data.material_info.code})
                    </h4>
                    <span className="text-xs" style={{ color: 'var(--admin-text-secondary)' }}>
                        {data.material_info.started ? 'Started' : 'New'} • Cut {currentIndex + 1} of {sequence.length}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentIndex === 0}
                        className="p-1 rounded hover:bg-black/5 disabled:opacity-30 transition-colors"
                        style={{ color: 'var(--admin-text)' }}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={() => setCurrentIndex(prev => Math.min(sequence.length - 1, prev + 1))}
                        disabled={currentIndex === sequence.length - 1}
                        className="p-1 rounded hover:bg-black/5 disabled:opacity-30 transition-colors"
                        style={{ color: 'var(--admin-text)' }}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <div className="p-4 flex flex-col items-center justify-center min-h-[300px] bg-black/5">
                {currentCut.image_url ? (
                    <img
                        src={currentCut.image_url}
                        alt="Cutting File"
                        className={`max-h-[500px] object-contain rounded-lg shadow-sm border ${onImageClick ? 'cursor-pointer' : ''}`}
                        onClick={() => onImageClick && onImageClick(currentCut.image_url)}
                        style={{ borderColor: 'var(--admin-border)' }}
                    />
                ) : (
                    <div className="flex items-center justify-center h-48 w-full border border-dashed rounded-lg opacity-50">
                        No image available
                    </div>
                )}
            </div>

            <div className="p-4 border-t text-sm" style={{ borderColor: 'var(--admin-border)' }}>
                <div className="flex justify-between items-start mb-2">
                    <span className="font-medium" style={{ color: 'var(--admin-text)' }}>Orders Cut in this Session:</span>
                    <span className="text-xs" style={{ color: 'var(--admin-text-secondary)' }}>
                        Cut Date: {new Date(currentCut.date).toLocaleDateString()}
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {currentCut.orders_cut && currentCut.orders_cut.length > 0 ? (
                        currentCut.orders_cut.map((ord: string, i: number) => (
                            <span key={i} className="px-2 py-1 text-xs rounded-full border bg-opacity-50 font-medium"
                                style={{ borderColor: 'var(--admin-border)', backgroundColor: 'var(--admin-background)', color: 'var(--admin-text)' }}>
                                {ord}
                            </span>
                        ))
                    ) : (
                        <span className="text-xs italic" style={{ color: 'var(--admin-text-secondary)' }}>No orders linked</span>
                    )}
                </div>
            </div>
        </div>
    );
};

const BatchReportWidget = ({ data }: { data: any }) => {
    if (!data) return null;
    return (
        <div className="my-6 border rounded-xl shadow-sm p-5" style={{ borderColor: 'var(--admin-border)', backgroundColor: 'var(--admin-surface)' }}>
            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                <Database size={20} className="text-blue-500" />
                {data.batch_name || 'Material Batch Report'}
            </h4>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800 -z-10 hidden md:block rounded-full"></div>

                <div className="flex flex-col items-center p-3 bg-white dark:bg-gray-900 border rounded-lg shadow-sm min-w-[140px] z-10">
                    <span className="text-xs uppercase font-bold text-gray-400 mb-1">Source</span>
                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{data.total_acquired}</span>
                    <span className="text-xs text-gray-500 font-medium text-center">{data.source_type || 'Purchased'} Units</span>
                </div>

                <div className="flex flex-col items-center p-3 bg-white dark:bg-gray-900 border rounded-lg shadow-sm min-w-[140px] z-10">
                    <span className="text-xs uppercase font-bold text-gray-400 mb-1">Consumed</span>
                    <span className="text-2xl font-black text-green-600 dark:text-green-400">{data.total_used}</span>
                    <span className="text-xs text-gray-500 font-medium text-center">In Orders</span>
                </div>

                <div className="flex flex-col items-center p-3 bg-white dark:bg-gray-900 border rounded-lg shadow-sm min-w-[140px] z-10 border-red-200 dark:border-red-900">
                    <span className="text-xs uppercase font-bold text-gray-400 mb-1">Waste / Variance</span>
                    <span className={`text-2xl font-black ${data.waste_percent > 15 ? 'text-red-600 dark:text-red-400' : 'text-orange-500'}`}>
                        {data.total_waste}
                    </span>
                    <span className="text-xs font-medium text-center px-2 py-0.5 rounded-full mt-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        {data.waste_percent}% Loss
                    </span>
                </div>
            </div>

            {data.anomaly_flag && (
                <div className="mt-5 p-3 rounded-lg flex items-start gap-3 text-sm bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800/30">
                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                    <div>
                        <strong>Anomaly Detected: </strong>
                        {data.anomaly_reason || 'Waste ratio significantly exceeds historical average'}
                    </div>
                </div>
            )}
        </div>
    );
};

const SurveillanceAlertWidget = ({ data }: { data: any }) => {
    if (!data) return null;

    let severityClass = 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300';
    let Icon = AlertCircle;

    if (data.severity === 'CRITICAL') {
        severityClass = 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
        Icon = Sparkles;
    } else if (data.severity === 'HIGH' || data.severity === 'WARNING' || data.severity === 'warning') {
        severityClass = 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-200';
    } else if (data.severity === 'NORMAL' || data.severity === 'SUCCESS') {
        severityClass = 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200';
    }

    return (
        <div className={`my-4 border rounded-xl shadow-sm p-3 md:p-4 flex flex-col md:flex-row gap-3 md:gap-4 items-start w-full overflow-hidden break-words ${severityClass}`}>
            <div className="p-2 rounded-full bg-white dark:bg-black/20 shadow-sm shrink-0">
                <Icon size={22} className="md:w-6 md:h-6" />
            </div>
            <div className="flex-1 min-w-0 w-full">
                <div className="flex flex-wrap items-center justify-between mb-1 gap-2">
                    <h4 className="font-bold text-xs md:text-sm uppercase tracking-wider opacity-80 truncate">{data.alert_type || 'System Alert'}</h4>
                    <span className="text-[10px] md:text-xs font-bold uppercase py-0.5 px-2 rounded-full bg-white dark:bg-black/20 shadow-sm whitespace-nowrap">{data.severity || 'INFO'}</span>
                </div>
                <h3 className="text-base md:text-lg font-bold mb-1 break-words leading-tight">{data.entity_name}</h3>
                <p className="text-xs md:text-sm font-medium opacity-90 mb-2 break-words leading-snug">{data.metric}</p>
                {data.deviation && (
                    <div className="inline-block mt-1 text-[11px] md:text-xs font-bold italic bg-white dark:bg-black/20 px-2 py-1 rounded shadow-sm break-words max-w-full">
                        {"\u25b2"} Deviation: {data.deviation}
                    </div>
                )}
            </div>
        </div>
    );
};

const SUGGESTION_ITEMS = [
    { icon: '🔎', text: 'Check for duplicate payments' },
    { icon: '📊', text: 'Analyze material usage for recent orders — any anomalies?' },
    { icon: '🚨', text: 'Show me alerts and what needs attention' },
    { icon: '🔍', text: 'Detect payment or purchase price outliers' },
    { icon: '🧠', text: 'What do you remember about our business rules?' },
    { icon: '🚀', text: 'Show lead conversion analytics' },
];

// Extract a balanced JSON object starting from a given position
const extractJsonObject = (text: string, startIdx: number): string | null => {
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = startIdx; i < text.length; i++) {
        const ch = text[i];
        if (escape) { escape = false; continue; }
        if (ch === '\\' && inString) { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '{') depth++;
        if (ch === '}') { depth--; if (depth === 0) return text.substring(startIdx, i + 1); }
    }
    return null;
};

const preprocessWidgetJson = (content: string): string => {
    if (!content) return content;

    // Find all occurrences of {"_widget" that are NOT already inside code fences
    const codeFenceRegex = /```[\s\S]*?```/g;
    const fencedRanges: Array<[number, number]> = [];
    let fenceMatch;
    while ((fenceMatch = codeFenceRegex.exec(content)) !== null) {
        fencedRanges.push([fenceMatch.index, fenceMatch.index + fenceMatch[0].length]);
    }

    const isInsideFence = (idx: number) => fencedRanges.some(([s, e]) => idx >= s && idx < e);

    // Search for raw widget JSON objects
    const widgetPattern = /\{\s*"(?:_widget|frontend_render_type)"\s*:/g;
    let result = content;
    let offset = 0;
    let widgetMatch;

    while ((widgetMatch = widgetPattern.exec(content)) !== null) {
        if (isInsideFence(widgetMatch.index)) continue;

        const jsonStr = extractJsonObject(content, widgetMatch.index);
        if (!jsonStr) continue;

        // Verify it's a valid widget JSON
        try {
            const parsed = JSON.parse(jsonStr);
            if (!parsed._widget && !parsed.frontend_render_type) continue;
        } catch { continue; }

        const before = widgetMatch.index + offset;
        const after = before + jsonStr.length;
        const wrapped = `\n\n\`\`\`json\n${jsonStr}\n\`\`\`\n\n`;
        result = result.substring(0, before) + wrapped + result.substring(after);
        offset += wrapped.length - jsonStr.length;
    }

    return result;
};

// Check if content looks like actual programming code vs plain text
const looksLikeCode = (text: string): boolean => {
    const codeIndicators = /[{};=><\/]|function |const |let |var |import |class |def |return |if\s*\(|for\s*\(|while\s*\(|SELECT |INSERT |UPDATE |CREATE |DROP /;
    return codeIndicators.test(text);
};

const TypewriterMarkdown = React.memo(({ content, isStreaming, onImageClick }: { content: string, isStreaming: boolean, onImageClick?: (url: string) => void }) => {
    const [displayedContent, setDisplayedContent] = useState('');

    useEffect(() => {
        if (!isStreaming) {
            setDisplayedContent(content);
            return;
        }

        if (content.length > displayedContent.length) {
            const diff = content.length - displayedContent.length;

            if (diff > 500) {
                setDisplayedContent(content);
                return;
            }

            const timer = setTimeout(() => {
                setDisplayedContent(prev => {
                    // Type faster if we are far behind, minimum 1 character
                    const charsToAdd = Math.min(diff, Math.max(1, Math.floor(diff / 5)));
                    return content.substring(0, prev.length + charsToAdd);
                });
            }, 16); // ~60fps catchup

            return () => clearTimeout(timer);
        } else if (content.length < displayedContent.length) {
            setDisplayedContent(content);
        }
    }, [content, displayedContent, isStreaming]);

    const processedContent = useMemo(() => preprocessWidgetJson(displayedContent), [displayedContent]);

    return (
        <div className="ai-markdown">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    table: ({ node, ...props }) => <div className="ai-table-wrapper"><table {...props} /></div>,
                    thead: ({ node, ...props }) => <thead {...props} />,
                    th: ({ node, ...props }) => <th {...props} />,
                    td: ({ node, ...props }) => <td {...props} />,
                    tr: ({ node, ...props }) => <tr {...props} />,
                    a: ({ node, ...props }) => <a target="_blank" rel="noopener noreferrer" className="ai-link" {...props} />,
                    code: ({ node, inline, ...props }: any) => {
                        const childStr = String(props.children);
                        const langClass = props.className || '';
                        const match = /language-(\w+)/.exec(langClass);
                        const lang = match ? match[1] : '';

                        // Check for widget JSON — works with or without language-json class
                        const hasWidgetKey = childStr.includes('"_widget"') || childStr.includes('"frontend_render_type"');
                        const isGallery = hasWidgetKey && childStr.includes('AREAL_MATERIAL_GALLERY');
                        const isBatchReport = hasWidgetKey && childStr.includes('BATCH_REPORT');
                        const isSurveillance = hasWidgetKey && childStr.includes('SURVEILLANCE_ALERT');

                        // Try to parse widget JSON with smart extraction
                        if (hasWidgetKey && (isGallery || isBatchReport || isSurveillance)) {
                            // Try to extract just the JSON object from the content
                            const matchObj = /\{\s*"(?:_widget|frontend_render_type)"\s*:/.exec(childStr);
                            const startIdx = matchObj ? matchObj.index : -1;

                            if (startIdx >= 0) {
                                const jsonStr = extractJsonObject(childStr, startIdx);
                                if (jsonStr) {
                                    try {
                                        const data = JSON.parse(jsonStr);
                                        if (isGallery) return <ArealMaterialGallery data={data} onImageClick={onImageClick} />;
                                        if (isBatchReport) return <BatchReportWidget data={data} />;
                                        if (isSurveillance) return <SurveillanceAlertWidget data={data} />;
                                    } catch (e) {
                                        console.error("Failed to parse widget JSON", e);
                                    }
                                }
                            }

                            // Fallback: try parsing the entire string
                            try {
                                const data = JSON.parse(childStr);
                                if (isGallery) return <ArealMaterialGallery data={data} onImageClick={onImageClick} />;
                                if (isBatchReport) return <BatchReportWidget data={data} />;
                                if (isSurveillance) return <SurveillanceAlertWidget data={data} />;
                            } catch (e) {
                                // Widget JSON is unrecoverable — silently hide it
                                console.error("Widget JSON unrecoverable", e);
                                return null;
                            }
                        }

                        if (inline) {
                            return <code className="ai-inline-code" {...props} />;
                        }

                        // If the "language" is generic (code, text, empty) and content is plain text,
                        // render as a styled callout instead of ugly monospace code block
                        const isGenericLang = !lang || lang === 'code' || lang === 'text' || lang === 'plaintext';
                        if (isGenericLang && !looksLikeCode(childStr)) {
                            return (
                                <div className="ai-text-callout">
                                    {childStr.split('\n').map((line: string, i: number) => (
                                        <p key={i} className={line.trim() === '' ? 'my-2' : ''}>{line}</p>
                                    ))}
                                </div>
                            );
                        }

                        return (
                            <div className="ai-code-block">
                                <div className="ai-code-block-header">
                                    <span>{lang || 'code'}</span>
                                </div>
                                <div className="ai-code-block-body">
                                    <code {...props} />
                                </div>
                            </div>
                        );
                    },
                    img: ({ node, ...props }) => {
                        let src = props.src;
                        if (typeof src === 'string' && src.startsWith('/media/')) {
                            const baseURL = api.defaults.baseURL?.replace(/\/+$/, '') || '';
                            src = `${baseURL}${src}`;
                        }
                        return (
                            <span className="block my-4">
                                <img
                                    className="rounded-xl shadow-md cursor-zoom-in hover:opacity-95 transition-opacity max-h-96 object-contain w-full"
                                    loading="lazy"
                                    {...props}
                                    src={src as string}
                                    alt={props.alt || 'AI generated image'}
                                />
                                {props.alt && <span className="block text-center text-xs mt-2" style={{ color: 'var(--admin-text-muted)' }}>{props.alt}</span>}
                            </span>
                        );
                    },
                    ul: ({ node, ...props }) => <ul {...props} />,
                    ol: ({ node, ...props }) => <ol {...props} />,
                    li: ({ node, ...props }) => <li {...props} />,
                    h1: ({ node, ...props }) => <h1 {...props} />,
                    h2: ({ node, ...props }) => <h2 {...props} />,
                    h3: ({ node, ...props }) => <h3 {...props} />,
                    p: ({ node, ...props }) => <p {...props} />,
                    blockquote: ({ node, ...props }) => <blockquote {...props} />,
                    strong: ({ node, ...props }) => <strong {...props} />,
                    em: ({ node, ...props }) => <em {...props} />,
                    hr: ({ node, ...props }) => <hr {...props} />,
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
});

// Memoized message row — prevents re-rendering completed messages when typing
const MessageRow = React.memo(({ msg, idx, isLastMessage, loading }: {
    msg: ChatMessage, idx: number, isLastMessage: boolean, loading: boolean
}) => {
    const isStreamingMessage = isLastMessage && msg.role === 'assistant' && loading;

    return (
        <div key={idx} className="ai-message-row animate-in slide-in-from-bottom-2 duration-300">
            <div className={`ai-message-wrapper ${msg.role}`}>
                <div className="ai-message-avatar">
                    {msg.role === 'assistant' && <Sparkles className="w-5 h-5" />}
                </div>
                <div className="ai-message-bubble">

                    {msg.functionCalls && msg.functionCalls.length > 0 && (
                        <details className="ai-tools-details">
                            <summary className="ai-tools-summary">
                                <Database className="w-3.5 h-3.5" />
                                <span>Used {msg.functionCalls.length} tool{msg.functionCalls.length > 1 ? 's' : ''}</span>
                                <ChevronDown className="w-3.5 h-3.5 ai-tools-chevron" />
                            </summary>
                            <div className="ai-tools-list">
                                {msg.functionCalls.map((fc, fIdx) => (
                                    <div key={fIdx} className="ai-tool-item">
                                        <div className="ai-tool-name">⚙️ {fc.function}</div>
                                        <div className="ai-tool-args">
                                            {typeof fc.args === 'object' ? JSON.stringify(fc.args, null, 2) : fc.args}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </details>
                    )}

                    <div className="break-words ai-message-content">
                        {msg.role === 'user' ? (
                            msg.content
                        ) : (
                            (msg.content === '' && isStreamingMessage) ? (
                                <div className="ai-thinking">
                                    <div className="ai-thinking-dots">
                                        <span style={{ backgroundColor: '#ececec' }}></span>
                                        <span style={{ backgroundColor: '#ececec' }}></span>
                                        <span style={{ backgroundColor: '#ececec' }}></span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <TypewriterMarkdown content={msg.content} isStreaming={isStreamingMessage} />
                                    {isStreamingMessage && (
                                        <span className="inline-block w-3 h-3 ml-2 rounded-full bg-[#ececec] align-middle" style={{ animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></span>
                                    )}
                                </>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default function AiChat({ onBack, onClose }: { onBack?: () => void; onClose?: () => void }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [input, setInput] = useState('');
    const [modelProvider, setModelProvider] = useState('gpt-5');
    const [loading, setLoading] = useState(false);
    const [sessionsLoading, setSessionsLoading] = useState(true);
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
        setSessionsLoading(true);
        try {
            const res = await api.get('/ai-agent/chat-sessions/');
            setSessions(res.data.results || res.data);
        } catch (err) {
            console.error('Failed to fetch sessions', err);
        } finally {
            setSessionsLoading(false);
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

            // Add placeholder assistant message BEFORE fetch so the loading dots appear during TTFB
            const assistantMessageItem: ChatMessage = {
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                functionCalls: [],
            };
            setMessages(prev => [...prev, assistantMessageItem]);

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
            let errorMsg = 'Failed to get response from AI';
            try {
                if (typeof err === 'string') {
                    errorMsg = err;
                } else if (err?.message) {
                    errorMsg = typeof err.message === 'string' ? err.message : JSON.stringify(err.message);
                } else if (err) {
                    errorMsg = JSON.stringify(err);
                }
            } catch (e) {
                // Ignore parse errors on complex objects
            }

            if (typeof errorMsg !== 'string') {
                errorMsg = String(errorMsg);
            }

            if (errorMsg.length > 500) {
                errorMsg = errorMsg.substring(0, 500) + '...';
            }

            setError(errorMsg);

            // Remove the empty placeholder if it failed during TTFB
            setMessages(prev => {
                const msgs = [...prev];
                if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant' && msgs[msgs.length - 1].content === '') {
                    msgs.pop();
                }

                // Add error as assistant message
                const errorMessage: ChatMessage = {
                    role: 'assistant',
                    content: `⚠️ Error: ${errorMsg}`,
                    timestamp: new Date(),
                };
                return [...msgs, errorMessage];
            });
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
        <div className="ai-chat-layout ai-chat-layout-fullscreen">
            {/* Sidebar for chat sessions */}
            <div className={`ai-chat-sidebar
                absolute md:static z-20 h-full border-r transition-transform duration-300
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `} style={{ background: '#171717', borderColor: 'rgba(255,255,255,0.1)' }}>
                <div className="flex justify-between items-center p-3 mb-2">
                    <button onClick={() => setSidebarOpen(false)} className="text-[#ececec] hover:bg-[#2f2f2f] p-2 rounded-md transition-colors md:hidden" title="Close sidebar">
                        <Menu className="w-5 h-5" />
                    </button>
                    <button onClick={startNewChat} className="flex-1 flex items-center justify-between text-[#ececec] hover:bg-[#2f2f2f] py-2 px-3 rounded-lg transition-colors font-medium text-sm" title="New Chat">
                        <div className="flex items-center gap-2">
                            <div className="bg-white text-black rounded-full p-0.5"><Sparkles className="w-3.5 h-3.5" /></div>
                            New chat
                        </div>
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                <div className="overflow-y-auto h-[calc(100%-65px)]">
                    {sessionsLoading ? (
                        <div className="p-4 flex flex-col items-center gap-3">
                            <div className="w-5 h-5 border-2 border-[#b4b4b4] border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs text-[#b4b4b4]">Loading chats...</span>
                        </div>
                    ) : (
                        <>
                            {sessions.map(session => (
                                <div
                                    key={session.id}
                                    onClick={() => loadSession(session)}
                                    className={`px-3 py-2 flex items-center gap-2 cursor-pointer transition-colors rounded-lg mb-1 mx-2`}
                                    style={activeSessionId === session.id
                                        ? { background: '#2f2f2f' }
                                        : { background: 'transparent' }}
                                >
                                    <div className="flex-1 truncate text-sm">
                                        <span className={activeSessionId === session.id ? 'font-medium' : 'font-normal'} style={{ color: '#ececec' }}>
                                            {session.title || 'New Chat'}
                                        </span>
                                        <div className="text-xs mt-1" style={{ color: '#b4b4b4' }}>{new Date(session.created_at || '').toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))}
                            {sessions.length === 0 && (
                                <div className="p-4 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                                    <Clock className="w-5 h-5 text-gray-300" />
                                    No history yet
                                </div>
                            )}
                        </>
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
            <div className="ai-chat-container flex-1 flex flex-col min-w-0" style={{ background: '#212121' }}>
                {/* Header */}
                <div className="px-4 py-3 flex justify-between items-center z-10 ai-chat-header-bg">
                    <div className="flex items-center gap-2 min-w-0">
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden hover:opacity-80 transition-opacity p-2 text-[#b4b4b4] flex-shrink-0">
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-1 cursor-pointer hover:bg-[#2f2f2f] px-2 md:px-3 py-2 rounded-lg transition-colors min-w-0">
                            <span className="text-base md:text-lg font-semibold text-[#ececec] truncate">TimeERP AI</span>
                            <span className="text-base md:text-lg font-semibold text-[#b4b4b4]">v</span>
                            <ChevronDown className="w-4 h-4 text-[#b4b4b4] ml-1 flex-shrink-0" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Mobile close button */}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="md:hidden text-[#ececec] hover:bg-[#2f2f2f] p-2 rounded-lg transition-colors"
                                title="Close AI Chat"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="text-[#ececec] text-sm font-medium hover:bg-[#2f2f2f] px-3 py-1.5 rounded-lg transition-colors border border-[rgba(255,255,255,0.1)]"
                            >
                                Back to Admin
                            </button>
                        )}
                        <select
                            value={modelProvider}
                            onChange={(e) => setModelProvider(e.target.value as any)}
                            className="hidden md:block bg-transparent text-sm border-none focus:ring-0 font-medium cursor-pointer text-[#b4b4b4] hover:text-[#ececec] focus:outline-none"
                            style={{ backgroundImage: 'none', appearance: 'none', WebkitAppearance: 'none' }}
                        >
                            <option value="gpt-5" style={{ background: '#2f2f2f', color: '#ececec' }}>GPT-5.4 (Default)</option>
                            <option value="gpt-5.4-mini" style={{ background: '#2f2f2f', color: '#ececec' }}>GPT-5.4 Mini</option>
                            <option value="gpt-5-reasoning" style={{ background: '#2f2f2f', color: '#ececec' }}>GPT-5 Reasoning (Slow)</option>
                            <option value="o4-mini" style={{ background: '#2f2f2f', color: '#ececec' }}>o4 Mini</option>
                            <option value="o4" style={{ background: '#2f2f2f', color: '#ececec' }}>o4</option>
                            <option value="o3-mini" style={{ background: '#2f2f2f', color: '#ececec' }}>o3-mini</option>
                            <option value="o3" style={{ background: '#2f2f2f', color: '#ececec' }}>o3</option>
                            <option value="anthropic" style={{ background: '#2f2f2f', color: '#ececec' }}>Claude Sonnet 4</option>
                            <option value="gemini" style={{ background: '#2f2f2f', color: '#ececec' }}>Gemini 2.5 Flash</option>
                            <option value="gemini-pro" style={{ background: '#2f2f2f', color: '#ececec' }}>Gemini 2.5 Pro</option>
                        </select>
                    </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto ai-chat-messages-area" ref={chatRef}>
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4 fade-in mt-8 md:mt-16">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white text-black mb-1">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-semibold text-[#ececec] mb-6">What can I help with?</h2>
                            <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-2xl px-4">
                                {SUGGESTION_ITEMS.map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSuggestionClick(suggestion.text)}
                                        className="text-[13px] border border-[rgba(255,255,255,0.1)] bg-[#212121] hover:bg-[#2f2f2f] px-4 py-2 rounded-xl transition-all font-medium flex items-center gap-2 text-[#ececec]"
                                    >
                                        <span className="opacity-70 text-lg">{suggestion.icon}</span>
                                        {suggestion.text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <MessageRow
                                key={idx}
                                msg={msg}
                                idx={idx}
                                isLastMessage={idx === messages.length - 1}
                                loading={loading}
                            />
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="ai-chat-input-area" style={{ background: 'linear-gradient(180deg, transparent, #212121 20%)', paddingTop: '32px' }}>
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
                    {error && (
                        <div className="w-full max-w-[800px] mb-4">
                            <div className="ai-error-msg">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        </div>
                    )}
                    <div className="ai-chat-input-wrapper flex items-end w-full max-w-[800px] bg-[#2f2f2f] rounded-3xl border-none p-3 shadow-none focus-within:shadow-none mx-auto relative">
                        <button className="text-[#b4b4b4] hover:text-[#ececec] p-1 ml-1 mr-2 transition-colors mb-1">
                            <Plus size={24} strokeWidth={2.5} />
                        </button>
                        <textarea
                            ref={textareaRef}
                            className="flex-1 bg-transparent text-[#ececec] placeholder-[#b4b4b4] border-none focus:ring-0 resize-none max-h-[200px] outline-none my-1"
                            placeholder="Message TimeERP AI"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            disabled={loading}
                        />
                        <button
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors mb-0.5 ml-2 ${input.trim() && !loading ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#676767] text-[#2f2f2f]'}`}
                            onClick={() => sendMessage(input)}
                            disabled={!input.trim() || loading}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-5 h-5 ml-0.5"><path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                        </button>
                    </div>
                    <div className="text-xs text-[#b4b4b4] mt-3 text-center w-full pb-2 hidden md:block">
                        TimeERP AI can make mistakes. Check important info.
                    </div>
                </div>

                {/* Image Modal */}
                {
                    imageModal && (
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
                    )
                }
            </div>
        </div >
    );
}


///finalized