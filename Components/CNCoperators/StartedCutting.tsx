// Tasks/StartedCutting.tsx
import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import api from "@/api";
import { CuttingTask, TaskCard, TaskListItem } from "./TaskShared";

type TaskView = "card" | "list";

export const StartedCutting = ({ viewMode }: { viewMode: TaskView }) => {
  const [tasks, setTasks] = useState<CuttingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [completingTask, setCompletingTask] = useState<number | null>(null);

  useEffect(() => {
    fetchStartedTasks();
  }, [currentPage]);

  const fetchStartedTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user data from localStorage
      const userData = localStorage.getItem("user_data");
      if (!userData) {
        throw new Error("User data not found");
      }

      const user = JSON.parse(userData);
      const userId = user.id;

      const response = await api.get(
        `/api/cuttingfiles/?status=STARTED&assigned_to=${userId}&page=${currentPage}`
      );
      setTasks(response.data.results || []);
      setTotalPages(Math.ceil(response.data.count / 10));
    } catch (err: any) {
      setError("Failed to fetch started tasks");
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (task: CuttingTask, cuttingFileId: number) => {
    try {
      setCompletingTask(cuttingFileId);
      setError(null);

      await api.post(`/api/cuttingfiles/${cuttingFileId}/complete/`);

      // Refresh the task list
      fetchStartedTasks();
    } catch (err: any) {
      console.error("Error completing task:", err);
      setError("Failed to complete task. Please try again.");
    } finally {
      setCompletingTask(null);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-3">
          Loading started tasks...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">



      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No tasks in progress
          </p>
        </div>
      ) : (
        <div className={viewMode === "card" ? "space-y-4" : "space-y-2"}>
          {tasks.map((task) =>
            viewMode === "card" ? (
              <TaskCard
                key={task.id}
                task={task}
                status="STARTED"
                onAction={handleComplete}
                isProcessing={
                  completingTask === task.id
                }
              />
            ) : (
              <TaskListItem
                key={task.id}
                task={task}
                status="STARTED"
                onAction={handleComplete}
                isProcessing={
                  completingTask === task.id
                }
              />
            )
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded-lg text-sm ${currentPage === page
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-zinc-700 dark:text-gray-300"
                }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
