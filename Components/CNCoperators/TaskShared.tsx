import { Download, Play, CheckCircle, Clock } from "lucide-react";

export interface CuttingTask {
    id: number;
    orders: {
        order_code: number;
        boms: Array<{
            id: number;
            amount: string;
            width: string;
            height: string;
            price_per_unit: string;
            total_price: string;
            estimated_price: string;
            date: string;
            material: number;
        }>;
        mockup: {
            id: number;
            reference_images: Array<{
                id: number;
                image: string;
                date: string;
            }>;
            mockup_image: string;
            width: string;
            design_type: number;
            request_status: string;
        };
        cutting_files: Array<{
            id: number;
            crv3d: string;
            image: string;
            status: string;
            schedule_start_date: string;
            schedule_complate_date: string;
            start_date: string | null;
            complate_date: string | null;
            date: string;
        }>;
        order_status: string;
        price: number;
        design_type: number;
    }[];
    on: {
        material_name: string;
        current_width: string;
        current_height: string;
        code: number;
    };
    assigned_to: {
        id: number;
        telegram_user_name: string;
    };
}

export const downloadFile = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleString();
};

export const calculateOffsetTime = (startDate: string | null, completeDate: string | null) => {
    if (!startDate || !completeDate) return 'N/A';

    const start = new Date(startDate);
    const complete = new Date(completeDate);
    const diffMs = complete.getTime() - start.getTime();

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};

export const calculateScheduleOffset = (scheduledDate: string, actualDate: string | null) => {
    if (!actualDate) return 'N/A';

    const scheduled = new Date(scheduledDate);
    const actual = new Date(actualDate);
    const diffMs = actual.getTime() - scheduled.getTime();

    const hours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
    const minutes = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60)) / (1000 * 60));

    const isEarly = diffMs < 0;
    const sign = isEarly ? '-' : '+';

    if (hours > 0) {
        return `${sign}${hours}h ${minutes}m`;
    }
    return `${sign}${minutes}m`;
};


interface TaskCardProps {
    task: CuttingTask;
    status: 'ASSIGNED' | 'STARTED' | 'COMPLATED';
    onAction?: (task: CuttingTask, cuttingFileId: number) => void;
    isProcessing?: boolean;
}

