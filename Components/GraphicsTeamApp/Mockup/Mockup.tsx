"use client";
import { useEffect, useState } from "react";
import MockupCard from "./MockupCard";
import SubmitMockupOverlay from "./SubmitMockupOverlay";
import SubmitModificationOverlay from "./SubmitModificationOverlay";
import { Mockup, Modification } from "./utils/types";
import api from "@/api";

const MockupPage = () => {
  const [mockups, setMockups] = useState<Mockup[]>([]);
  const [modifications, setModifications] = useState<{
    [key: number]: Modification[];
  }>({});
  const [loading, setLoading] = useState(true);
  const [showSubmitOverlay, setShowSubmitOverlay] = useState(false);
  const [showSubmitModificationOverlay, setShowSubmitModificationOverlay] = useState(false);
  const [selectedMockup, setSelectedMockup] = useState<Mockup | null>(null);
  const [selectedModification, setSelectedModification] = useState<Modification | null>(null);

  useEffect(() => {
    fetchMockups();
  }, []);

  const fetchMockups = async () => {
    try {
      const userData = localStorage.getItem("user_data");
      if (!userData) return;

      const user = JSON.parse(userData);
      const designerId = user.id;

      const response = await api.get(
        `/lead/mockups/?designer=${designerId}&ordering=-date`
      );

      if (response.data) {
        setMockups(response.data.results || response.data);

        // Fetch modifications for returned mockups
        const returnedMockups = (response.data.results || response.data).filter(
          (mockup: Mockup) => mockup.request_status === "RETURNED"
        );
        
        returnedMockups.forEach((mockup: Mockup) => {
          fetchModifications(mockup.id);
        });
      }
    } catch (error) {
      console.error("Error fetching mockups:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModifications = async (mockupId: number) => {
    try {
      const response = await api.get(
        `/lead/modifications/?ordering=requested_date&mockup=${mockupId}`
      );
      if (response.data) {
        setModifications((prev) => ({ ...prev, [mockupId]: response.data.results || response.data }));
      }
    } catch (error) {
      console.error("Error fetching modifications:", error);
    }
  };

  const startMockup = async (mockupId: number) => {
    try {
      await api.post(`/lead/mockups/${mockupId}/start/`);
      await fetchMockups();
    } catch (error) {
      console.error("Error starting mockup:", error);
    }
  };

  const startModification = async (modificationId: number, mockupId: number) => {
    try {
      await api.post(`/lead/modifications/${modificationId}/start/`);
      await fetchModifications(mockupId);
    } catch (error) {
      console.error("Error starting modification:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 flex flex-col gap-3">
      {/* Mockup List (Mobile-first stack) */}
      {mockups.length > 0 ? (
        <div className="flex flex-col gap-3">
          {mockups.map((mockup) => (
            <MockupCard
              key={mockup.id}
              mockup={mockup}
              modifications={modifications[mockup.id] || []}
              onStartMockup={startMockup}
              onStartModification={(modificationId) =>
                startModification(modificationId, mockup.id)
              }
              onShowSubmitOverlay={(mockup) => {
                setSelectedMockup(mockup);
                setShowSubmitOverlay(true);
              }}
              onShowSubmitModificationOverlay={(modification) => {
                setSelectedModification(modification);
                setShowSubmitModificationOverlay(true);
              }}
            />
          ))}
        </div>
      ) : (
        // Empty state
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          No mockup requests found. New requests will appear here.
        </div>
      )}

      {/* Submit Mockup Overlay */}
      {showSubmitOverlay && selectedMockup && (
        <SubmitMockupOverlay
          mockup={selectedMockup}
          onClose={() => {
            setShowSubmitOverlay(false);
            setSelectedMockup(null);
            fetchMockups();
          }}
          onSuccess={() => {
            setShowSubmitOverlay(false);
            setSelectedMockup(null);
            fetchMockups();
          }}
        />
      )}

      {/* Submit Modification Overlay */}
      {showSubmitModificationOverlay && selectedModification && (
        <SubmitModificationOverlay
          modification={selectedModification}
          onClose={() => {
            setShowSubmitModificationOverlay(false);
            setSelectedModification(null);
            fetchMockups();
          }}
          onSuccess={() => {
            setShowSubmitModificationOverlay(false);
            setSelectedModification(null);
            fetchMockups();
          }}
        />
      )}
    </div>
  );
};

export default MockupPage;