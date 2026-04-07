// LatestAssigned.tsx
import { useState, useEffect } from "react";
import { Scissors, Wrench, Truck, Calendar, User, Edit, Settings, Loader2 } from "lucide-react";
import api from "@/api";
import { EditAssignmentOverlay } from "./AssignCutting/EditAssignmentOverlay";
import { AssemblyTasks } from "./AssignAssembly/AssemblyTasks";
import { MaintenanceTasks } from "./Maintenance/MaintenanceTasks";
import { DeliveryTasks } from "./AssignDandI/DeliveryTasks";

type TaskType = "cutting" | "assembly" | "delivery" | "maintenance";

interface CuttingFile {
  id: number;
  orders: Order[];
  on: EachArealMaterial | null;
  old_material_number: string | null;
  old_material: { id: number; name: string } | null;
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
  order_name?: string;
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

  const tabs = [
    { id: "cutting" as TaskType, label: "Cutting", icon: Scissors },
    { id: "assembly" as TaskType, label: "Assembly", icon: Wrench },
    { id: "delivery" as TaskType, label: "DandI", icon: Truck },
    { id: "maintenance" as TaskType, label: "Maint.", icon: Settings },
  ];

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
      case "maintenance":
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
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
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
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading assigned tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={onRefresh}
          className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const assignedFiles = files.filter((file) => file.assigned_to);

  if (assignedFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="p-4 rounded-2xl bg-gray-100 dark:bg-zinc-800">
          <Scissors className="w-10 h-10 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          No Assigned Cutting Tasks
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Assign cutting tasks to see them here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {assignedFiles.map((file) => (
        <CuttingTaskCard key={file.id} file={file} onEdit={onEdit} />
      ))}
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

  const getStatusBadge = (status: string) => {
    const cfg: Record<string, { bg: string; text: string; label: string }> = {
      "NOT-ASSIGNED": { bg: "bg-gray-100 dark:bg-zinc-700", text: "text-gray-700 dark:text-gray-300", label: "Not Assigned" },
      "ASSIGNED": { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", label: "Assigned" },
      "STARTED": { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300", label: "Started" },
      "COMPLATED": { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", label: "Completed" },
    };
    return cfg[status] || cfg["NOT-ASSIGNED"];
  };

  const statusBadge = getStatusBadge(file.status);

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <img
              src={file.image}
              alt="Cutting preview"
              className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-zinc-600 shrink-0"
            />
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {file.crv3d.split("/").pop()}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {file.on ? `${file.on.material_name} - ${file.on.code}` : file.old_material ? `${file.old_material.name} - ${file.old_material_number}` : 'Unknown Material'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
              {statusBadge.label}
            </span>
            <button
              onClick={() => onEdit(file)}
              className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Assignment & Schedule */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <User className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span className="font-medium text-gray-900 dark:text-white">
              @{file.assigned_to?.telegram_user_name}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-green-500 dark:text-green-400" />
              <span>Start: {formatDate(file.schedule_start_date)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
              <span>Due: {formatDate(file.schedule_complate_date)}</span>
            </div>
          </div>
        </div>

        {/* Orders */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-700">
          <div className="flex flex-wrap gap-1.5">
            {file.orders.map((order) => (
              <span
                key={order.order_code}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-700 text-xs text-gray-700 dark:text-gray-300"
              >
                ORD-{order.order_code}
                {order.order_name && <span className="text-gray-500 dark:text-gray-400">— {order.order_name}</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
