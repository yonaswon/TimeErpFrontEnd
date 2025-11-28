"use client";
import { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2, Search } from "lucide-react";
import api from "../../../api";

interface Material {
  id: number;
  name: string;
  type: "A" | "L" | "P";
  code_name: string | null;
  available: string;
  parsialy_available: string;
  min_threshold: number;
  width: string | null;
  height: string | null;
  date: string;
  stats: any;
}

interface EachArealMaterial {
  id: number;
  material: number;
  material_name: string;
  areal_material_record: number;
  code: number;
  inventory: number;
  inventory_name: string;
  current_width: string;
  current_height: string;
  started: boolean;
  finished: boolean;
  date: string;
}

interface Account {
  id: number;
  bank: string;
  available_amount: string;
  account_number: string;
  account_type: "C" | "P";
  account_name: string;
  deleted: boolean;
  date: string;
}

interface SalesMaterial {
  material_id: number;
  material_name: string;
  material_type: "A" | "L" | "P";
  amount: string;
  each_areal_material_ids: number[];
}

interface PaymentData {
  wallet_id: number;
  method: "CASH" | "BANK" | "CHECK";
  account_id: number | null;
  amount: string;
  invoice: boolean;
  invoice_image: File | null;
  additional_image: File | null;
  payment_screenshot: File | null;
  payment_note: string;
}

interface RecordSalesProps {
  onClose: () => void;
}

