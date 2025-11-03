"use client";
import { useEffect, useState } from "react";
import MockupCard from "./MockupCard";
import SubmitMockupOverlay from "./SubmitMockupOverlay";
import { Mockup, Modification } from "./utils/types";

const MockupPage = () => {
  const [mockups, setMockups] = useState<Mockup[]>([]);
  const [modifications, setModifications] = useState<{
    [key: number]: Modification[];
  }>({});
  const [loading, setLoading] = useState(true);
  const [showSubmitOverlay, setShowSubmitOverlay] = useState(false);
  const [selectedMockup, setSelectedMockup] = useState<Mockup | null>(null);

  useEffect(() => {
    fetchMockups();
  }, []);

  const fetchMockups = async () => {
    try {
      const userData = localStorage.getItem("user_data");
      if (!userData) return;

      const user = JSON.parse(userData);
      const designerId = user.id;
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `http://127.0.0.1:8000/lead/mockups/?designer=${designerId}&ordering=-date`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMockups(data.results);

        // Fetch modifications for returned mockups
        data.results.forEach((mockup: Mockup) => {
          if (mockup.request_status === "RETURNED")
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
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `http://127.0.0.1:8000/lead/modifications/?ordering=requested_date&mockup=${mockupId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setModifications((prev) => ({ ...prev, [mockupId]: data }));
      }
    } catch (error) {
      console.error("Error fetching modifications:", error);
    }
  };

  const startMockup = async (mockupId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `http://127.0.0.1:8000/lead/mockups/${mockupId}/start/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) await fetchMockups();
    } catch (error) {
      console.error("Error starting mockup:", error);
    }
  };

  const startModification = async (
    modificationId: number,
    mockupId: number
  ) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `http://127.0.0.1:8000/lead/modifications/${modificationId}/start/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) await fetchModifications(mockupId);
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
            fetchMockups()
          }}
        />
      )}
    </div>
  );
};

export default MockupPage;
