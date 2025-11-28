// LatestAssigned.tsx
import { useState, useEffect } from "react";
import { Scissors, Wrench, Truck, Calendar, User, Edit } from "lucide-react";
import api from "@/api";
import { EditAssignmentOverlay } from "./AssignCutting/EditAssignmentOverlay";
import { AssemblyTasks } from "./AssignAssembly/AssemblyTasks";
type TaskType = "cutting" | "assembly" | "delivery" | "maintenance";

interface CuttingFile {
  id: number;
  orders: Order[];
  on: EachArealMaterial;
  crv3d: string;
  image: string;
  status: string;
  assigned_to: AssignedUser | null;
  schedule_start_date: string | null;
  schedule_complate_date: string | null;
  start_date: string | null;
  complate_date: string | null;
  date: string;
}

interface Order {
  order_code: number;
  boms: Bom[];
  mockup: Mockup | null;
  order_status: string;
  price: number;
}

interface Bom {
  id: number;
  width: string;
  height: string;
}

interface Mockup {
  id: number;
  mockup_image: string;
  note: string;
}

interface EachArealMaterial {
  id: number;
  material_name: string;
  code: number;
  current_width: string;
  current_height: string;
}

interface AssignedUser {
  id: number;
  telegram_user_name: string;
  role: Role[];
}

interface Role {
  id: number;
  Name: string;
}
import { MaintenanceTasks } from "./Maintenance/MaintenanceTasks";
import { DeliveryTasks } from "./AssignDandI/DeliveryTasks";

