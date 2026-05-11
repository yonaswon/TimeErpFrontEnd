"use client";
import { useEffect, useRef, useState } from "react";
import MockupCard from "./MockupCard";
import SubmitMockupOverlay from "./SubmitMockupOverlay";
import SubmitModificationOverlay from "./SubmitModificationOverlay";
import MockupDetailOverlay from "./MockupDetailOverlay";
import { Mockup, Modification } from "./utils/types";
import api from "@/api";

const MockupPage = () => {
  const [mockups, setMockups] = useState<Mockup[]>([]);
  const [modifications, setModifications] = useState<{ [key: number]: Modification[] }>({});

  // Pagination & search state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Overlay state
  const [showSubmitOverlay, setShowSubmitOverlay] = useState(false);
  const [showSubmitModificationOverlay, setShowSubmitModificationOverlay] = useState(false);
  const [showDetailOverlay, setShowDetailOverlay] = useState(false);
  const [selectedMockup, setSelectedMockup] = useState<Mockup | null>(null);
  const [selectedModification, setSelectedModification] = useState<Modification | null>(null);

  const [startingMockupId, setStartingMockupId] = useState<number | null>(null);
  const [startingModificationId, setStartingModificationId] = useState<number | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Core fetch helper ────────────────────────────────────────────────────────
  const fetchMockups = async (page: number, term: string, append: boolean) => {
    try {
      const userData = localStorage.getItem("user_data");
      if (!userData) return;
      const designerId = JSON.parse(userData).id;

      let url = `/lead/mockups/?p=${page}&designer=${designerId}&ordering=-date`;
      if (term.trim()) url += `&search=${encodeURIComponent(term.trim())}`;

      const response = await api.get(url);
      if (!response.data) return;

      const results: Mockup[] = response.data.results ?? response.data;
      const next: string | null = response.data.next ?? null;

      if (append) {
        setMockups((prev) => [...prev, ...results]);
      } else {
        setMockups(results);
        // Discard modification data for mockups no longer in the list
        const newIds = new Set(results.map((m) => m.id));
        setModifications((prev) => {
          const cleaned: { [key: number]: Modification[] } = {};
          for (const id of Object.keys(prev)) {
            if (newIds.has(Number(id))) cleaned[Number(id)] = prev[Number(id)];
          }
          return cleaned;
        });
      }

      setNextUrl(next);
      setCurrentPage(page);
      fetchModificationsForNew(results);
    } catch (error) {
      console.error("Error fetching mockups:", error);
    }
  };

  // ── Modifications helpers ────────────────────────────────────────────────────
  const fetchModificationsForNew = (newMockups: Mockup[]) => {
    setModifications((prev) => {
      const toFetch = newMockups.filter(
        (m) => m.request_status === "RETURNED" && !(m.id in prev)
      );
      toFetch.forEach((m) => fetchModifications(m.id));
      return prev;
    });
  };

  const fetchModifications = async (mockupId: number) => {
    try {
      const response = await api.get(
        `/lead/modifications/?ordering=requested_date&mockup=${mockupId}`
      );
      if (response.data) {
        setModifications((prev) => ({
          ...prev,
          [mockupId]: response.data.results ?? response.data,
        }));
      }
    } catch (error) {
      console.error("Error fetching modifications:", error);
    }
  };

  // ── Mount: load page 1 ───────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setSearchLoading(true);
      await fetchMockups(1, "", false);
      setSearchLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Debounced search ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      await fetchMockups(1, searchTerm, false);
      setSearchLoading(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // ── Load More ────────────────────────────────────────────────────────────────
  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchMockups(currentPage + 1, searchTerm, true);
    } catch (error) {
      console.error("Error loading more mockups:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // ── Refresh helper (used by overlays / start actions) ───────────────────────
  const refreshMockups = async () => {
    setSearchLoading(true);
    await fetchMockups(1, searchTerm, false);
    setSearchLoading(false);
  };

  // ── Action handlers ──────────────────────────────────────────────────────────
  const startMockup = async (mockupId: number) => {
    try {
      setStartingMockupId(mockupId);
      await api.post(`/lead/mockups/${mockupId}/start/`);
      await refreshMockups();
    } catch (error) {
      console.error("Error starting mockup:", error);
    } finally {
      setStartingMockupId(null);
    }
  };

  const startModification = async (modificationId: number, mockupId: number) => {
    try {
      setStartingModificationId(modificationId);
      await api.post(`/lead/modifications/${modificationId}/start/`);
      await fetchModifications(mockupId);
    } catch (error) {
      console.error("Error starting modification:", error);
    } finally {
      setStartingModificationId(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  if (searchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 flex flex-col gap-3">
      {/* Search input */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        disabled={searchLoading}
        placeholder="Search by name or code…"
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      />

      {/* Mockup list */}
      {mockups.length > 0 ? (
        <div className="flex flex-col gap-3">
          {mockups.map((mockup) => (
            <MockupCard
              key={mockup.id}
              mockup={mockup}
              modifications={modifications[mockup.id] || []}
              onStartMockup={startMockup}
              isStarting={startingMockupId === mockup.id}
              startingModificationId={startingModificationId}
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
              onShowDetail={(mockup) => {
                setSelectedMockup(mockup);
                setShowDetailOverlay(true);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          {searchTerm.trim()
            ? "No mockups found matching your search."
            : "No mockup requests found. New requests will appear here."}
        </div>
      )}

      {/* Load More */}
      {nextUrl && (
        <button
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loadingMore ? (
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
          ) : (
            "Load More"
          )}
        </button>
      )}

      {/* Detail Overlay */}
      {showDetailOverlay && selectedMockup && (
        <MockupDetailOverlay
          mockup={selectedMockup}
          modifications={modifications[selectedMockup.id] || []}
          onClose={() => {
            setShowDetailOverlay(false);
            setSelectedMockup(null);
          }}
          onStartMockup={startMockup}
          startingModificationId={startingModificationId}
          onStartModification={(id) => startModification(id, selectedMockup.id)}
          onShowSubmitOverlay={(m) => {
            setShowDetailOverlay(false);
            setSelectedMockup(m);
            setShowSubmitOverlay(true);
          }}
          onShowSubmitModificationOverlay={(m) => {
            setShowDetailOverlay(false);
            setSelectedModification(m);
            setShowSubmitModificationOverlay(true);
          }}
        />
      )}

      {/* Submit Mockup Overlay */}
      {showSubmitOverlay && selectedMockup && (
        <SubmitMockupOverlay
          mockup={selectedMockup}
          onClose={() => {
            setShowSubmitOverlay(false);
            setSelectedMockup(null);
            refreshMockups();
          }}
          onSuccess={() => {
            setShowSubmitOverlay(false);
            setSelectedMockup(null);
            refreshMockups();
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
            refreshMockups();
          }}
          onSuccess={() => {
            setShowSubmitModificationOverlay(false);
            setSelectedModification(null);
            refreshMockups();
          }}
        />
      )}
    </div>
  );
};

export default MockupPage;
