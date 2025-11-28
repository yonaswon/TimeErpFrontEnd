// CompletedMaintenance.tsx
import { useState, useEffect } from "react";
import {
  CheckCircle,
  User,
  Phone,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Package,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Trash2,
} from "lucide-react";
import api from "@/api";

interface Maintenance {
  id: number;
  order?: {
    order_code: number;
    mockup: {
      name: string;
      mockup_image: string;
    };
  };
  client_name: string;
  client_contact: string;
  reported_issue: string;
  image: string | null;
  under_warranty: boolean;
  status: string;
  scheduled_start_date: string | null;
  scheduled_end_date: string | null;
  started: string | null;
  end: string | null;
  created_at: string;
}

interface Material {
  id: number;
  name: string;
  type: "L" | "P" | "A";
  code_name: string;
  available: string;
  parsialy_available: string;
  min_threshold: number;
  width: string | null;
  height: string | null;
  date: string;
}

interface Release {
  id: number;
  material: {
    id: number;
    name: string;
    type: "L" | "P" | "A";
    code_name: string;
  };
  reason: string;
  amount: string;
  proof_image: string | null;
  confirmed: boolean;
  date: string;
  order: number | null;
  maintenance: number;
  inventory: number;
  released_by: number;
  each_areal_material: any[];
}

interface MaterialUsage {
  material_id: number;
  amount: number;
  material_name?: string;
  material_type?: "L" | "P" | "A";
}

interface CompletedMaintenanceProps {
  userId: number;
}