export const LatestAssigned = () => {
  const [activeTab, setActiveTab] = useState<TaskType>("cutting");
  const [cuttingFiles, setCuttingFiles] = useState<CuttingFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<CuttingFile | null>(null);

  useEffect(() => {
    if (activeTab === "cutting") {
      fetchCuttingFiles();
    }
  }, [activeTab]);

  const fetchCuttingFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/api/cuttingfiles/?ordering=-date");
      setCuttingFiles(response.data.results);
    } catch (err) {
      setError("Failed to fetch assigned tasks");
      console.error("Error fetching cutting files:", err);
    } finally {
      setLoading(false);
    }
  };

  // In LatestAssigned.tsx - Update the imports and tabs

  // Update the tabs array to include maintenance
  const tabs = [
    { id: "cutting" as TaskType, label: "Cutting", icon: Scissors },
    { id: "assembly" as TaskType, label: "Assembly", icon: Wrench },
    {
      id: "delivery" as TaskType,
      label: "DandI",
      icon: Truck,
    },
    { id: "maintenance" as TaskType, label: "Maintenance", icon: Wrench }, // Add this line
  ];

  // Update the renderContent function
  const renderContent = () => {
    switch (activeTab) {
      case "cutting":
        return (
          <CuttingTasks
            files={cuttingFiles}
            loading={loading}
            error={error}
            onEdit={setEditingFile}
            onRefresh={fetchCuttingFiles}
          />
        );
      case "assembly":
        return <AssemblyTasks />;
      case "delivery":
        return <DeliveryTasks />;
      case "maintenance": // Add this case
        return <MaintenanceTasks onRefresh={fetchCuttingFiles} />;
      default:
        return (
          <CuttingTasks
            files={cuttingFiles}
            loading={loading}
            error={error}
            onEdit={setEditingFile}
            onRefresh={fetchCuttingFiles}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Navigation */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {renderContent()}

      {/* Edit Overlay */}
      {editingFile && (
        <EditAssignmentOverlay
          file={editingFile}
          onClose={() => setEditingFile(null)}
          onSuccess={() => {
            setEditingFile(null);
            fetchCuttingFiles();
          }}
        />
      )}
    </div>
  );
};

// Cutting Tasks Component
interface CuttingTasksProps {
  files: CuttingFile[];
  loading: boolean;
  error: string | null;
  onEdit: (file: CuttingFile) => void;
  onRefresh: () => void;
}

const CuttingTasks = ({
  files,
  loading,
  error,
  onEdit,
  onRefresh,
}: CuttingTasksProps) => {
  const [viewMode, setViewMode] = useState<"card" | "list">("card");

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-3">
          Loading assigned tasks...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-gray-200 dark:border-zinc-700 text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const assignedFiles = files.filter((file) => file.assigned_to);

  if (assignedFiles.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
        <Scissors className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Assigned Cutting Tasks
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Assign cutting tasks to see them here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex justify-end">
        <div className="bg-gray-100 dark:bg-zinc-700 rounded-lg p-1 flex">
          <button
            onClick={() => setViewMode("card")}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === "card"
                ? "bg-white dark:bg-zinc-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            Card View
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === "list"
                ? "bg-white dark:bg-zinc-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            List View
          </button>
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-3">
        {assignedFiles.map((file) =>
          viewMode === "card" ? (
            <CuttingTaskCard key={file.id} file={file} onEdit={onEdit} />
          ) : (
            <CuttingTaskListItem key={file.id} file={file} onEdit={onEdit} />
          )
        )}
      </div>
    </div>
  );
};

// Cutting Task Card Component
interface CuttingTaskCardProps {
  file: CuttingFile;
  onEdit: (file: CuttingFile) => void;
}

const CuttingTaskCard = ({ file, onEdit }: CuttingTaskCardProps) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    const statusConfig = {
      "NOT-ASSIGNED": "bg-gray-100 text-gray-800",
      ASSIGNED: "bg-blue-100 text-blue-800",
      STARTED: "bg-yellow-100 text-yellow-800",
      COMPLATED: "bg-green-100 text-green-800",
    };
    return (
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig["NOT-ASSIGNED"]
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Preview Image */}
        <div className="shrink-0">
          <img
            src={file.image}
            alt="Cutting preview"
            className="w-20 h-20 object-cover rounded-lg border border-gray-300"
          />
        </div>

        {/* Task Details */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {file.crv3d.split("/").pop()}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {file.on.material_name} - {file.on.code}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  file.status
                )}`}
              >
                {file.status.replace("-", " ")}
              </span>
              <button
                onClick={() => onEdit(file)}
                className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                title="Edit assignment"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Assignment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-gray-700 dark:text-gray-300">
                  Assigned to:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  @{file.assigned_to?.telegram_user_name}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4 text-green-600" />
                <span className="text-gray-700 dark:text-gray-300">Start:</span>
                <span className="text-gray-900 dark:text-white">
                  {formatDate(file.schedule_start_date)}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span className="text-gray-700 dark:text-gray-300">
                  Complete:
                </span>
                <span className="text-gray-900 dark:text-white">
                  {formatDate(file.schedule_complate_date)}
                </span>
              </div>
            </div>

            {/* Orders */}
            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Orders:
              </h5>
              <div className="space-y-1">
                {file.orders.map((order) => (
                  <div
                    key={order.order_code}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      ORD-{order.order_code}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        order.order_status === "PRE-ACCEPTED"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {order.order_status.replace("-", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mockup Info */}
          {file.orders[0]?.mockup && (
            <div className="border-t border-gray-200 dark:border-zinc-700 pt-3">
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Mockup:
              </h5>
              <div className="flex items-start space-x-3">
                <img
                  src={file.orders[0].mockup.mockup_image}
                  alt="Order mockup"
                  className="w-16 h-16 object-cover rounded border border-gray-300"
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {file.orders[0].mockup.note || "No description"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Cutting Task List Item Component
const CuttingTaskListItem = ({ file, onEdit }: CuttingTaskCardProps) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={file.image}
            alt="Cutting preview"
            className="w-12 h-12 object-cover rounded border border-gray-300"
          />
          <div>
            <div className="font-medium text-gray-900 dark:text-white text-sm">
              {file.crv3d.split("/").pop()}
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>@{file.assigned_to?.telegram_user_name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(file.schedule_start_date)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(file.schedule_complate_date)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {file.orders.length} order(s)
          </span>
          <button
            onClick={() => onEdit(file)}
            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
            title="Edit assignment"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
