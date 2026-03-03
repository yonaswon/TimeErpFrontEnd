import { useState } from "react";
import { X, Package, AlertCircle, CheckCircle, Layers } from "lucide-react";
import api from "@/api";

interface EachArealPiece {
    id: number;
    material: number;
    code: number;
    current_width: string;
    current_height: string;
    started: boolean;
    finished: boolean;
    inventory: number;
}

interface ArealPromptItem {
    bom_id: number;
    material_id: number;
    material_name: string;
    bom_width: string | null;
    bom_height: string | null;
    available_pieces: EachArealPiece[];
}

interface ArealMaterialPromptOverlayProps {
    /** The areal prompt data from the backend */
    arealPromptData: ArealPromptItem[];
    /** API endpoint to submit the selections */
    submitEndpoint: string;
    onClose: () => void;
    onSuccess?: () => void;
}

interface UserSelection {
    bom_id: number;
    each_areal_material_id: number | null;
    width: string;
    height: string;
}

export const ArealMaterialPromptOverlay = ({
    arealPromptData,
    submitEndpoint,
    onClose,
    onSuccess,
}: ArealMaterialPromptOverlayProps) => {
    const [selections, setSelections] = useState<UserSelection[]>(
        arealPromptData.map((item) => ({
            bom_id: item.bom_id,
            each_areal_material_id: null,
            width: item.bom_width || "",
            height: item.bom_height || "",
        }))
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const updateSelection = (
        bomId: number,
        field: keyof UserSelection,
        value: any
    ) => {
        setSelections((prev) =>
            prev.map((s) => (s.bom_id === bomId ? { ...s, [field]: value } : s))
        );
    };

    const getSelectedPiece = (
        bomId: number
    ): EachArealPiece | undefined => {
        const sel = selections.find((s) => s.bom_id === bomId);
        if (!sel || !sel.each_areal_material_id) return undefined;
        const prompt = arealPromptData.find((p) => p.bom_id === bomId);
        return prompt?.available_pieces.find(
            (p) => p.id === sel.each_areal_material_id
        );
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            // Validate all selections
            for (const sel of selections) {
                const prompt = arealPromptData.find((p) => p.bom_id === sel.bom_id);
                if (!sel.each_areal_material_id) {
                    throw new Error(
                        `Please select a sheet for '${prompt?.material_name}'`
                    );
                }
                if (!sel.width || parseFloat(sel.width) <= 0) {
                    throw new Error(
                        `Please enter a valid width for '${prompt?.material_name}'`
                    );
                }
                if (!sel.height || parseFloat(sel.height) <= 0) {
                    throw new Error(
                        `Please enter a valid height for '${prompt?.material_name}'`
                    );
                }

                // Validate against piece dimensions
                const piece = getSelectedPiece(sel.bom_id);
                if (piece) {
                    if (parseFloat(sel.width) > parseFloat(piece.current_width)) {
                        throw new Error(
                            `Width ${sel.width} exceeds available width ${piece.current_width} for '${prompt?.material_name}' (Sheet #${piece.code})`
                        );
                    }
                    if (parseFloat(sel.height) > parseFloat(piece.current_height)) {
                        throw new Error(
                            `Height ${sel.height} exceeds available height ${piece.current_height} for '${prompt?.material_name}' (Sheet #${piece.code})`
                        );
                    }
                }
            }

            await api.post(submitEndpoint, { selections });

            setSuccess(true);
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 1500);
        } catch (err: any) {
            setError(
                err.response?.data?.error ||
                err.message ||
                "Failed to release areal materials"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
                    <div className="flex items-center space-x-3">
                        <Layers className="w-6 h-6 text-purple-600" />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Select Areal Material Sheets
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Choose sheets and enter dimensions for each areal material
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {success ? (
                        <div className="text-center py-8">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Areal Materials Released
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                All areal materials have been released successfully.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-6">
                                {arealPromptData.map((item) => {
                                    const sel = selections.find(
                                        (s) => s.bom_id === item.bom_id
                                    );
                                    const selectedPiece = getSelectedPiece(item.bom_id);

                                    return (
                                        <div
                                            key={item.bom_id}
                                            className="border border-gray-200 dark:border-zinc-700 rounded-xl p-4"
                                        >
                                            {/* Material Header */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <Package className="w-5 h-5 text-purple-500" />
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {item.material_name}
                                                </h3>
                                                {item.bom_width && item.bom_height && (
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        (BOM: {item.bom_width}m × {item.bom_height}m)
                                                    </span>
                                                )}
                                            </div>

                                            {/* Sheet Selection */}
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Select Sheet
                                                </label>
                                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                                    {item.available_pieces.map((piece) => (
                                                        <label
                                                            key={piece.id}
                                                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${sel?.each_areal_material_id === piece.id
                                                                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                                                    : "border-gray-200 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700/50"
                                                                }`}
                                                        >
                                                            <div className="flex items-center space-x-3">
                                                                <input
                                                                    type="radio"
                                                                    name={`piece-${item.bom_id}`}
                                                                    checked={
                                                                        sel?.each_areal_material_id === piece.id
                                                                    }
                                                                    onChange={() =>
                                                                        updateSelection(
                                                                            item.bom_id,
                                                                            "each_areal_material_id",
                                                                            piece.id
                                                                        )
                                                                    }
                                                                    className="text-purple-600 focus:ring-purple-500"
                                                                />
                                                                <div>
                                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                                        Sheet #{piece.code}
                                                                    </span>
                                                                    {piece.started && (
                                                                        <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
                                                                            (In Use)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-sm text-gray-600 dark:text-gray-300">
                                                                <span className="font-medium">
                                                                    {piece.current_width}m
                                                                </span>{" "}
                                                                ×{" "}
                                                                <span className="font-medium">
                                                                    {piece.current_height}m
                                                                </span>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Dimension Inputs */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Width (m)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0.01"
                                                        max={
                                                            selectedPiece
                                                                ? selectedPiece.current_width
                                                                : undefined
                                                        }
                                                        value={sel?.width || ""}
                                                        onChange={(e) =>
                                                            updateSelection(
                                                                item.bom_id,
                                                                "width",
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="0.00"
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                    {selectedPiece && (
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            Max: {selectedPiece.current_width}m
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Height (m)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0.01"
                                                        max={
                                                            selectedPiece
                                                                ? selectedPiece.current_height
                                                                : undefined
                                                        }
                                                        value={sel?.height || ""}
                                                        onChange={(e) =>
                                                            updateSelection(
                                                                item.bom_id,
                                                                "height",
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="0.00"
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                    {selectedPiece && (
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            Max: {selectedPiece.current_height}m
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Error Display */}
                            {error && (
                                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                                        <span className="text-red-700 dark:text-red-300 text-sm">
                                            {error}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={onClose}
                                    disabled={loading}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Releasing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Layers className="w-4 h-4" />
                                            <span>Release Areal Materials</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
