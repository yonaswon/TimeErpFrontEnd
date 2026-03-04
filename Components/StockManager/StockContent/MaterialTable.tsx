import { Material } from "./types";

interface MaterialTableProps {
    materials: Material[];
    onClick: (material: Material) => void;
}

export const MaterialTable = ({ materials, onClick }: MaterialTableProps) => {
    const getLocationCount = (material: Material) => {
        const dist = material.stats?.inventory_distribution;
        if (!dist) return 0;
        if (Array.isArray(dist)) return dist.length;
        return Object.keys(dist).length;
    };

    const getStockKeeperAmount = (material: Material) => {
        const dist = material.stats?.inventory_distribution;
        if (!dist) return "—";
        if (Array.isArray(dist)) {
            const sk = dist.find((d: any) => d.inventory__name?.toLowerCase().includes("stock"));
            return sk ? sk.unstarted : "—";
        }
        // Object format (L/P materials)
        for (const [name, qty] of Object.entries(dist)) {
            if (name.toLowerCase().includes("stock")) return qty as number;
        }
        return "—";
    };

    const getStarted = (material: Material) => {
        if (material.type !== "A") return null;
        return material.stats?.started_pieces ?? 0;
    };

    const getFinished = (material: Material) => {
        if (material.type !== "A") return null;
        return material.stats?.finished_pieces ?? 0;
    };

    const isLowStock = (material: Material) => {
        return parseFloat(material.available) < material.min_threshold;
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-zinc-700">
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Material
                        </th>
                        <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                            Available
                        </th>
                        <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                            Stock Keeper
                        </th>
                        <th className="text-right py-2.5 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                            Started
                        </th>
                        <th className="text-right py-2.5 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                            Finished
                        </th>
                        <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Locations
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
                    {materials.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                No materials found.
                            </td>
                        </tr>
                    ) : (
                        materials.map((material) => (
                            <tr
                                key={material.id}
                                onClick={() => onClick(material)}
                                className="hover:bg-gray-50 dark:hover:bg-zinc-700/30 cursor-pointer transition-colors"
                            >
                                {/* Material Name */}
                                <td className="py-2.5 px-3">
                                    <div className="font-medium text-gray-900 dark:text-white text-sm leading-tight">
                                        {material.name}
                                    </div>
                                </td>

                                {/* Available */}
                                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                    <span className={`font-medium tabular-nums text-sm ${isLowStock(material) ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>
                                        {material.available}
                                    </span>
                                    {isLowStock(material) && (
                                        <span className="ml-1 text-[10px] text-red-500 dark:text-red-400 font-semibold">
                                            LOW
                                        </span>
                                    )}
                                </td>

                                {/* Stock Keeper */}
                                <td className="py-2.5 px-3 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                                    {getStockKeeperAmount(material)}
                                </td>

                                {/* Started (Areal only) */}
                                <td className="py-2.5 px-2 text-right hidden sm:table-cell">
                                    {material.type === "A" ? (
                                        <span className="text-orange-600 dark:text-orange-400 tabular-nums">
                                            {getStarted(material)}
                                        </span>
                                    ) : (
                                        <span className="text-gray-300 dark:text-gray-600">—</span>
                                    )}
                                </td>

                                {/* Finished (Areal only) */}
                                <td className="py-2.5 px-2 text-right hidden sm:table-cell">
                                    {material.type === "A" ? (
                                        <span className="text-gray-600 dark:text-gray-400 tabular-nums">
                                            {getFinished(material)}
                                        </span>
                                    ) : (
                                        <span className="text-gray-300 dark:text-gray-600">—</span>
                                    )}
                                </td>

                                {/* Locations */}
                                <td className="py-2.5 px-3 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                                    {getLocationCount(material)}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};