export const TaskCard = ({ task, status, onAction, isProcessing = false }: TaskCardProps) => {
    const mainOrder = task.orders[0];
    const cuttingFile = mainOrder.cutting_files[0];

    const actualDuration = status === 'COMPLATED' ? calculateOffsetTime(cuttingFile.start_date, cuttingFile.complate_date) : null;
    const scheduleOffset = status === 'COMPLATED' ? calculateScheduleOffset(cuttingFile.schedule_complate_date, cuttingFile.complate_date) : null;


    return (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-4 shadow-sm">
            {/* Header with Download */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        CUT-{cuttingFile.id}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Material: {task.on ? `${task.on.material_name}-${task.on.code}` : 'Unknown'}
                    </p>
                    {status === 'STARTED' && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Started: {formatDateTime(cuttingFile.start_date)}
                        </p>
                    )}
                    {status === 'COMPLATED' && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Completed: {formatDateTime(cuttingFile.complate_date)}
                        </p>
                    )}
                </div>
                <button
                    onClick={() =>
                        downloadFile(
                            cuttingFile.crv3d,
                            `cutting-file-${cuttingFile.id}.crv3d`
                        )
                    }
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Download CRV3D file"
                >
                    <Download className="w-4 h-4" />
                </button>
            </div>

            {/* Task Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        {status === 'COMPLATED' ? 'Timeline' : 'Schedule'}
                    </h4>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Start:</span>
                            <span className="text-gray-900 dark:text-white">
                                {formatDateTime(cuttingFile.schedule_start_date)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                                Complete:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                                {formatDateTime(cuttingFile.schedule_complate_date)}
                            </span>
                        </div>
                        {status !== 'ASSIGNED' && (
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Actual Start:
                                </span>
                                <span className="text-blue-600 dark:text-blue-400">
                                    {formatDateTime(cuttingFile.start_date)}
                                </span>
                            </div>
                        )}
                        {status === 'COMPLATED' && (
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">
                                    Actual Complete:
                                </span>
                                <span className="text-green-600 dark:text-green-400">
                                    {formatDateTime(cuttingFile.complate_date)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        {status === 'COMPLATED' ? 'Performance' : 'Material Details'}
                    </h4>
                    <div className="space-y-1 text-sm">
                        {status === 'COMPLATED' && (
                            <>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">Actual Duration:</span>
                                    <div className="flex items-center space-x-1">
                                        <Clock className="w-3 h-3 text-blue-600" />
                                        <span className="text-blue-600 dark:text-blue-400 font-medium">{actualDuration}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">Schedule Offset:</span>
                                    <span className={`font-medium ${scheduleOffset?.startsWith('-')
                                            ? 'text-green-600 dark:text-green-400'
                                            : scheduleOffset?.startsWith('+')
                                                ? 'text-yellow-600 dark:text-yellow-400'
                                                : 'text-gray-600 dark:text-gray-400'
                                        }`}>
                                        {scheduleOffset}
                                    </span>
                                </div>
                            </>
                        )}

                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Size:</span>
                            <span className="text-gray-900 dark:text-white">
                                {task.on ? `${task.on.current_width}m x ${task.on.current_height}m` : 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Price:</span>
                            <span className="text-gray-900 dark:text-white">
                                ${mainOrder.price}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Badges */}
            {status === 'STARTED' && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-700 dark:text-blue-300 font-medium">
                            Status: In Progress
                        </span>
                        <span className="text-blue-600 dark:text-blue-400">
                            Started {formatDateTime(cuttingFile.start_date)}
                        </span>
                    </div>
                </div>
            )}
            {status === 'COMPLATED' && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-green-700 dark:text-green-300 font-medium">Completed</span>
                        </div>
                        <span className="text-green-600 dark:text-green-400">
                            {formatDateTime(cuttingFile.complate_date)}
                        </span>
                    </div>
                </div>
            )}


            {/* Mockup Image Preview */}
            {mainOrder?.mockup?.mockup_image && (
                <div className="mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Design Preview
                    </h4>
                    <img
                        src={mainOrder.mockup.mockup_image}
                        alt="Design mockup"
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-zinc-600"
                    />
                </div>
            )}

            {/* Action Button */}
            {onAction && (
                <button
                    onClick={() => onAction(task, cuttingFile.id)}
                    disabled={isProcessing}
                    className={`w-full flex items-center justify-center space-x-2 py-2 text-white rounded-lg transition-colors ${status === 'ASSIGNED' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                        } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                >
                    {isProcessing ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            {status === 'ASSIGNED' ? <Play className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            <span>{status === 'ASSIGNED' ? 'Start Task' : 'Complete Task'}</span>
                        </>
                    )}
                </button>
            )}
        </div>
    );
};

interface TaskListItemProps {
    task: CuttingTask;
    status: 'ASSIGNED' | 'STARTED' | 'COMPLATED';
    onAction?: (task: CuttingTask, cuttingFileId: number) => void;
    isProcessing?: boolean;
}

export const TaskListItem = ({ task, status, onAction, isProcessing = false }: TaskListItemProps) => {
    const mainOrder = task.orders[0];
    const cuttingFile = mainOrder.cutting_files[0];

    const actualDuration = status === 'COMPLATED' ? calculateOffsetTime(cuttingFile.start_date, cuttingFile.complate_date) : null;
    const scheduleOffset = status === 'COMPLATED' ? calculateScheduleOffset(cuttingFile.schedule_complate_date, cuttingFile.complate_date) : null;

    return (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-3 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                        <span className="font-medium text-gray-900 dark:text-white text-sm">
                            CUT-{cuttingFile.id}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs">
                            {task.on ? `${task.on.material_name}-${task.on.code}` : 'Unknown'}
                        </span>
                        {status === 'STARTED' && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs">
                                In Progress
                            </span>
                        )}
                        {status === 'COMPLATED' && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs">
                                Completed
                            </span>
                        )}

                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400 overflow-x-auto scrollbar-thin pb-1">
                        {status === 'COMPLATED' ? (
                            <>
                                <div className="flex items-center space-x-1 shrink-0">
                                    <Clock className="w-3 h-3 text-blue-600" />
                                    <span>Duration: {actualDuration}</span>
                                </div>
                                <span className={`shrink-0 ${scheduleOffset?.startsWith('-')
                                        ? 'text-green-600 dark:text-green-400'
                                        : scheduleOffset?.startsWith('+')
                                            ? 'text-yellow-600 dark:text-yellow-400'
                                            : 'text-gray-600 dark:text-gray-400'
                                    }`}>
                                    Offset: {scheduleOffset}
                                </span>
                            </>
                        ) : (
                            <>
                                <span>
                                    Start:{" "}
                                    {formatDateTime(cuttingFile.schedule_start_date)}
                                </span>
                                <span>
                                    Complete:{" "}
                                    {formatDateTime(cuttingFile.schedule_complate_date)}
                                </span>
                            </>
                        )}

                        <span className="shrink-0">
                            Size: {task.on ? `${task.on.current_width}m x ${task.on.current_height}m` : 'N/A'}
                        </span>
                        <span className="shrink-0">Price: ${mainOrder.price}</span>
                    </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                    {onAction && (
                        <button
                            onClick={() => onAction(task, cuttingFile.id)}
                            disabled={isProcessing}
                            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                            {isProcessing ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            ) : (
                                status === 'ASSIGNED' ? <Play className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />
                            )}
                            <span>{status === 'ASSIGNED' ? 'Start' : 'Complete'}</span>
                        </button>
                    )}
                    {!onAction && status === 'COMPLATED' && (
                        <button
                            onClick={() => downloadFile(cuttingFile.crv3d, `cutting-file-${cuttingFile.id}.crv3d`)}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="Download CRV3D file"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
