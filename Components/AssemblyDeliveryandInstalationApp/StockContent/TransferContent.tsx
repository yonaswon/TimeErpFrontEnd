"use client";
import React, { useState, useEffect } from "react";
import { TransferButton, TransferOverlay } from "@/Components/MaterialTransfer";
import { Loader2, AlertCircle, Package, RefreshCw, User } from "lucide-react";
import api from "@/api";

interface Inventory {
  id: number;
  name: string;
  type: string;
  admins: Array<{
    id: number;
    username: string;
    email: string;
  }>;
  created_at: string;
  updated_at: string;
}

interface UserData {
  id: number;
  telegram_id: number;
  telegram_user_name: string;
  role: Array<{
    id: number;
    Name: string;
    date: string;
  }>;
  first_name: string;
}

const PersonalTransfersContent = () => {
  const [showTransfer, setShowTransfer] = useState(false);
  const [fromInventoryId, setFromInventoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [inventoryData, setInventoryData] = useState<Inventory | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Get user data from localStorage
  useEffect(() => {
    const userDataString = localStorage.getItem("user_data");
    const token = localStorage.getItem("access_token");

    if (!token) {
      setError("Authentication required. Please log in again.");
      setLoading(false);
      return;
    }

    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        setUserData(userData);
      } catch (err) {
        console.error("Error parsing user data:", err);
        setError("Invalid user data format");
        setLoading(false);
      }
    } else {
      setError("User data not found. Please log in again.");
      setLoading(false);
    }
  }, []);

  // Fetch user's personal inventory using api.get
  const fetchUserInventory = async (showRefresh = false) => {
    if (!userData) return;

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Use api.get which automatically includes the JWT token
      const response = await api.get<Inventory[]>(
        `/inventories/?type=PS&admins=${userData.id}`
      );

      if (!response.data || response.data.length === 0) {
        throw new Error("No personal inventory found for your account.");
      }

      // Take the first inventory
      const firstInventory: Inventory = response.data[0];
      setFromInventoryId(firstInventory.id);
      setInventoryData(firstInventory);
    } catch (err: any) {
      console.error("Error fetching inventory:", err);

      if (err.response?.status === 401) {
        setError("Authentication failed. Please log in again.");
      } else if (err.response?.status === 404) {
        setError("Inventory endpoint not found.");
      } else if (err.response?.status >= 500) {
        setError("Server error. Please try again later.");
      } else {
        setError(err.message || "Failed to load inventory. Please try again.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userData) {
      fetchUserInventory();
    }
  }, [userData]);

  const handleRetry = () => {
    if (userData) {
      fetchUserInventory(true);
    } else {
      window.location.reload();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 p-6 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 dark:text-blue-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Loading your inventory...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 p-6 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm">
        <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Unable to Load Inventory
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-4 max-w-md">
          {error}
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // No inventory found state
  if (!fromInventoryId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 p-6 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm">
        <Package className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Personal Inventory
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-4 max-w-md">
          You don't have a personal inventory set up yet.
        </p>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800"
        >
          Check Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <TransferButton
        fromInventoryId={fromInventoryId}
        onClick={() => setShowTransfer(true)}
      />

      <TransferOverlay
        isOpen={showTransfer}
        onClose={() => setShowTransfer(false)}
        fromInventoryId={fromInventoryId}
      />
    </div>
  );
};

export default PersonalTransfersContent;
