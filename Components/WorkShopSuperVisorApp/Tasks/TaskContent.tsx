// TasksContent.tsx
import { useState } from "react";
import { Scissors, Wrench, Truck, Clock, Settings } from "lucide-react";
import { AssignCuttingOverlay } from "./AssignCutting/AssignCuttingOverlay";
import { LatestAssigned } from "./LatestAssigned";
import { AssignAssemblyOverlay } from "./AssignAssembly/AssignAssemblyOverlay";
import { DandIOverlay } from "./AssignDandI/DandIOverlay";
import { AssignMaintenanceOverlay } from "./AssignMaintenanceOverlay";

export const TasksContent = () => {
  const [activeOverlay, setActiveOverlay] = useState<
    "cutting" | "assembly" | "delivery" | "maintenance" | null
  >(null);

  return (
    <div className="space-y-6">
      {/* Assignment Buttons */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Assign Tasks
        </h2>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => setActiveOverlay("cutting")}
            className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <Scissors className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div className="text-left">
              <div className="font-medium text-blue-600 dark:text-blue-400">
                Assign Cutting
              </div>
              <div className="text-sm text-blue-500 dark:text-blue-300">
                Assign CNC cutting tasks to operators
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveOverlay("assembly")}
            className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <Wrench className="w-6 h-6 text-green-600 dark:text-green-400" />
            <div className="text-left">
              <div className="font-medium text-green-600 dark:text-green-400">
                Assign Assembly
              </div>
              <div className="text-sm text-green-500 dark:text-green-300">
                Assign assembly tasks to team members
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveOverlay("delivery")}
            className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <Truck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <div className="text-left">
              <div className="font-medium text-purple-600 dark:text-purple-400">
                Assign Delivery & Installation
              </div>
              <div className="text-sm text-purple-500 dark:text-purple-300">
                Schedule delivery and installation tasks
              </div>
            </div>
          </button>

          {/* New Maintenance Button */}
          <button
            onClick={() => setActiveOverlay("maintenance")}
            className="flex items-center space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
          >
            <Settings className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            <div className="text-left">
              <div className="font-medium text-orange-600 dark:text-orange-400">
                Maintenance
              </div>
              <div className="text-sm text-orange-500 dark:text-orange-300">
                Assign maintenance tasks and schedules
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Latest Assigned Section */}
      <LatestAssigned />

      {/* Overlays */}
      {activeOverlay === "cutting" && (
        <AssignCuttingOverlay onClose={() => setActiveOverlay(null)} />
      )}

      {activeOverlay === "assembly" && (
        <AssignAssemblyOverlay
          onClose={() => setActiveOverlay(null)}
          onSuccess={() => {
            setActiveOverlay(null);
            // Refresh any data if needed
          }}
        />
      )}

      {activeOverlay === "delivery" && (
        <DandIOverlay
          onClose={() => setActiveOverlay(null)}
          onSuccess={() => {
            setActiveOverlay(null);
            // Refresh any data if needed
          }}
        />
      )}

      {/* Maintenance Overlay */}
      {activeOverlay === "maintenance" && (
        <AssignMaintenanceOverlay
          onClose={() => setActiveOverlay(null)}
          onSuccess={() => {
            setActiveOverlay(null);
            // Refresh any data if needed
          }}
        />
      )}
    </div>
  );
};
