// TasksContent.tsx
import { useState, useEffect } from "react";
import { Scissors, Wrench, Truck, Settings, ChevronRight, AlertCircle, Clock, CheckCircle2, FileX, Loader2 } from "lucide-react";
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

  const taskCards = [
    {
      id: "cutting" as const,
      label: "Assign Cutting",
      description: "Assign CNC cutting tasks to operators",
      icon: Scissors,
      color: "blue",
      bgLight: "bg-blue-50 dark:bg-blue-900/10",
      borderLight: "border-blue-200 dark:border-blue-800/40",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      titleColor: "text-blue-800 dark:text-blue-300",
      descColor: "text-blue-600/80 dark:text-blue-300/80",
      chevronColor: "text-blue-400 dark:text-blue-600",
      statItems: [
        { show: stats.cutting.readyToAssign > 0, icon: CheckCircle2, label: `${stats.cutting.readyToAssign} Ready to assign`, bg: "bg-white/60 dark:bg-black/20", color: "text-blue-700 dark:text-blue-300" },
        { show: stats.cutting.awaitingPayment > 0, icon: Clock, label: `${stats.cutting.awaitingPayment} Awaiting payment`, bg: "bg-yellow-100 dark:bg-yellow-900/30", color: "text-yellow-700 dark:text-yellow-300" },
        { show: stats.cutting.noCncFile > 0, icon: FileX, label: `${stats.cutting.noCncFile} CNC file not found`, bg: "bg-red-100 dark:bg-red-900/30", color: "text-red-700 dark:text-red-300" },
      ],
      noTasks: stats.cutting.readyToAssign === 0 && stats.cutting.awaitingPayment === 0 && stats.cutting.noCncFile === 0,
      noTasksColor: "text-blue-600/60 dark:text-blue-400/60",
    },
    {
      id: "assembly" as const,
      label: "Assign Assembly",
      description: "Assign assembly tasks to team members",
      icon: Wrench,
      color: "green",
      bgLight: "bg-green-50 dark:bg-green-900/10",
      borderLight: "border-green-200 dark:border-green-800/40",
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      titleColor: "text-green-800 dark:text-green-300",
      descColor: "text-green-600/80 dark:text-green-300/80",
      chevronColor: "text-green-400 dark:text-green-600",
      statItems: [
        { show: stats.assembly.readyToAssign > 0, icon: CheckCircle2, label: `${stats.assembly.readyToAssign} Ready to assign`, bg: "bg-white/60 dark:bg-black/20", color: "text-green-700 dark:text-green-300" },
        { show: stats.assembly.stillCutting > 0, icon: Scissors, label: `${stats.assembly.stillCutting} Still in cutting`, bg: "bg-orange-100 dark:bg-orange-900/30", color: "text-orange-700 dark:text-orange-300" },
        { show: stats.assembly.awaitingPayment > 0, icon: Clock, label: `${stats.assembly.awaitingPayment} Awaiting payment`, bg: "bg-yellow-100 dark:bg-yellow-900/30", color: "text-yellow-700 dark:text-yellow-300" },
      ],
      noTasks: stats.assembly.readyToAssign === 0 && stats.assembly.stillCutting === 0 && stats.assembly.awaitingPayment === 0,
      noTasksColor: "text-green-600/60 dark:text-green-400/60",
    },
    {
      id: "delivery" as const,
      label: "Assign Delivery & Installation",
      description: "Schedule delivery and installation tasks",
      icon: Truck,
      color: "purple",
      bgLight: "bg-purple-50 dark:bg-purple-900/10",
      borderLight: "border-purple-200 dark:border-purple-800/40",
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
      titleColor: "text-purple-800 dark:text-purple-300",
      descColor: "text-purple-600/80 dark:text-purple-300/80",
      chevronColor: "text-purple-400 dark:text-purple-600",
      statItems: [
        { show: stats.delivery.ready > 0, icon: CheckCircle2, label: `${stats.delivery.ready} Ready to assign`, bg: "bg-white/60 dark:bg-black/20", color: "text-purple-700 dark:text-purple-300" },
        { show: stats.delivery.notAssigned > 0, icon: AlertCircle, label: `${stats.delivery.notAssigned} Not assembly completed`, bg: "bg-orange-100 dark:bg-orange-900/30", color: "text-orange-700 dark:text-orange-300" },
      ],
      noTasks: stats.delivery.totalContainers === 0,
      noTasksColor: "text-purple-600/60 dark:text-purple-400/60",
    },
    {
      id: "maintenance" as const,
      label: "Maintenance",
      description: "Assign maintenance tasks and schedules",
      icon: Settings,
      color: "orange",
      bgLight: "bg-orange-50 dark:bg-orange-900/10",
      borderLight: "border-orange-200 dark:border-orange-800/40",
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600 dark:text-orange-400",
      titleColor: "text-orange-800 dark:text-orange-300",
      descColor: "text-orange-600/80 dark:text-orange-300/80",
      chevronColor: "text-orange-400 dark:text-orange-600",
      statItems: [
        { show: stats.maintenance.total > 0, icon: AlertCircle, label: `${stats.maintenance.total} Pending maintenance tasks`, bg: "bg-white/60 dark:bg-black/20", color: "text-orange-700 dark:text-orange-300" },
      ],
      noTasks: stats.maintenance.total === 0,
      noTasksColor: "text-orange-600/60 dark:text-orange-400/60",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Assignment Cards */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Assign Tasks
          </h2>
        </div>

        <div className="space-y-3">
          {taskCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => setActiveOverlay(card.id)}
                className={`w-full flex flex-col p-4 rounded-xl border ${card.bgLight} ${card.borderLight} active:scale-[0.98] transition-all`}
              >
                <div className="flex items-center gap-4 w-full">
                  <div className={`p-2.5 rounded-xl bg-white dark:bg-zinc-800 shadow-sm ${card.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <span className={`font-semibold ${card.titleColor} text-sm`}>
                      {card.label}
                    </span>
                    <span className={`text-xs ${card.descColor} mt-0.5 block`}>
                      {card.description}
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${card.chevronColor} shrink-0`} />
                </div>

                {/* Sub-stats breakdown */}
                {!stats.loading && (
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium w-full">
                    {card.statItems.map((item, idx) =>
                      item.show ? (
                        <div key={idx} className={`flex items-center gap-1 ${item.bg} px-2 py-1 rounded ${item.color}`}>
                          <item.icon className="w-3 h-3" />
                          <span>{item.label}</span>
                        </div>
                      ) : null
                    )}
                    {card.noTasks && (
                      <div className={`${card.noTasksColor} italic`}>No tasks pending</div>
                    )}
                  </div>
                )}

                {stats.loading && (
                  <div className="mt-3 flex items-center gap-2 text-[11px]">
                    <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                    <span className="text-gray-400">Loading...</span>
                  </div>
                )}
              </button>
            );
          })}
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
