import { useState, useEffect } from "react";
import { EachArealMaterial, PaginatedResponse } from "../types";
import api from "@/api";

export const useEachArealMaterials = (
  inventoryId?: number,
  materialId?: number
) => {
  const [materials, setMaterials] = useState<EachArealMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<string | null>(null);

  const fetchMaterials = async (url?: string) => {
    try {
      if (!url) setLoading(true);
      setError(null);

      let apiUrl = "/each-areal-materials/";
      const params = new URLSearchParams();

      if (inventoryId) params.append("inventory_id", inventoryId.toString());
      if (materialId) params.append("material_id", materialId.toString());
      params.append("finished", "false");

      if (params.toString()) {
        apiUrl += `?${params.toString()}`;
      }

      const response = await api.get<any>(url || apiUrl);

      if (url) {
        setMaterials((prev) => [...prev, ...response.data]);
      } else {
        setMaterials(response.data);
      }

      setNextPage(response.data.next);
    } catch (err) {
      setError("Failed to fetch areal materials");
      console.error("Error fetching areal materials:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (nextPage) {
      fetchMaterials(nextPage);
    }
  };

  useEffect(() => {
    if (inventoryId && materialId) {
      fetchMaterials();
    }
  }, [inventoryId, materialId]);

  return {
    materials,
    loading,
    error,
    nextPage,
    fetchMaterials,
    loadMore,
  };
};
