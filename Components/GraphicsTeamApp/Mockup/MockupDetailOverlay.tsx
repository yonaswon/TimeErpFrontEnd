import { X, Calendar, User, DollarSign, FileText, Image as ImageIcon, Ruler, MessageSquare } from "lucide-react";
import { Mockup, Modification } from "./utils/types";
import { getStatusIcon, getStatusColor } from "./utils/statusUtils";
import ModificationItem from "./ModificationItem";
import { useState, useEffect } from "react";

interface MockupDetailOverlayProps {
    mockup: Mockup;
    modifications: Modification[];
    onClose: () => void;
    onStartMockup: (mockupId: number) => void;
    onStartModification: (modificationId: number) => void;
    onShowSubmitOverlay: (mockup: Mockup) => void;
    onShowSubmitModificationOverlay: (modification: Modification) => void;
    startingModificationId?: number | null;
}

const MockupDetailOverlay = ({
    mockup,
    modifications,
    onClose,
    onStartMockup,
    onStartModification,
    onShowSubmitOverlay,
    onShowSubmitModificationOverlay,
    startingModificationId = null,
}: MockupDetailOverlayProps) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation frame to ensure transition plays
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        // Wait for animation to finish before calling onClose
        setTimeout(onClose, 300);
    };

    return (
        <div className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Overlay Content - Side Sheet with Sidebar Animation */}
            <div
                className={`relative w-full md:w-[600px] lg:w-[700px] h-full bg-white dark:bg-zinc-900 shadow-2xl overflow-y-auto transition-transform duration-300 transform ${isVisible ? "translate-x-0" : "translate-x-full"}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 p-4 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 tracking-wide uppercase">
                                MC-{mockup.id}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${getStatusColor(mockup.request_status)}`}>
                                {mockup.request_status}
                            </span>
                        </div>

                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                            {mockup.lead_name}
                        </h2>
                        <div className="text-lg font-medium text-blue-600 dark:text-blue-400 mt-0.5">
                            {mockup.name || "Untitled Mockup"}
                        </div>

                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <User size={14} />
                            <span>By <span className="font-medium text-gray-900 dark:text-gray-200">{mockup.ordered_by}</span></span>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        <X size={24} className="text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6 space-y-6">

                    {/* Compact Info Rows */}
                    <div className="divide-y divide-gray-100 dark:divide-zinc-800 border-y border-gray-100 dark:border-zinc-800">
                        <div className="py-2 flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                <Calendar size={14} />
                                <span>Requested Date</span>
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">
                                {new Date(mockup.requested_date).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="py-2 flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                <DollarSign size={14} />
                                <span>Price</span>
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">
                                {mockup.price ? `${mockup.price.toLocaleString()} ETB` : "--"}
                            </span>
                        </div>
                        <div className="py-2 flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                <Ruler size={14} />
                                <span>Dimensions</span>
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">
                                {mockup.width && mockup.height ? `${mockup.width}" x ${mockup.height}"` : "--"}
                            </span>
                        </div>
                    </div>

                    {/* Notes - Only show if exists */}
                    {mockup.note && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg p-3">
                            <h3 className="text-xs font-bold text-yellow-800 dark:text-yellow-500 mb-1 flex items-center gap-1.5 uppercase tracking-wide">
                                <MessageSquare size={12} />
                                Notes
                            </h3>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {mockup.note}
                            </p>
                        </div>
                    )}

                    {/* Reference Images */}
                    {mockup.reference_images && mockup.reference_images.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <ImageIcon size={16} />
                                Reference Images
                            </h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {mockup.reference_images.map((img) => (
                                    <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 group cursor-pointer">
                                        <img
                                            src={img.image}
                                            alt="Reference"
                                            className="w-full h-full object-cover"
                                        />
                                        <a
                                            href={img.image}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <span className="text-white text-[10px] font-medium bg-black/50 px-2 py-0.5 rounded">View</span>
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                    {/* ------------------------------------------------------------- */}
                    {/* HISTORY TIMELINE */}
                    {/* ------------------------------------------------------------- */}
                    <div className="pt-4">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider text-gray-400 dark:text-gray-500">Timeline</h3>

                        <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-0 before:w-0.5 before:bg-gray-100 dark:before:bg-zinc-800">
                            {/* Initial Request Node */}
                            <div className="relative pl-10">
                                <div className="absolute left-1 top-1 w-5 h-5 rounded-full bg-white dark:bg-zinc-900 border-2 border-blue-500 flex items-center justify-center z-10">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                </div>
                                <div className="text-sm">
                                    <div className="flex justify-between items-start">
                                        <span className="font-semibold text-gray-900 dark:text-white">Initial Request</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(mockup.requested_date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Created by {mockup.ordered_by}
                                    </p>
                                </div>
                            </div>

                            {/* Return/Result Node (if applicable for initial mockup) */}
                            {mockup.mockup_image && (
                                <div className="relative pl-10">
                                    <div className="absolute left-1 top-3 w-5 h-5 rounded-full bg-white dark:bg-zinc-900 border-2 border-green-500 flex items-center justify-center z-10">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50 rounded-xl p-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-medium text-gray-900 dark:text-white text-sm">Initial Design</span>
                                            {mockup.first_response_date && <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(mockup.first_response_date).toLocaleDateString()}</span>}
                                        </div>
                                        <div className="aspect-video w-full rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-900 relative group">
                                            <img src={mockup.mockup_image} alt="Result" className="w-full h-full object-cover" />
                                            <a
                                                href={mockup.mockup_image}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-full">Open Image</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Modifications Loop */}
                            {modifications.map((mod, index) => (
                                <div className="relative pl-10" key={mod.id}>
                                    <div className="absolute left-1 top-6 w-5 h-5 rounded-full bg-white dark:bg-zinc-900 border-2 border-purple-500 flex items-center justify-center z-10">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                    </div>

                                    {/* Reuse existing Modification Item Logic but ensure we show results */}
                                    <div className="w-full">
                                        <ModificationItem
                                            modification={mod}
                                            isLast={index === modifications.length - 1}
                                            onStartModification={onStartModification}
                                            isStarting={startingModificationId === mod.id}
                                            onShowSubmitModificationOverlay={onShowSubmitModificationOverlay}
                                        />

                                        {/* Show Reference Images if any */}
                                        {mod.reference_images && mod.reference_images.length > 0 && (
                                            <div className="mt-2">
                                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                                    {mod.reference_images.map((img) => (
                                                        <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 group cursor-pointer">
                                                            <img
                                                                src={img.image}
                                                                alt="Ref"
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <a
                                                                href={img.image}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <span className="text-white text-[9px] font-medium bg-black/50 px-1.5 py-0.5 rounded">View</span>
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* EXPLICITLY SHOW MODIFICATION RESULT IMAGE HERE if available */}
                                        {mod.mockup_image && (
                                            <div className="mt-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50 rounded-xl p-3">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-medium text-gray-900 dark:text-white text-xs">Modification Result</span>
                                                    {mod.response_date && <span className="text-[10px] text-gray-500 dark:text-gray-400">{new Date(mod.response_date).toLocaleDateString()}</span>}
                                                </div>
                                                <div className="aspect-video w-full rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-900 relative group">
                                                    <img src={mod.mockup_image} alt="Modification Result" className="w-full h-full object-cover" />
                                                    <a
                                                        href={mod.mockup_image}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-full">Open Image</span>
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default MockupDetailOverlay;
