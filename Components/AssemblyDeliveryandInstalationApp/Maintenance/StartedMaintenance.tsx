// StartedMaintenance.tsx
import { useState, useEffect, useRef } from "react";
import {
  Wrench,
  User,
  Phone,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Trash2,
  CreditCard,
  Upload,
  Image,
  Scan,
  Loader2,
} from "lucide-react";
import jsQR from "jsqr";
import api from "@/api";

interface Account {
  id: number;
  bank: string;
  account_number: string;
  account_name: string;
  transaction_id_number_of_character: number | null;
}

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

interface MaterialUsage {
  material_id: number;
  amount: number;
  material_name?: string;
  material_type?: "L" | "P" | "A";
}

interface StartedMaintenanceProps {
  userId: number;
}

export const StartedMaintenance = ({ userId }: StartedMaintenanceProps) => {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [materialsError, setMaterialsError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] =
    useState<Maintenance | null>(null);
  const [materialUsage, setMaterialUsage] = useState<MaterialUsage[]>([]);
  const [completionNotes, setCompletionNotes] = useState("");
  const [pagination, setPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
    currentPage: 1,
  });
  const [materialsPagination, setMaterialsPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
    currentPage: 1,
  });

  // Payment States
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [txCheckStatus, setTxCheckStatus] = useState<{
    is_checking: boolean;
    is_unique: boolean | null;
  }>({ is_checking: false, is_unique: null });
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [scanningQR, setScanningQR] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"BANK" | "CASH">("BANK");
  const [paymentAccount, setPaymentAccount] = useState<number | null>(null);
  const [transactionId, setTransactionId] = useState<string>("");
  const [accountTxLength, setAccountTxLength] = useState<number | null>(null);
  const [confirmationImage, setConfirmationImage] = useState<File | null>(null);
  const [paymentTiming, setPaymentTiming] = useState<"NOW" | "AFTER">("AFTER");

  useEffect(() => {
    fetchMaintenances();
  }, [userId]);

  const fetchMaintenances = async (url?: string) => {
    try {
      setLoading(true);
      setError(null);

      const endpoint =
        url || `/api/maintenance/?status=S&assigned_to=${userId}`;
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
      setError("Failed to fetch started maintenance tasks");
      console.error("Error fetching maintenances:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async (url?: string) => {
    try {
      setMaterialsLoading(true);
      setMaterialsError(null);

      const endpoint = url || `/materials/`;
      const response = await api.get(endpoint);
      const data = response.data;

      // Filter out areal materials (type 'A') and only keep Length (L) and Piece (P)
      const filteredMaterials = (data.results || []).filter(
        (material: Material) => material.type !== "A"
      );

      setMaterials(filteredMaterials);
      setMaterialsPagination((prev) => ({
        ...prev,
        count: data.count,
        next: data.next,
        previous: data.previous,
        currentPage: getCurrentPage(url || endpoint),
      }));
    } catch (err) {
      setMaterialsError("Failed to fetch materials");
      console.error("Error fetching materials:", err);
    } finally {
      setMaterialsLoading(false);
    }
  };

  const getCurrentPage = (url: string): number => {
    const urlObj = new URL(url, window.location.origin);
    const pageParam = urlObj.searchParams.get("p");
    return pageParam ? parseInt(pageParam) : 1;
  };

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const response = await api.get<Account[]>(`/finance/account/?account_type=P&deleted=false`);
      setAccounts(response.data);
      if (response.data.length > 0 && !paymentAccount) {
        setPaymentAccount(response.data[0].id);
        setAccountTxLength(response.data[0].transaction_id_number_of_character || null);
      }
    } catch (err) {
      console.error("Error fetching accounts:", err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const checkTransactionUniqueness = (txId: string, requiredLength: number | null) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!txId || txId.trim() === "") {
      setTxCheckStatus({ is_checking: false, is_unique: null });
      return;
    }
    if (requiredLength && txId.length !== requiredLength) {
      setTxCheckStatus({ is_checking: false, is_unique: null });
      return;
    }
    setTxCheckStatus({ is_checking: true, is_unique: null });
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await api.post("/finance/payment/check_transaction_id/", { transaction_id: txId });
        setTxCheckStatus({ is_checking: false, is_unique: res.data.is_unique });
      } catch (err) {
        setTxCheckStatus({ is_checking: false, is_unique: null });
      }
    }, 500);
  };

  const handleScanQR = async () => {
    const file = confirmationImage;
    if (!file) return;

    setScanningQR(true);
    setScanError(null);

    try {
      const codeData = await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new window.Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) { resolve(null); return; }
            const tryDecode = (w: number, h: number) => {
              canvas.width = w; canvas.height = h;
              ctx.drawImage(img, 0, 0, w, h);
              const imageData = ctx.getImageData(0, 0, w, h);
              try { return jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" }); } catch { return null; }
            };
            let ratio = Math.min(1, 2500 / img.width, 2500 / img.height);
            let width1 = Math.round(img.width * ratio);
            let height1 = Math.round(img.height * ratio);
            let code = tryDecode(width1, height1);
            if (!code) code = tryDecode(Math.round(width1 * 0.5), Math.round(height1 * 0.5));
            if (!code) code = tryDecode(Math.round(width1 * 0.25), Math.round(height1 * 0.25));
            resolve(code ? code.data : null);
          };
          img.onerror = () => resolve(null);
          img.src = e.target?.result as string;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });

      if (codeData) {
        const trimmed = codeData.trim();
        setTransactionId(trimmed);
        checkTransactionUniqueness(trimmed, accountTxLength);
      } else {
        setScanError("No QR code found in image");
        setTimeout(() => setScanError(null), 5000);
      }
    } catch {
      setScanError("Failed to scan image");
    } finally {
      setScanningQR(false);
    }
  };

  const handleOpenCompletionModal = async (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    setMaterialUsage([]);
    setCompletionNotes("");
    setPaymentAmount("");
    setPaymentMethod("BANK");
    setTransactionId("");
    setConfirmationImage(null);
    setPaymentTiming("AFTER"); // Reset default
    setShowCompletionModal(true);
    await fetchMaterials(); // Fetch materials when modal opens
    if (!maintenance.under_warranty) {
      await fetchAccounts();
    }
  };

  const handleCloseCompletionModal = () => {
    setShowCompletionModal(false);
    setSelectedMaintenance(null);
    setMaterialUsage([]);
    setCompletionNotes("");
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

  const handleCompleteMaintenance = async () => {
    if (!selectedMaintenance) return;

    // Validate material usage
    const validMaterials = materialUsage.filter(
      (usage) => usage.material_id > 0 && usage.amount > 0
    );

    if (validMaterials.length === 0) {
      setError("Please add at least one material with valid amount");
      return;
    }

    // Payment validation if not under warranty
    if (!selectedMaintenance.under_warranty && paymentTiming === "NOW") {
      if (!paymentAmount) {
        setError("Payment amount is required since item is not under warranty");
        return;
      }
      if (paymentMethod !== "CASH" && !paymentAccount) {
        setError("Account is required for non-cash payments");
        return;
      }
      if (paymentMethod !== "CASH" && !confirmationImage) {
        setError("Confirmation image is required for non-cash payments");
        return;
      }
      if (paymentMethod === "BANK") {
        if (!transactionId.trim()) {
          setError("Transaction ID is required for bank payments");
          return;
        }
        if (txCheckStatus.is_unique === false) {
          setError("Transaction ID is already used");
          return;
        }
        if (accountTxLength && transactionId.length !== accountTxLength) {
          setError(`Transaction ID must be exactly ${accountTxLength} characters`);
          return;
        }
      }
    }

    setCompletingId(selectedMaintenance.id);
    try {
      const submitData = new FormData();
      submitData.append("materials_used", JSON.stringify(validMaterials));
      submitData.append("completion_notes", completionNotes);
      submitData.append("paid_after_maintenance", paymentTiming === "AFTER" ? "true" : "false");

      if (!selectedMaintenance.under_warranty && paymentTiming === "NOW") {
        submitData.append("payment_amount", paymentAmount);
        submitData.append("method", paymentMethod);
        submitData.append("wallet", paymentMethod === "CASH" ? "2" : "1");
        if (paymentAccount) {
          submitData.append("account", paymentAccount.toString());
        }
        if (paymentMethod === "BANK" && transactionId) {
          submitData.append("transaction_id", transactionId);
        }
        if (paymentMethod !== "CASH" && confirmationImage) {
          submitData.append("confirmation_image", confirmationImage);
        }
      }

      await api.post(
        `/api/maintenance/${selectedMaintenance.id}/complete_maintenance/`,
        submitData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      handleCloseCompletionModal();
      fetchMaintenances(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to complete maintenance");
      console.error("Error completing maintenance:", err);
    } finally {
      setCompletingId(null);
    }
  };

  const handlePageChange = (url: string | null) => {
    if (url) {
      const urlPath = new URL(url).pathname + new URL(url).search;
      fetchMaintenances(urlPath);
    }
  };

  const handleMaterialsPageChange = (url: string | null) => {
    if (url) {
      const urlPath = new URL(url).pathname + new URL(url).search;
      fetchMaterials(urlPath);
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
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-3">
          Loading started maintenance tasks...
        </p>
      </div>
    );
  }

  if (error && !showCompletionModal) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-gray-200 dark:border-zinc-700 text-center">
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
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-8 border border-gray-200 dark:border-zinc-700 text-center">
        <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Started Tasks
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          You haven't started any maintenance tasks yet.
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
              className="bg-white dark:bg-zinc-800 rounded-lg border border-yellow-200 dark:border-yellow-800 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                    {maintenance.order?.mockup?.name || maintenance.client_name}
                  </h3>
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
                <p className="text-sm text-gray-700 dark:text-gray-300">
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

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Started:
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {formatDate(maintenance.started)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Scheduled End:
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {formatDate(maintenance.scheduled_end_date)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleOpenCompletionModal(maintenance)}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Complete Maintenance
              </button>
            </div>
          ))}
        </div>

        {(pagination.next || pagination.previous) && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-zinc-600">
            <button
              onClick={() => handlePageChange(pagination.previous)}
              disabled={!pagination.previous}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 text-sm"
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
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 text-sm"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Completion Modal */}
      {showCompletionModal && selectedMaintenance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Complete Maintenance
                </h2>
                <button
                  onClick={handleCloseCompletionModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Maintenance Info */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-zinc-700 rounded-lg">
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
                    <Wrench className="w-12 h-12 mx-auto mb-2 opacity-50" />
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
                        className="flex items-end space-x-4 p-4 border border-gray-200 dark:border-zinc-600 rounded-lg"
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
                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
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
                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                            placeholder="0.00"
                          />
                        </div>

                        <button
                          onClick={() => handleRemoveMaterial(index)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
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

                {/* Materials Pagination */}
                {(materialsPagination.next || materialsPagination.previous) && (
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200 dark:border-zinc-600">
                    <button
                      onClick={() =>
                        handleMaterialsPageChange(materialsPagination.previous)
                      }
                      disabled={!materialsPagination.previous}
                      className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 text-sm"
                    >
                      <ChevronLeft size={16} />
                      <span>Prev</span>
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300 px-4">
                      {materialsPagination.currentPage}
                    </span>
                    <button
                      onClick={() =>
                        handleMaterialsPageChange(materialsPagination.next)
                      }
                      disabled={!materialsPagination.next}
                      className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 text-sm"
                    >
                      <span>Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Section - Only show when NOT under warranty */}
              {!selectedMaintenance.under_warranty && (
                <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="font-medium text-blue-900 dark:text-blue-100 flex items-center space-x-2">
                      <CreditCard className="w-5 h-5" />
                      <span>Payment Information (Out of Warranty)</span>
                    </h3>

                    <div className="flex items-center space-x-2 bg-white dark:bg-zinc-800 p-2 rounded-lg border border-blue-200 dark:border-blue-700 w-fit">
                      <input
                        type="checkbox"
                        id="payNowToggle"
                        checked={paymentTiming === "NOW"}
                        onChange={(e) => setPaymentTiming(e.target.checked ? "NOW" : "AFTER")}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="payNowToggle" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                        Pay Now (If no, will be paid after maintenance)
                      </label>
                    </div>
                  </div>

                  {paymentTiming === "NOW" && (
                    <div className="space-y-4 mt-4 pt-4 border-t border-blue-200 dark:border-blue-800/50">
                      {/* Payment Amount */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Payment Amount *
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-blue-200 dark:border-blue-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.000"
                        />
                      </div>

                      {/* Payment Method */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Payment Method *
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => {
                            setPaymentMethod(e.target.value as "BANK" | "CASH");
                            setPaymentAccount(null);
                            setConfirmationImage(null);
                            setTransactionId("");
                            setAccountTxLength(null);
                            setTxCheckStatus({ is_checking: false, is_unique: null });
                          }}
                          required
                          className="w-full px-3 py-2 border border-blue-200 dark:border-blue-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="BANK">Bank Transfer</option>
                          <option value="CASH">Cash</option>
                        </select>
                      </div>

                      {/* Account Selection - Only show for non-cash payments */}
                      {paymentMethod !== "CASH" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Account *
                          </label>
                          <select
                            value={paymentAccount || ""}
                            onChange={(e) => {
                              const val = e.target.value ? parseInt(e.target.value) : null;
                              setPaymentAccount(val);
                              const accountObj = accounts.find((a) => a.id === val);
                              setAccountTxLength(accountObj?.transaction_id_number_of_character || null);
                              setTxCheckStatus({ is_checking: false, is_unique: null });
                            }}
                            required
                            disabled={loadingAccounts}
                            className="w-full px-3 py-2 border border-blue-200 dark:border-blue-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                          >
                            <option value="">Select Account</option>
                            {accounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.bank} - {account.account_number} ({account.account_name})
                              </option>
                            ))}
                          </select>
                          {loadingAccounts && (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500 mt-2" />
                          )}
                        </div>
                      )}

                      {/* Transaction ID - Only for BANK */}
                      {paymentMethod === "BANK" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Transaction ID *{" "}
                            {accountTxLength ? `(${accountTxLength} characters)` : ""}
                          </label>
                          <input
                            type="text"
                            value={transactionId}
                            onChange={(e) => {
                              setTransactionId(e.target.value);
                              checkTransactionUniqueness(e.target.value, accountTxLength);
                            }}
                            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${(accountTxLength && transactionId.length > 0 && transactionId.length !== accountTxLength) || txCheckStatus.is_unique === false ? "border-red-500" : txCheckStatus.is_unique === true ? "border-green-500" : "border-blue-200 dark:border-blue-700"}`}
                            placeholder="Enter transaction ID"
                            required
                          />
                          {accountTxLength && transactionId.length > 0 && transactionId.length !== accountTxLength && (
                            <p className="text-xs text-red-500 mt-1">
                              Must be exactly {accountTxLength} characters.
                            </p>
                          )}
                          {((accountTxLength === null) || (accountTxLength !== null && transactionId.length === accountTxLength)) && transactionId.length > 0 && (
                            <div className="mt-1 text-xs">
                              {txCheckStatus.is_checking && <span className="text-gray-500">Checking uniqueness...</span>}
                              {!txCheckStatus.is_checking && txCheckStatus.is_unique === true && <span className="text-green-500">✅ Unique</span>}
                              {!txCheckStatus.is_checking && txCheckStatus.is_unique === false && <span className="text-red-500">❌ This Transaction ID is already used</span>}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Confirmation Image - Required for non-cash payments */}
                      {paymentMethod !== "CASH" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Confirmation Image *
                          </label>
                          <div className="relative">
                            <Upload className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setConfirmationImage(e.target.files?.[0] || null)}
                              required
                              className="w-full pl-10 pr-4 py-2 border border-blue-200 dark:border-blue-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                          </div>
                          {paymentMethod === "BANK" && confirmationImage && (
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                type="button"
                                onClick={handleScanQR}
                                disabled={scanningQR}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/50 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                              >
                                <Scan size={16} />
                                {scanningQR ? "Scanning..." : "Scan QR for Tx ID"}
                              </button>
                              {scanError && <span className="text-xs text-red-500">{scanError}</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Completion Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Completion Notes
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                  placeholder="Add any notes about the maintenance completion..."
                />
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
                  onClick={handleCloseCompletionModal}
                  className="flex-1 py-3 px-4 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteMaintenance}
                  disabled={
                    completingId === selectedMaintenance.id ||
                    materialUsage.length === 0
                  }
                  className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {completingId === selectedMaintenance.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Completing...
                    </div>
                  ) : (
                    "Complete Maintenance"
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
