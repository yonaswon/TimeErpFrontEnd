// Tasks/CuttingTasksContent.tsx
import { useState, useEffect } from "react";
import { Play, Grid, List, File, Image } from "lucide-react";
import api from "@/api";
import { CuttingTask, TaskCard, TaskListItem } from "./TaskShared";
import { StartedCutting } from "./StartedCutting";
import { CompletedCutting } from "./CompletedCutting";

type TaskView = "card" | "list";
type TaskFilter = "assigned" | "started" | "completed";

export const CuttingTasksContent = () => {
  const [activeFilter, setActiveFilter] = useState<TaskFilter>("assigned");
  const [viewMode, setViewMode] = useState<TaskView>("card");
  const [tasks, setTasks] = useState<CuttingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeFilter === "assigned") {
      fetchAssignedTasks();
    }
  }, [activeFilter]);

  const fetchAssignedTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const userData = localStorage.getItem("user_data");

      if (!userData) {
        throw new Error("User data not found");
      }

      const user = JSON.parse(userData);
      const userId = user.id;

      const response = await api.get(
        `/api/cuttingfiles/?status=ASSIGNED&assigned_to=${userId}`
      );
      setTasks(response.data.results || []);
    } catch (err: any) {
      setError("Failed to fetch cutting tasks");
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const filters: { id: TaskFilter; label: string }[] = [
    { id: "assigned", label: "Assigned to you" },
    { id: "started", label: "Started" },
    { id: "completed", label: "Completed" },
  ];

  if (loading && activeFilter === "assigned") {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-3">
          Loading cutting tasks...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Horizontal Navigation */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-1">
        <div className="flex space-x-1">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${activeFilter === filter.id
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {activeFilter === "assigned" && "Tasks Assigned to You"}
          {activeFilter === "started" && "Tasks in Progress"}
          {activeFilter === "completed" && "Completed Tasks"}
        </h2>
        <div className="bg-gray-100 dark:bg-zinc-700 rounded-lg p-1 flex">
          <button
            onClick={() => setViewMode("card")}
            className={`p-2 rounded-md transition-colors ${viewMode === "card"
              ? "bg-white dark:bg-zinc-600 text-blue-600 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            title="Card View"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-md transition-colors ${viewMode === "list"
              ? "bg-white dark:bg-zinc-600 text-blue-600 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Content based on filter */}
      {activeFilter === "assigned" && (
        <CuttingAssignedToYou
          tasks={tasks}
          viewMode={viewMode}
          onTaskUpdate={fetchAssignedTasks}
        />
      )}

      {activeFilter === "started" && <StartedCutting viewMode={viewMode} />}

      {activeFilter === "completed" && <CompletedCutting viewMode={viewMode} />}
    </div>
  );
};

// Assigned Tasks Component
const CuttingAssignedToYou = ({
  tasks,
  viewMode,
  onTaskUpdate,
}: {
  tasks: CuttingTask[];
  viewMode: TaskView;
  onTaskUpdate: () => void;
}) => {
  const [startOverlay, setStartOverlay] = useState<{
    isOpen: boolean;
    task: CuttingTask | null;
    cuttingFileId: number | null;
  }>({
    isOpen: false,
    task: null,
    cuttingFileId: null,
  });

  const openStartOverlay = (task: CuttingTask, cuttingFileId: number) => {
    setStartOverlay({
      isOpen: true,
      task,
      cuttingFileId,
    });
  };

  const closeStartOverlay = () => {
    setStartOverlay({
      isOpen: false,
      task: null,
      cuttingFileId: null,
    });
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          No tasks assigned to you
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={viewMode === "card" ? "space-y-4" : "space-y-2"}>
        {tasks.map((task) =>
          viewMode === "card" ? (
            <TaskCard
              key={task.id}
              task={task}
              status="ASSIGNED"
              onAction={openStartOverlay}
            />
          ) : (
            <TaskListItem
              key={task.id}
              task={task}
              status="ASSIGNED"
              onAction={openStartOverlay}
            />
          )
        )}
      </div>

      {/* Start Task Overlay */}
      {startOverlay.isOpen &&
        startOverlay.task &&
        startOverlay.cuttingFileId && (
          <StartTaskOverlay
            task={startOverlay.task}
            cuttingFileId={startOverlay.cuttingFileId}
            onClose={closeStartOverlay}
            onSuccess={() => {
              onTaskUpdate();
              closeStartOverlay();
            }}
          />
        )}
    </>
  );
};

// Start Task Overlay Component
const StartTaskOverlay = ({
  task,
  cuttingFileId,
  onClose,
  onSuccess,
}: {
  task: CuttingTask;
  cuttingFileId: number;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [crv3dFile, setCrv3dFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    // If no files are selected, just start without updating files
    if (!crv3dFile && !imageFile) {
      await startTaskWithoutFiles();
      return;
    }

    // If one file is provided, both are required
    if ((crv3dFile && !imageFile) || (imageFile && !crv3dFile)) {
      setError("Both CRV3D file and image are required if you update files");
      return;
    }

    await startTaskWithFiles();
  };

  const startTaskWithoutFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      // Send empty form data to trigger start without file updates

      const response = await api.post(
        `/api/cuttingfiles/${cuttingFileId}/start/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      onSuccess();
    } catch (err: any) {
      console.error("Error starting task:", err);
      setError("Failed to start task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startTaskWithFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      if (crv3dFile) formData.append("crv3d", crv3dFile);
      if (imageFile) formData.append("image", imageFile);

      const response = await api.post(
        `/api/cuttingfiles/${cuttingFileId}/start/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      onSuccess();
    } catch (err: any) {
      console.error("Error starting task:", err);
      setError("Failed to start task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const mainOrder = task.orders[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center space-x-3">
            <Play className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Start Cutting Task
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Order #{mainOrder.order_code}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upload new files if you made changes. If not, just click "Start
              Task" to begin.
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-4">
              Note: If you upload one file, both CRV3D and image are required.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* File Uploads */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CRV3D File (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg p-4 text-center">
                <File className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <input
                  type="file"
                  accept=".crv3d"
                  onChange={(e) => setCrv3dFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="crv3d-upload"
                />
                <label
                  htmlFor="crv3d-upload"
                  className="cursor-pointer text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {crv3dFile ? crv3dFile.name : "Choose CRV3D file"}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  .crv3d files only
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preview Image (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg p-4 text-center">
                <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {imageFile ? imageFile.name : "Choose preview image"}
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  PNG, JPG, JPEG files
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStart}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Start Task</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
