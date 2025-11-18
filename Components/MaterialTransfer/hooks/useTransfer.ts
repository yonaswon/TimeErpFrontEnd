import { useState } from "react";
import { Inventory, Material, EachArealMaterial } from "../types";
import api from "@/api";

export const useTransfer = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createArealTransfer = async (
    fromInventory: number,
    toInventory: number,
    eachMaterialIds: number[]
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post("/areal-records/create_transfer/", {
        from_inventory: fromInventory,
        to_inventory: toInventory,
        each_material_ids: eachMaterialIds,
      });

      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Transfer failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createLandPTransfer = async (
    fromInventory: number,
    toInventory: number,
    material: number,
    amount: number
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post("/landp-records/create_transfer/", {
        from_inventory: fromInventory,
        to_inventory: toInventory,
        material: material,
        amount: amount,
      });

      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Transfer failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createArealTransfer,
    createLandPTransfer,
  };
};
