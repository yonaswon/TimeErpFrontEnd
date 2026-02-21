// TasksContent.tsx
import { useState, useEffect } from "react";
import { Scissors, Wrench, Truck, Settings, ChevronRight, AlertCircle, Clock, CheckCircle2, FileX } from "lucide-react";
import { AssignCuttingOverlay } from "./AssignCutting/AssignCuttingOverlay";
import { LatestAssigned } from "./LatestAssigned";
import { AssignAssemblyOverlay } from "./AssignAssembly/AssignAssemblyOverlay";
import { DandIOverlay } from "./AssignDandI/DandIOverlay";
import { AssignMaintenanceOverlay } from "./AssignMaintenanceOverlay";
import api from "@/api";

interface TaskStats {
  cutting: {
    readyToAssign: number;
    awaitingPayment: number;
    noCncFile: number;
  };
  assembly: {
    readyToAssign: number;
    stillCutting: number;
    awaitingPayment: number;
  };
  delivery: {
    totalContainers: number;
    ready: number;
    notAssigned: number;
  };
  maintenance: {
    total: number;
  };
  loading: boolean;
}

export const TasksContent = () => {
  const [activeOverlay, setActiveOverlay] = useState<
    "cutting" | "assembly" | "delivery" | "maintenance" | null
  >(null);

  const [stats, setStats] = useState<TaskStats>({
    cutting: { readyToAssign: 0, awaitingPayment: 0, noCncFile: 0 },
    assembly: { readyToAssign: 0, stillCutting: 0, awaitingPayment: 0 },
    delivery: { totalContainers: 0, ready: 0, notAssigned: 0 },
    maintenance: { total: 0 },
    loading: true,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch Cutting Stats
      const unassignedCuttingRes = await api.get('/api/cuttingfiles/?status=NOT-ASSIGNED').catch(() => ({ data: { results: [] } }));
      const noCncFileRes = await api.get('/api/orders/?order_status=PRE-CONFIRMED&has_cutting_file=false&p=1').catch(() => ({ data: { count: 0 } }));

      const unassignedFiles = unassignedCuttingRes.data.results || [];
      const cuttingReady = unassignedFiles.filter((f: any) => f.orders.every((o: any) => o.order_status === "PRE-CONFIRMED")).length;
      const cuttingPayment = unassignedFiles.filter((f: any) => f.orders.some((o: any) => o.order_status === "PRE-ACCEPTED")).length;

      // Fetch Assembly Stats
      const assemblyReadyRes = await api.get('/api/orders/?order_status=CNC-COMPLETED&has_cutting_file=true&has_assembly_assign=false&p=1').catch(() => ({ data: { count: 0 } }));
      const assemblyCuttingRes = await api.get('/api/orders/?order_status=CNC-STARTED&has_cutting_file=true&has_assembly_assign=false&p=1').catch(() => ({ data: { count: 0 } }));
      const assemblyPaymentRes = await api.get('/api/orders/?order_status=PRE-ACCEPTED&has_cutting_file=true&has_assembly_assign=false&p=1').catch(() => ({ data: { count: 0 } }));

      // Fetch Delivery Stats
      const deliveryRes = await api.get('/api/order-container/?is_assigned=false&p=1').catch(() => ({ data: { count: 0, results: [] } }));
      const deliveryContainers = deliveryRes.data.results || [];
      const deliveryReady = deliveryContainers.filter((c: any) => c.orders.every((o: any) => o.order_status === "ASSEMBLY-COMPLETED")).length;
      const deliveryTotal = deliveryRes.data.count || 0;

      // Fetch Maintenance Stats
      const maintenanceRes = await api.get('/api/maintenance/?status=NA&p=1').catch(() => ({ data: { count: 0 } }));

      setStats({
        cutting: {
          readyToAssign: cuttingReady,
          awaitingPayment: cuttingPayment,
          noCncFile: noCncFileRes.data.count || 0,
        },
        assembly: {
          readyToAssign: assemblyReadyRes.data.count || 0,
          stillCutting: assemblyCuttingRes.data.count || 0,
          awaitingPayment: assemblyPaymentRes.data.count || 0,
        },
        delivery: {
          totalContainers: deliveryTotal,
          ready: deliveryReady,
          notAssigned: deliveryTotal - deliveryReady,
        },
        maintenance: {
          total: maintenanceRes.data.count || 0,
        },
        loading: false,
      });

    } catch {
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Assignment Cards */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Assign Tasks
          </h2>
        </div>

        <div className="space-y-3">

          {/* ASSIGN CUTTING */}
          <button
            onClick={() => setActiveOverlay("cutting")}
            className="w-full flex flex-col p-4 rounded-xl border bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/40 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4 w-full">
              <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 shadow-sm text-blue-600 dark:text-blue-400">
                <Scissors className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <span className="font-semibold text-blue-800 dark:text-blue-300">
                  Assign Cutting
                </span>
                <span className="text-xs text-blue-600/80 dark:text-blue-300/80 mt-0.5 block">
                  Assign CNC cutting tasks to operators
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-400 dark:text-blue-600" />
            </div>

            {/* Sub-stats breakdown */}
            {!stats.loading && (
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium w-full">
                {stats.cutting.readyToAssign > 0 && (
                  <div className="flex items-center gap-1 bg-white/60 dark:bg-black/20 px-2 py-1 rounded text-blue-700 dark:text-blue-300">
                    <CheckCircle2 className="w-3 h-3" />
                    <span><span className="font-bold">{stats.cutting.readyToAssign}</span> Ready to assign</span>
                  </div>
                )}
                {stats.cutting.awaitingPayment > 0 && (
                  <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded text-yellow-700 dark:text-yellow-300">
                    <Clock className="w-3 h-3" />
                    <span><span className="font-bold">{stats.cutting.awaitingPayment}</span> Awaiting payment</span>
                  </div>
                )}
                {stats.cutting.noCncFile > 0 && (
                  <div className="flex items-center gap-1 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded text-red-700 dark:text-red-300">
                    <FileX className="w-3 h-3" />
                    <span><span className="font-bold">{stats.cutting.noCncFile}</span> CNC file not found</span>
                  </div>
                )}
                {stats.cutting.readyToAssign === 0 && stats.cutting.awaitingPayment === 0 && stats.cutting.noCncFile === 0 && (
                  <div className="text-blue-600/60 dark:text-blue-400/60 italic">No tasks pending</div>
                )}
              </div>
            )}
          </button>

          {/* ASSIGN ASSEMBLY */}
          <button
            onClick={() => setActiveOverlay("assembly")}
            className="w-full flex flex-col p-4 rounded-xl border bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/40 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4 w-full">
              <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 shadow-sm text-green-600 dark:text-green-400">
                <Wrench className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <span className="font-semibold text-green-800 dark:text-green-300">
                  Assign Assembly
                </span>
                <span className="text-xs text-green-600/80 dark:text-green-300/80 mt-0.5 block">
                  Assign assembly tasks to team members
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-green-400 dark:text-green-600" />
            </div>

            {/* Sub-stats breakdown */}
            {!stats.loading && (
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium w-full">
                {stats.assembly.readyToAssign > 0 && (
                  <div className="flex items-center gap-1 bg-white/60 dark:bg-black/20 px-2 py-1 rounded text-green-700 dark:text-green-300">
                    <CheckCircle2 className="w-3 h-3" />
                    <span><span className="font-bold">{stats.assembly.readyToAssign}</span> Ready to assign</span>
                  </div>
                )}
                {stats.assembly.stillCutting > 0 && (
                  <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded text-orange-700 dark:text-orange-300">
                    <Scissors className="w-3 h-3" />
                    <span><span className="font-bold">{stats.assembly.stillCutting}</span> Still in cutting</span>
                  </div>
                )}
                {stats.assembly.awaitingPayment > 0 && (
                  <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded text-yellow-700 dark:text-yellow-300">
                    <Clock className="w-3 h-3" />
                    <span><span className="font-bold">{stats.assembly.awaitingPayment}</span> Awaiting payment</span>
                  </div>
                )}
                {stats.assembly.readyToAssign === 0 && stats.assembly.stillCutting === 0 && stats.assembly.awaitingPayment === 0 && (
                  <div className="text-green-600/60 dark:text-green-400/60 italic">No tasks pending</div>
                )}
              </div>
            )}
          </button>

          {/* ASSIGN DELIVERY & INSTALLATION */}
          <button
            onClick={() => setActiveOverlay("delivery")}
            className="w-full flex flex-col p-4 rounded-xl border bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800/40 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4 w-full">
              <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 shadow-sm text-purple-600 dark:text-purple-400">
                <Truck className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <span className="font-semibold text-purple-800 dark:text-purple-300">
                  Assign Delivery & Installation
                </span>
                <span className="text-xs text-purple-600/80 dark:text-purple-300/80 mt-0.5 block">
                  Schedule delivery and installation tasks
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-400 dark:text-purple-600" />
            </div>

            {/* Sub-stats breakdown */}
            {!stats.loading && (
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium w-full">
                {stats.delivery.ready > 0 && (
                  <div className="flex items-center gap-1 bg-white/60 dark:bg-black/20 px-2 py-1 rounded text-purple-700 dark:text-purple-300">
                    <CheckCircle2 className="w-3 h-3" />
                    <span><span className="font-bold">{stats.delivery.ready}</span> Ready to assign</span>
                  </div>
                )}
                {stats.delivery.notAssigned > 0 && (
                  <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded text-orange-700 dark:text-orange-300">
                    <AlertCircle className="w-3 h-3" />
                    <span><span className="font-bold">{stats.delivery.notAssigned}</span> Not assembly completed</span>
                  </div>
                )}
                {stats.delivery.totalContainers === 0 && (
                  <div className="text-purple-600/60 dark:text-purple-400/60 italic">No tasks pending</div>
                )}
              </div>
            )}
          </button>

          {/* ASSIGN MAINTENANCE */}
          <button
            onClick={() => setActiveOverlay("maintenance")}
            className="w-full flex flex-col p-4 rounded-xl border bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800/40 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4 w-full">
              <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 shadow-sm text-orange-600 dark:text-orange-400">
                <Settings className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <span className="font-semibold text-orange-800 dark:text-orange-300">
                  Maintenance
                </span>
                <span className="text-xs text-orange-600/80 dark:text-orange-300/80 mt-0.5 block">
                  Assign maintenance tasks and schedules
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-orange-400 dark:text-orange-600" />
            </div>

            {/* Sub-stats breakdown */}
            {!stats.loading && (
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium w-full">
                {stats.maintenance.total > 0 ? (
                  <div className="flex items-center gap-1 bg-white/60 dark:bg-black/20 px-2 py-1 rounded text-orange-700 dark:text-orange-300">
                    <AlertCircle className="w-3 h-3" />
                    <span><span className="font-bold">{stats.maintenance.total}</span> Pending maintenance tasks</span>
                  </div>
                ) : (
                  <div className="text-orange-600/60 dark:text-orange-400/60 italic">No tasks pending</div>
                )}
              </div>
            )}
          </button>

        </div>
      </div>

      {/* Latest Assigned Section */}
      <LatestAssigned />

      {/* Overlays */}
      {activeOverlay === "cutting" && (
        <AssignCuttingOverlay
          onClose={() => {
            setActiveOverlay(null);
            fetchStats();
          }}
        />
      )}

      {activeOverlay === "assembly" && (
        <AssignAssemblyOverlay
          onClose={() => setActiveOverlay(null)}
          onSuccess={() => {
            setActiveOverlay(null);
            fetchStats();
          }}
        />
      )}

      {activeOverlay === "delivery" && (
        <DandIOverlay
          onClose={() => setActiveOverlay(null)}
          onSuccess={() => {
            setActiveOverlay(null);
            fetchStats();
          }}
        />
      )}

      {activeOverlay === "maintenance" && (
        <AssignMaintenanceOverlay
          onClose={() => setActiveOverlay(null)}
          onSuccess={() => {
            setActiveOverlay(null);
            fetchStats();
          }}
        />
      )}
    </div>
  );
};
