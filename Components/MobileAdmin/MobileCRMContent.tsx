"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  RefreshCw,
  Phone,
  Users,
  Filter,
  Calendar,
  Clock,
  Voicemail,
  Play,
  Pause,
  User,
  CheckCircle,
  XCircle,
  PhoneOutgoing,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api from "@/api";

interface CallLog {
  id: number;
  phone_number: string;
  customer_name?: string;
  status: "ANSWERED" | "MISSED" | "OUTGOING" | "REJECTED" | "BUSY";
  duration: number;
  date: string;
  recording_url?: string;
  transcript?: string | null;
  sales_name?: string;
  sales_id?: number;
  note?: string;
}

interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
}

interface Stats {
  total: number;
  answered: number;
  missed: number;
  outgoing: number;
  avgDuration: number;
}

type DateFilter = "today" | "yesterday" | "week" | "month" | "custom";

export default function MobileCRMContent({ onBack }: { onBack: () => void }) {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    answered: 0,
    missed: 0,
    outgoing: 0,
    avgDuration: 0,
  });

  // Filters
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Audio playback
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null
  );

  // Transcript expand
  const [expandedTranscriptId, setExpandedTranscriptId] = useState<number | null>(null);

  // Fetch users list
  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("/auth/users/");
      setUsers(res.data.results || res.data || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }, []);

  // Calculate date range based on filter
  const getDateRange = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (dateFilter) {
      case "today":
        return {
          date_from: today.toISOString().split("T")[0],
          date_to: tomorrow.toISOString().split("T")[0],
        };
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          date_from: yesterday.toISOString().split("T")[0],
          date_to: today.toISOString().split("T")[0],
        };
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        return {
          date_from: weekStart.toISOString().split("T")[0],
          date_to: tomorrow.toISOString().split("T")[0],
        };
      case "month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          date_from: monthStart.toISOString().split("T")[0],
          date_to: tomorrow.toISOString().split("T")[0],
        };
      case "custom":
        return {
          date_from: customDateFrom || today.toISOString().split("T")[0],
          date_to: customDateTo || tomorrow.toISOString().split("T")[0],
        };
      default:
        return {
          date_from: today.toISOString().split("T")[0],
          date_to: tomorrow.toISOString().split("T")[0],
        };
    }
  }, [dateFilter, customDateFrom, customDateTo]);

  // Fetch call logs
  const fetchCalls = useCallback(async () => {
    setLoading(true);
    try {
      const { date_from, date_to } = getDateRange();
      const params: any = {
        date_after: date_from,
        date_before: date_to,
        limit: 200,
        ordering: "-date",
      };

      if (selectedUser !== "all") {
        params.sales = selectedUser;
      }
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      const res = await api.get("/lead/call-logs/", { params });
      const results = res.data.results || res.data || [];
      setCalls(results);

      // Calculate stats
      const total = results.length;
      const answered = results.filter(
        (c: CallLog) => c.status === "ANSWERED"
      ).length;
      const missed = results.filter(
        (c: CallLog) => c.status === "MISSED"
      ).length;
      const outgoing = results.filter(
        (c: CallLog) => c.status === "OUTGOING"
      ).length;
      const avgDuration =
        total > 0
          ? Math.round(
              results.reduce((sum: number, c: CallLog) => sum + c.duration, 0) /
                total
            )
          : 0;

      setStats({ total, answered, missed, outgoing, avgDuration });
    } catch (err) {
      console.error("Failed to fetch calls:", err);
    } finally {
      setLoading(false);
    }
  }, [getDateRange, selectedUser, statusFilter]);

  useEffect(() => {
    fetchUsers();
    fetchCalls();
  }, [fetchUsers, fetchCalls]);

  const handleRefresh = () => {
    fetchCalls();
  };

  const toggleAudio = (callId: number, recordingUrl?: string) => {
    if (!recordingUrl) return;

    if (playingId === callId) {
      audioElement?.pause();
      setPlayingId(null);
      setAudioElement(null);
    } else {
      audioElement?.pause();
      const audio = new Audio(recordingUrl);
      audio.play();
      audio.onended = () => {
        setPlayingId(null);
        setAudioElement(null);
      };
      setAudioElement(audio);
      setPlayingId(callId);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ANSWERED":
        return <CheckCircle size={16} className="text-green-500" />;
      case "MISSED":
        return <XCircle size={16} className="text-red-500" />;
      case "OUTGOING":
        return <PhoneOutgoing size={16} className="text-blue-500" />;
      default:
        return <Phone size={16} className="text-gray-500" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "ANSWERED":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "MISSED":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "OUTGOING":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-lg font-semibold">CRM Management</h1>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700"
            disabled={loading}
          >
            <RefreshCw
              size={20}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 py-3 grid grid-cols-4 gap-2">
        <div className="bg-white dark:bg-zinc-800 rounded-xl p-3 border border-gray-200 dark:border-zinc-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
          <div className="text-lg font-bold">{stats.total}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-200 dark:border-green-800">
          <div className="text-xs text-green-600 dark:text-green-400">
            Answered
          </div>
          <div className="text-lg font-bold text-green-700 dark:text-green-400">
            {stats.answered}
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 border border-red-200 dark:border-red-800">
          <div className="text-xs text-red-600 dark:text-red-400">Missed</div>
          <div className="text-lg font-bold text-red-700 dark:text-red-400">
            {stats.missed}
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
          <div className="text-xs text-blue-600 dark:text-blue-400">Avg</div>
          <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
            {formatDuration(stats.avgDuration)}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-4 pb-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
        >
          <Filter size={16} />
          Filters
          {showFilters ? "▲" : "▼"}
        </button>

        {showFilters && (
          <div className="mt-3 p-3 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 space-y-3">
            {/* Date Filter */}
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                Date Range
              </label>
              <div className="flex gap-1 flex-wrap">
                {[
                  { key: "today", label: "Today" },
                  { key: "yesterday", label: "Yesterday" },
                  { key: "week", label: "This Week" },
                  { key: "month", label: "This Month" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setDateFilter(opt.key as DateFilter)}
                    className={`px-3 py-1.5 text-xs rounded-lg border ${
                      dateFilter === opt.key
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-gray-50 dark:bg-zinc-700 border-gray-200 dark:border-zinc-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                <button
                  onClick={() => setDateFilter("custom")}
                  className={`px-3 py-1.5 text-xs rounded-lg border ${
                    dateFilter === "custom"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-50 dark:bg-zinc-700 border-gray-200 dark:border-zinc-600"
                  }`}
                >
                  Custom
                </button>
              </div>

              {dateFilter === "custom" && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs rounded border border-gray-200 dark:border-zinc-600 dark:bg-zinc-700"
                  />
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs rounded border border-gray-200 dark:border-zinc-600 dark:bg-zinc-700"
                  />
                </div>
              )}
            </div>

            {/* Salesperson Filter */}
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                Salesperson
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-600 dark:bg-zinc-700"
              >
                <option value="all">All Salespersons</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.first_name || user.username}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-600 dark:bg-zinc-700"
              >
                <option value="all">All Statuses</option>
                <option value="ANSWERED">Answered</option>
                <option value="MISSED">Missed</option>
                <option value="OUTGOING">Outgoing</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <button
              onClick={fetchCalls}
              className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
            >
              Apply Filters
            </button>
          </div>
        )}
      </div>

      {/* Call Logs List */}
      <div className="px-4 pb-24 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-sm text-gray-500">Loading calls...</p>
          </div>
        ) : calls.length === 0 ? (
          <div className="text-center py-12">
            <Phone size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No calls found</p>
          </div>
        ) : (
          calls.map((call) => (
            <div
              key={call.id}
              className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(call.status)}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getStatusBg(
                          call.status
                        )}`}
                      >
                        {call.status}
                      </span>
                    </div>
                    <h3 className="font-semibold truncate">
                      {call.customer_name || call.phone_number}
                    </h3>
                    {call.customer_name && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {call.phone_number}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(call.date)}
                    </div>
                    <div className="mt-1">{formatDuration(call.duration)}</div>
                  </div>
                </div>

                {/* Salesperson */}
                {call.sales_name && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <User size={12} />
                    {call.sales_name}
                  </div>
                )}

                {/* Recording Player */}
                {call.recording_url && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-900/50 rounded-lg">
                    <button
                      onClick={() => toggleAudio(call.id, call.recording_url)}
                      className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center"
                    >
                      {playingId === call.id ? (
                        <Pause size={18} />
                      ) : (
                        <Play size={18} />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {playingId === call.id ? "Playing..." : "Recording"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDuration(call.duration)}
                      </div>
                    </div>
                    <Voicemail size={20} className="text-gray-400" />
                  </div>
                )}

                {/* Transcript */}
                {call.transcript && (
                  <div className="mt-2">
                    <button
                      onClick={() =>
                        setExpandedTranscriptId(
                          expandedTranscriptId === call.id ? null : call.id
                        )
                      }
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 dark:bg-zinc-900/50 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span className="flex items-center gap-2">
                        <FileText size={14} />
                        Transcript
                      </span>
                      {expandedTranscriptId === call.id ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                    {expandedTranscriptId === call.id && (
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-zinc-900/50 rounded-lg text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                        {call.transcript}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom spacer */}
      <div className="h-8" />
    </div>
  );
}
