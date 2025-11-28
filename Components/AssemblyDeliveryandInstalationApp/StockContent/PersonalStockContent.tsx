"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Loader2,
  RefreshCw,
  User,
  Package,
} from "lucide-react";
import { Material, MaterialsResponse, UserData } from "./types";
import { PersonalMaterialRow } from "./PersonalMaterialRow";
import { PersonalMaterialDetails } from "./PersonalMaterialDetails";
import api from "@/api";
import PersonalTransfersContent from "./TransferContent";

export const PersonalStockContent = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userInventoryName, setUserInventoryName] = useState<string>("");

  useEffect(() => {
    const userDataString = localStorage.getItem("user_data");
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        setUserData(userData);
        // Create inventory name from telegram username
        const inventoryName = `${userData.telegram_user_name}-Inventory`;
        setUserInventoryName(inventoryName);
      } catch (err) {
        console.error("Error parsing user data:", err);
        setError("Invalid user data format");
      }
    } else {
      setError("User data not found. Please log in again.");
    }
  }, []);

  const fetchPersonalMaterials = async (showRefresh = false) => {
    if (!userData) {
      setError("User data not available");
      return;
    }

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);
      const response = await api.get<MaterialsResponse>("/materials/", {
        params: {
          user_inventory_access: userData.id, // Only send user ID, no user_id param
        },
      });
      setMaterials(response.data.results);
    } catch (err) {
      console.error("Error fetching personal materials:", err);
      setError("Failed to load your materials. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userData) {
      fetchPersonalMaterials();
    }
  }, [userData]);

  // Show ALL materials, even if available is 0
  const getAllMaterialsForUser = () => {
    return materials.filter((material) => {
      const distribution = material.stats.inventory_distribution;

      // For areal materials - always show them
      if (material.type === "A") {
        return true;
      }

      // For other materials, check if user's inventory exists in distribution
      if (Array.isArray(distribution)) {
        return distribution.some(
          (inv) => inv.inventory__name === userInventoryName
        );
      } else if (typeof distribution === "object") {
        return userInventoryName in distribution;
      }

      return false;
    });
  };

  const userMaterials = getAllMaterialsForUser();

  const filteredMaterials = userMaterials.filter(
    (material) =>
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.code_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefresh = () => {
    fetchPersonalMaterials(true);
  };

  // Get available quantity for user's inventory (can be 0)
  const getAvailableInMyInventory = (material: Material) => {
    const distribution = material.stats.inventory_distribution;

    if (Array.isArray(distribution)) {
      const myInventory = distribution.find(
        (inv) => inv.inventory__name === userInventoryName
      );
      return myInventory ? myInventory.unstarted : 0;
    } else if (typeof distribution === "object") {
      return distribution[userInventoryName] || 0;
    }

    return 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 dark:text-red-400 mb-4">{error}</div>
        <button
          onClick={() => fetchPersonalMaterials()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700 shadow-sm">
        {/* Header with User Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                My Personal Stock
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {userInventoryName}
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 transition-colors"
          >
            <RefreshCw
              className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
        <PersonalTransfersContent />

        {/* Search and Filter */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search materials in my inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredMaterials.length} materials in {userInventoryName}
          </span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Materials List */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {searchTerm ? (
                "No materials found matching your search."
              ) : (
                <div className="space-y-2">
                  <Package className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
                  <p>No materials assigned to your inventory.</p>
                  <p className="text-sm">
                    Contact your supervisor to get materials assigned.
                  </p>
                </div>
              )}
            </div>
          ) : (
            filteredMaterials.map((material) => (
              <PersonalMaterialRow
                key={material.id}
                material={material}
                userInventoryName={userInventoryName}
                onClick={setSelectedMaterial}
              />
            ))
          )}
        </div>
      </div>

      {/* Material Details Overlay */}
      <PersonalMaterialDetails
        material={selectedMaterial!}
        userInventoryName={userInventoryName}
        isOpen={!!selectedMaterial}
        onClose={() => setSelectedMaterial(null)}
      />
    </div>
  );
};

export default PersonalStockContent;