export const CompletedMaintenance = ({ userId }: CompletedMaintenanceProps) => {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [releases, setReleases] = useState<{ [key: number]: Release[] }>({});
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [releasesLoading, setReleasesLoading] = useState<{
    [key: number]: boolean;
  }>({});
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [expandedMaintenance, setExpandedMaintenance] = useState<number | null>(
    null
  );
  const [showAddMaterialsModal, setShowAddMaterialsModal] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] =
    useState<Maintenance | null>(null);
  const [materialUsage, setMaterialUsage] = useState<MaterialUsage[]>([]);
  const [addingMaterials, setAddingMaterials] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [materialsError, setMaterialsError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
    currentPage: 1,
  });

  useEffect(() => {
    fetchMaintenances();
  }, [userId]);

  const fetchMaintenances = async (url?: string) => {
    try {
      setLoading(true);
      setError(null);

      const endpoint =
        url || `/api/maintenance/?status=D&assigned_to=${userId}`;
      const response = await api.get(endpoint);
      const data = response.data;

      setMaintenances(data.results || []);
      setPagination((prev) => ({
        ...prev,
        count: data.count,
        next: data.next,
        previous: data.previous,
        currentPage: getCurrentPage(url || endpoint),
      }));
    } catch (err) {
      setError("Failed to fetch completed maintenance tasks");
      console.error("Error fetching maintenances:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReleasesForMaintenance = async (maintenanceId: number) => {
    try {
      setReleasesLoading((prev) => ({ ...prev, [maintenanceId]: true }));

      const response = await api.get(
        `/api/release/?reason=MAINTENANCE&maintenance=${maintenanceId}`
      );
      const releasesData = response.data.results || response.data || [];

      setReleases((prev) => ({
        ...prev,
        [maintenanceId]: releasesData,
      }));
    } catch (err) {
      console.error(
        `Error fetching releases for maintenance ${maintenanceId}:`,
        err
      );
    } finally {
      setReleasesLoading((prev) => ({ ...prev, [maintenanceId]: false }));
    }
  };

  const fetchMaterials = async () => {
    try {
      setMaterialsLoading(true);
      setMaterialsError(null);

      const response = await api.get(`/materials/`);
      const data = response.data;

      // Filter out areal materials (type 'A') and only keep Length (L) and Piece (P)
      const filteredMaterials = (data.results || []).filter(
        (material: Material) => material.type !== "A"
      );

      setMaterials(filteredMaterials);
    } catch (err) {
      setMaterialsError("Failed to fetch materials");
      console.error("Error fetching materials:", err);
    } finally {
      setMaterialsLoading(false);
    }
  };

  const handleToggleExpand = async (maintenanceId: number) => {
    if (expandedMaintenance === maintenanceId) {
      setExpandedMaintenance(null);
    } else {
      setExpandedMaintenance(maintenanceId);
      if (!releases[maintenanceId]) {
        await fetchReleasesForMaintenance(maintenanceId);
      }
    }
  };

  const handleOpenAddMaterialsModal = async (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    setMaterialUsage([]);
    setShowAddMaterialsModal(true);
    await fetchMaterials();
  };

  const handleCloseAddMaterialsModal = () => {
    setShowAddMaterialsModal(false);
    setSelectedMaintenance(null);
    setMaterialUsage([]);
    setMaterialsError(null);
  };

  const handleAddMaterial = () => {
    setMaterialUsage([
      ...materialUsage,
      { material_id: 0, amount: 0, material_name: "", material_type: "L" },
    ]);
  };

  const handleRemoveMaterial = (index: number) => {
    setMaterialUsage(materialUsage.filter((_, i) => i !== index));
  };

  const handleMaterialChange = (
    index: number,
    field: keyof MaterialUsage,
    value: any
  ) => {
    const updatedUsage = [...materialUsage];

    if (field === "material_id") {
      const material = materials.find((m) => m.id === parseInt(value));
      updatedUsage[index] = {
        ...updatedUsage[index],
        material_id: parseInt(value),
        material_name: material?.name || "",
        material_type: material?.type || "L",
      };
    } else {
      updatedUsage[index] = {
        ...updatedUsage[index],
        [field]: value,
      };
    }

    setMaterialUsage(updatedUsage);
  };

  const handleAddMaterialsToMaintenance = async () => {
    if (!selectedMaintenance) return;

    // Validate material usage
    const validMaterials = materialUsage.filter(
      (usage) => usage.material_id > 0 && usage.amount > 0
    );

    if (validMaterials.length === 0) {
      setError("Please add at least one material with valid amount");
      return;
    }

    setAddingMaterials(selectedMaintenance.id);
    try {
      await api.post(
        `/api/maintenance/${selectedMaintenance.id}/add_materials_without_completing/`,
        {
          materials_used: validMaterials,
        }
      );

      // Refresh the releases for this maintenance
      await fetchReleasesForMaintenance(selectedMaintenance.id);
      handleCloseAddMaterialsModal();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add materials");
      console.error("Error adding materials:", err);
    } finally {
      setAddingMaterials(null);
    }
  };

  const getCurrentPage = (url: string): number => {
    const urlObj = new URL(url, window.location.origin);
    const pageParam = urlObj.searchParams.get("page");
    return pageParam ? parseInt(pageParam) : 1;
  };

  const handlePageChange = (url: string | null) => {
    if (url) {
      const urlPath = new URL(url).pathname + new URL(url).search;
      fetchMaintenances(urlPath);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUnitForMaterial = (materialType: "L" | "P" | "A"): string => {
    switch (materialType) {
      case "L":
        return "meters";
      case "P":
        return "pieces";
      case "A":
        return "sheets";
      default:
        return "units";
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-3">
          Loading completed maintenance tasks...
        </p>
      </div>
    );
  }

  if (error && !showAddMaterialsModal) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={() => fetchMaintenances()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (maintenances.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
        <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Completed Tasks
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          You haven't completed any maintenance tasks yet.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-3">
          {maintenances.map((maintenance) => (
            <div
              key={maintenance.id}
              className="bg-white dark:bg-gray-900 rounded-lg border border-green-200 dark:border-green-800 overflow-hidden"
            >
              {/* Maintenance Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleToggleExpand(maintenance.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                        {maintenance.order?.mockup?.name ||
                          maintenance.client_name}
                      </h3>
                      {expandedMaintenance === maintenance.id ? (
                        <ChevronUp size={16} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                      )}
                    </div>
                    {maintenance.order && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Order #{maintenance.order.order_code}
                      </p>
                    )}
                  </div>
                  {maintenance.under_warranty && (
                    <span className="flex items-center text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-1 rounded-full ml-2 shrink-0">
                      <CheckCircle size={12} className="mr-1" />
                      Warranty
                    </span>
                  )}
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {maintenance.reported_issue}
                  </p>
                </div>

                <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <div className="flex items-center space-x-1">
                    <User size={14} />
                    <span>{maintenance.client_name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Phone size={14} />
                    <span>{maintenance.client_contact}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Started:
                    </span>
                    <span className="text-gray-900 dark:text-white block">
                      {formatDate(maintenance.started)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Completed:
                    </span>
                    <span className="text-gray-900 dark:text-white block">
                      {formatDate(maintenance.end)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded Materials Section */}
              {expandedMaintenance === maintenance.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Package
                        size={16}
                        className="text-gray-600 dark:text-gray-400"
                      />
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Materials Used
                      </h4>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAddMaterialsModal(maintenance);
                      }}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Plus size={16} />
                      <span>Add Materials</span>
                    </button>
                  </div>

                  {releasesLoading[maintenance.id] ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Loading materials...
                      </p>
                    </div>
                  ) : releases[maintenance.id] &&
                    releases[maintenance.id].length > 0 ? (
                    <div className="space-y-2">
                      {releases[maintenance.id].map((release) => (
                        <div
                          key={release.id}
                          className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {release.material.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {release.material.code_name} •{" "}
                              {getUnitForMaterial(release.material.type)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">
                              {release.amount}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {getUnitForMaterial(release.material.type)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        No materials recorded for this maintenance
                      </p>
                    </div>
                  )}

                  {/* Duration Summary */}
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Total Duration:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {maintenance.started && maintenance.end
                          ? (() => {
                              const start = new Date(maintenance.started);
                              const end = new Date(maintenance.end);
                              const diffMs = end.getTime() - start.getTime();
                              const diffDays = Math.floor(
                                diffMs / (1000 * 60 * 60 * 24)
                              );
                              const diffHours = Math.floor(
                                (diffMs % (1000 * 60 * 60 * 24)) /
                                  (1000 * 60 * 60)
                              );

                              if (diffDays > 0) {
                                return `${diffDays} day${
                                  diffDays > 1 ? "s" : ""
                                } ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
                              } else {
                                return `${diffHours} hour${
                                  diffHours > 1 ? "s" : ""
                                }`;
                              }
                            })()
                          : "N/A"}
                      </span>
                    </div>
                    {releases[maintenance.id] &&
                      releases[maintenance.id].length > 0 && (
                        <div className="flex justify-between items-center text-sm mt-1">
                          <span className="text-gray-600 dark:text-gray-400">
                            Materials Used:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {releases[maintenance.id].length} item
                            {releases[maintenance.id].length > 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {(pagination.next || pagination.previous) && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => handlePageChange(pagination.previous)}
              disabled={!pagination.previous}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
            >
              <ChevronLeft size={16} />
              <span>Prev</span>
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300 px-4">
              {pagination.currentPage}
            </span>
            <button
              onClick={() => handlePageChange(pagination.next)}
              disabled={!pagination.next}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Add Materials Modal */}
      {showAddMaterialsModal && selectedMaintenance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Add Materials to Maintenance
                </h2>
                <button
                  onClick={handleCloseAddMaterialsModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Maintenance Info */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {selectedMaintenance.order?.mockup?.name ||
                    selectedMaintenance.client_name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedMaintenance.reported_issue}
                </p>
              </div>

              {/* Materials Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Materials Used
                  </h3>
                  <button
                    onClick={handleAddMaterial}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus size={16} />
                    <span>Add Material</span>
                  </button>
                </div>

                {materialUsage.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No materials added yet</p>
                    <p className="text-sm">
                      Click "Add Material" to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {materialUsage.map((usage, index) => (
                      <div
                        key={index}
                        className="flex items-end space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Material
                          </label>
                          <select
                            value={usage.material_id}
                            onChange={(e) =>
                              handleMaterialChange(
                                index,
                                "material_id",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            <option value={0}>Select a material</option>
                            {materials.map((material) => (
                              <option key={material.id} value={material.id}>
                                {material.name} ({material.code_name}) -
                                Available: {material.available}{" "}
                                {getUnitForMaterial(material.type)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Amount (
                            {usage.material_type
                              ? getUnitForMaterial(usage.material_type)
                              : "units"}
                            )
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={usage.amount || ""}
                            onChange={(e) =>
                              handleMaterialChange(
                                index,
                                "amount",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="0.00"
                          />
                        </div>

                        <button
                          onClick={() => handleRemoveMaterial(index)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors mb-2"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Materials Loading State */}
                {materialsLoading && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Loading materials...
                    </p>
                  </div>
                )}

                {/* Materials Error */}
                {materialsError && (
                  <div className="p-4 bg-red-50 dark:bg-red-900 rounded-lg">
                    <p className="text-red-600 dark:text-red-400 text-sm">
                      {materialsError}
                    </p>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleCloseAddMaterialsModal}
                  className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMaterialsToMaintenance}
                  disabled={
                    addingMaterials === selectedMaintenance.id ||
                    materialUsage.length === 0
                  }
                  className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingMaterials === selectedMaintenance.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding Materials...
                    </div>
                  ) : (
                    "Add Materials"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