const RecordSales = ({ onClose }: RecordSalesProps) => {
  // Form states
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [materials, setMaterials] = useState<SalesMaterial[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    wallet_id: 2, // Default for CASH
    method: "CASH",
    account_id: null,
    amount: "",
    invoice: false,
    invoice_image: null,
    additional_image: null,
    payment_screenshot: null,
    payment_note: "",
  });

  // Data states
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [arealMaterials, setArealMaterials] = useState<EachArealMaterial[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showMaterialSelect, setShowMaterialSelect] = useState(false);
  const [showArealSelect, setShowArealSelect] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch materials on component mount
  useEffect(() => {
    fetchMaterials();
  }, []);

  // Fetch accounts when payment method changes to BANK or CHECK
  useEffect(() => {
    if (paymentData.method === "BANK" || paymentData.method === "CHECK") {
      fetchAccounts();
    }
  }, [paymentData.method, paymentData.invoice]);

  // Update wallet ID based on payment method
  useEffect(() => {
    if (paymentData.method === "CASH") {
      setPaymentData((prev) => ({ ...prev, wallet_id: 2 }));
    } else {
      setPaymentData((prev) => ({ ...prev, wallet_id: 1 }));
    }
  }, [paymentData.method]);

  const fetchMaterials = async () => {
    try {
      const response = await api.get("/materials/");
      setAllMaterials(response.data.results || []);
    } catch (err) {
      console.error("Failed to fetch materials:", err);
    }
  };

  const fetchArealMaterials = async (materialId: number) => {
    try {
      const response = await api.get(
        `/each-areal-materials/?material=${materialId}&finished=false`
      );
      setArealMaterials(response.data);
    } catch (err) {
      console.error("Failed to fetch areal materials:", err);
    }
  };

  const fetchAccounts = async () => {
    try {
      const accountType = paymentData.invoice ? "C" : "P";
      const response = await api.get(
        `/finance/account/?account_type=${accountType}&deleted=false`
      );
      setAccounts(response.data);
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
    }
  };

  const addMaterial = (material: Material) => {
    const newMaterial: SalesMaterial = {
      material_id: material.id,
      material_name: material.name,
      material_type: material.type,
      amount: "",
      each_areal_material_ids: [],
    };
    setMaterials([...materials, newMaterial]);
    setShowMaterialSelect(false);
    setSearchTerm("");
  };

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const updateMaterialAmount = (index: number, amount: string) => {
    const updated = [...materials];
    updated[index].amount = amount;
    setMaterials(updated);
  };

  const toggleArealMaterial = (
    materialIndex: number,
    arealMaterialId: number
  ) => {
    const updated = [...materials];
    const currentIds = updated[materialIndex].each_areal_material_ids;
    const isSelected = currentIds.includes(arealMaterialId);

    if (isSelected) {
      updated[materialIndex].each_areal_material_ids = currentIds.filter(
        (id) => id !== arealMaterialId
      );
    } else {
      updated[materialIndex].each_areal_material_ids = [
        ...currentIds,
        arealMaterialId,
      ];
    }

    setMaterials(updated);
  };

  const handlePaymentMethodChange = (method: "CASH" | "BANK" | "CHECK") => {
    setPaymentData((prev) => ({
      ...prev,
      method,
      account_id: method === "CASH" ? null : prev.account_id,
      payment_screenshot: method === "CASH" ? null : prev.payment_screenshot,
    }));
  };

  const handleFileChange = (field: keyof PaymentData, file: File | null) => {
    setPaymentData((prev) => ({ ...prev, [field]: file }));
  };

  const validateForm = (): boolean => {
    if (!customerName.trim()) {
      setError("Customer name is required");
      return false;
    }

    if (materials.length === 0) {
      setError("At least one material is required");
      return false;
    }

    for (const material of materials) {
      if (!material.amount || parseFloat(material.amount) <= 0) {
        setError(`Valid amount is required for ${material.material_name}`);
        return false;
      }

      if (
        material.material_type === "A" &&
        material.each_areal_material_ids.length === 0
      ) {
        setError(`Please select areal materials for ${material.material_name}`);
        return false;
      }
    }

    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      setError("Valid payment amount is required");
      return false;
    }

    if (paymentData.method !== "CASH") {
      if (!paymentData.account_id) {
        setError("Account selection is required for BANK and CHECK payments");
        return false;
      }
      if (!paymentData.payment_screenshot) {
        setError("Payment screenshot is required for BANK and CHECK payments");
        return false;
      }
    }

    if (paymentData.invoice && !paymentData.invoice_image) {
      setError("Invoice image is required when invoice is checked");
      return false;
    }

    return true;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("customer_name", customerName);
      formData.append("customer_contact", customerContact);

      // Debug what we're sending
      console.log("=== FRONTEND DEBUG: Materials to send ===");
      console.log("Materials:", materials);
      console.log("Materials JSON:", JSON.stringify(materials));

      // Add materials data
      formData.append("materials", JSON.stringify(materials));

      // Add payment data (excluding files)
      const paymentDataWithoutFiles = {
        ...paymentData,
      } as Partial<PaymentData>;
      delete paymentDataWithoutFiles.invoice_image;
      delete paymentDataWithoutFiles.additional_image;
      delete paymentDataWithoutFiles.payment_screenshot;

      console.log("=== FRONTEND DEBUG: Payment data to send ===");
      console.log("Payment data:", paymentDataWithoutFiles);
      console.log(
        "Payment data JSON:",
        JSON.stringify(paymentDataWithoutFiles)
      );

      formData.append("payment_data", JSON.stringify(paymentDataWithoutFiles));

      // Add files
      if (paymentData.invoice_image) {
        formData.append(
          "payment_data.invoice_image",
          paymentData.invoice_image
        );
      }
      if (paymentData.additional_image) {
        formData.append(
          "payment_data.additional_image",
          paymentData.additional_image
        );
      }
      if (paymentData.payment_screenshot) {
        formData.append(
          "payment_data.payment_screenshot",
          paymentData.payment_screenshot
        );
      }

      // Debug FormData contents
      console.log("=== FRONTEND DEBUG: FormData contents ===");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await api.post("/api/material-sales-record/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200 || response.status === 201) {
        setSuccess("Sales recorded successfully!");
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      console.error("Error recording sales:", err);
      setError(err.response?.data?.error || "Failed to record sales");
    } finally {
      setLoading(false);
    }
  };
  const filteredMaterials = allMaterials.filter(
    (material) =>
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.code_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Record Sales
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Customer Information */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Customer Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Information
              </label>
              <input
                type="text"
                value={customerContact}
                onChange={(e) => setCustomerContact(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter contact information"
              />
            </div>
          </div>

          {/* Materials Selection */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Materials
              </h3>
              <button
                type="button"
                onClick={() => setShowMaterialSelect(true)}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
              >
                <Plus size={16} />
                <span>Add Material</span>
              </button>
            </div>

            {materials.map((material, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-zinc-600 rounded-lg p-3"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {material.material_name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      Type:{" "}
                      {material.material_type === "A"
                        ? "Areal"
                        : material.material_type === "L"
                        ? "Length"
                        : "Piece"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMaterial(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Amount (
                      {material.material_type === "L"
                        ? "meters"
                        : material.material_type === "P"
                        ? "pieces"
                        : "units"}
                      ) *
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      value={material.amount}
                      onChange={(e) =>
                        updateMaterialAmount(index, e.target.value)
                      }
                      className="w-full px-2 py-1 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-sm"
                      placeholder="Enter amount"
                    />
                  </div>

                  {material.material_type === "A" && (
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowArealSelect(index);
                          fetchArealMaterials(material.material_id);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-sm text-left"
                      >
                        {material.each_areal_material_ids.length > 0
                          ? `${material.each_areal_material_ids.length} areal materials selected`
                          : "Select areal materials *"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Payment Information */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Payment Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Payment Method *
              </label>
              <select
                value={paymentData.method}
                onChange={(e) =>
                  handlePaymentMethodChange(
                    e.target.value as "CASH" | "BANK" | "CHECK"
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="CASH">Cash</option>
                <option value="BANK">Bank Transfer</option>
                <option value="CHECK">Check</option>
              </select>
            </div>

            {paymentData.method !== "CASH" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account *
                </label>
                <select
                  required={true}
                  value={paymentData.account_id || ""}
                  onChange={(e) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      account_id: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.bank} - {account.account_number}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount *
              </label>
              <input
                type="number"
                step="0.001"
                required
                value={paymentData.amount}
                onChange={(e) =>
                  setPaymentData((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter payment amount"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="invoice"
                checked={paymentData.invoice}
                onChange={(e) =>
                  setPaymentData((prev) => ({
                    ...prev,
                    invoice: e.target.checked,
                  }))
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="invoice"
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                This is an invoice payment
              </label>
            </div>

            {paymentData.invoice && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Invoice Image *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required={paymentData.invoice}
                  onChange={(e) =>
                    handleFileChange(
                      "invoice_image",
                      e.target.files?.[0] || null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/20 dark:file:text-blue-300"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Image (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleFileChange(
                    "additional_image",
                    e.target.files?.[0] || null
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 dark:file:bg-gray-900/20 dark:file:text-gray-300"
              />
            </div>

            {paymentData.method !== "CASH" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Screenshot *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required={true}
                  onChange={(e) =>
                    handleFileChange(
                      "payment_screenshot",
                      e.target.files?.[0] || null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/20 dark:file:text-blue-300"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Payment Note
              </label>
              <textarea
                value={paymentData.payment_note}
                onChange={(e) =>
                  setPaymentData((prev) => ({
                    ...prev,
                    payment_note: e.target.value,
                  }))
                }
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any notes about the payment"
              />
            </div>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-800 dark:text-green-200 text-sm">
                {success}
              </p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>{loading ? "Processing..." : "Record Sale"}</span>
            </button>
          </div>
        </form>

        {/* Material Selection Modal */}
        {showMaterialSelect && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
            <div className="bg-white dark:bg-zinc-800 rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-zinc-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Select Material
                </h3>
                <button
                  onClick={() => {
                    setShowMaterialSelect(false);
                    setSearchTerm("");
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4">
                <div className="relative mb-3">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search materials..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredMaterials.map((material) => (
                    <button
                      key={material.id}
                      type="button"
                      onClick={() => addMaterial(material)}
                      className="w-full text-left p-3 border border-gray-200 dark:border-zinc-600 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {material.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {material.code_name && `${material.code_name} • `}
                        {material.type === "A"
                          ? "Areal"
                          : material.type === "L"
                          ? "Length"
                          : "Piece"}{" "}
                        • Available: {material.available}
                      </div>
                    </button>
                  ))}

                  {filteredMaterials.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      No materials found
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Areal Material Selection Modal */}
        {showArealSelect !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
            <div className="bg-white dark:bg-zinc-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-zinc-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Select Areal Materials for{" "}
                  {materials[showArealSelect]?.material_name}
                </h3>
                <button
                  onClick={() => setShowArealSelect(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {arealMaterials.map((arealMaterial) => (
                    <label
                      key={arealMaterial.id}
                      className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-zinc-600 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={materials[
                          showArealSelect
                        ]?.each_areal_material_ids.includes(arealMaterial.id)}
                        onChange={() =>
                          toggleArealMaterial(showArealSelect, arealMaterial.id)
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          Code: {arealMaterial.code} •{" "}
                          {arealMaterial.inventory_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Size: {arealMaterial.current_width} ×{" "}
                          {arealMaterial.current_height} • Status:{" "}
                          {arealMaterial.started ? "Started" : "Unstarted"}
                        </div>
                      </div>
                    </label>
                  ))}

                  {arealMaterials.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      No areal materials available
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowArealSelect(null)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordSales;
