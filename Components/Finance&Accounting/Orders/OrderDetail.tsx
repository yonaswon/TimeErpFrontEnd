import { useState, useEffect } from "react";
import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  FileText,
  CreditCard,
  CheckCircle,
  XCircle,
  Package,
  Wrench,
  Truck,
  Settings,
  DollarSign,
  Clock,
  AlertCircle,
  Download,
  Image,
  Loader,
  Layers,
  ChevronRight,
  Receipt,
  Info,
  Upload,
  Plus,
  Pencil,
} from "lucide-react";
import api from "@/api";
import PityCostsSection from "./PityCost/PityCostsSection";
import jsPDF from "jspdf";

interface OrderDetailProps {
  order: any;
  onClose: () => void;
}

const OrderDetail = ({ order, onClose }: OrderDetailProps) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "orders" | "payments" | "pity-costs" | "documents"
  >("overview");
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [uploadingPaymentId, setUploadingPaymentId] = useState<number | null>(null);

  // Document fields state
  const [docFields, setDocFields] = useState({
    folder_no: order.folder_no || "",
    pad_no: order.pad_no || "",
    receipt_no: order.receipt_no || "",
    invoice_no: order.invoice_no || "",
  });
  const [docSaving, setDocSaving] = useState(false);
  const [docSaved, setDocSaved] = useState(false);

  // Upload invoice/additional image for a payment
  const handleImageUpload = async (
    paymentId: number,
    field: "invoice_image" | "additional_image",
    file: File
  ) => {
    try {
      setUploadingPaymentId(paymentId);
      const formData = new FormData();
      formData.append(field, file);
      await api.patch(`/finance/payment/${paymentId}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchPayments();
    } catch (err: any) {
      console.error("Upload failed:", err);
      alert(err.response?.data?.detail || "Failed to upload image");
    } finally {
      setUploadingPaymentId(null);
    }
  };

  // Fetch payments for this order
  const fetchPayments = async () => {
    try {
      setPaymentsLoading(true);
      setPaymentsError(null);
      const response = await api.get(
        `/finance/payment/?order_container=${order.id}`
      );
      setPayments(response.data.results || []);
    } catch (error: any) {
      console.error("Failed to fetch payments:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load payment information";
      setPaymentsError(errorMessage);
    } finally {
      setPaymentsLoading(false);
    }
  };

  // Save document fields
  const saveDocFields = async () => {
    try {
      setDocSaving(true);
      setDocSaved(false);
      await api.patch(`/api/order-container/${order.id}/`, docFields);
      // Update the local order object
      order.folder_no = docFields.folder_no;
      order.pad_no = docFields.pad_no;
      order.receipt_no = docFields.receipt_no;
      order.invoice_no = docFields.invoice_no;
      setDocSaved(true);
      setTimeout(() => setDocSaved(false), 2000);
    } catch (err: any) {
      console.error("Failed to save:", err);
      alert(err.response?.data?.detail || "Failed to save document info");
    } finally {
      setDocSaving(false);
    }
  };

  // Generate PDF
  const generatePDF = async () => {
    // Fetch payments if not already loaded
    let paymentsList = payments;
    if (paymentsList.length === 0) {
      try {
        const res = await api.get(`/finance/payment/?order_container=${order.id}`);
        paymentsList = res.data.results || [];
      } catch (err) {
        console.error(err);
      }
    }

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const w = doc.internal.pageSize.getWidth();
    let y = 15;
    const lm = 15; // left margin
    const rm = w - 15; // right margin x

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("ORDER SUMMARY", w / 2, y, { align: "center" });
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, w / 2, y, { align: "center" });
    y += 6;
    doc.setDrawColor(200);
    doc.line(lm, y, rm, y);
    y += 6;

    // Client Info
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Client Information", lm, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const clientInfo = [
      ["Client", order.client || "N/A"],
      ["Contact", order.contact || "N/A"],
      ["Location", order.location || "N/A"],
      ["Delivery Date", order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : "N/A"],
      ["Invoice", order.invoice ? "Yes" : "No"],
      ["Created", order.created_at ? new Date(order.created_at).toLocaleDateString() : "N/A"],
    ];
    clientInfo.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, lm, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), lm + 30, y);
      y += 4.5;
    });
    y += 3;

    // Document Numbers
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Document Numbers", lm, y);
    y += 5;
    doc.setFontSize(9);
    const docInfo = [
      ["Folder No", order.folder_no || "-"],
      ["Pad No", order.pad_no || "-"],
      ["Receipt No", order.receipt_no || "-"],
      ["Invoice No", order.invoice_no || "-"],
    ];
    docInfo.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, lm, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), lm + 30, y);
      y += 4.5;
    });
    y += 3;

    // Orders Table
    doc.setDrawColor(200);
    doc.line(lm, y, rm, y);
    y += 5;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Orders", lm, y);
    y += 5;
    doc.setFontSize(8);
    // Table header
    doc.setFont("helvetica", "bold");
    doc.text("Order Code", lm, y);
    doc.text("Name", lm + 30, y);
    doc.text("Status", lm + 90, y);
    doc.text("Price", lm + 135, y);
    y += 1;
    doc.line(lm, y, rm, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    (order.orders || []).forEach((o: any) => {
      // Auto page break if needed
      if (y > 270) {
        doc.addPage();
        y = 15;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`ORD-${o.order_code}`, lm, y);
      doc.setFont("helvetica", "normal");
      doc.text(o.order_name || "-", lm + 30, y);
      doc.text((o.order_status || "").replace(/-/g, " "), lm + 90, y);
      doc.text(formatCurrency(o.price), lm + 135, y);
      y += 5;

      // Add BOM Sizes for the order
      if (o.boms && o.boms.length > 0) {
        if (y > 270) { doc.addPage(); y = 15; }
        doc.setFontSize(7);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100);
        doc.text("Required BOM:", lm + 5, y);
        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
        y += 4;

        o.boms.forEach((b: any) => {
          if (y > 280) { doc.addPage(); y = 15; }

          const matName = b.material?.name || "Unknown";
          const mType = b.material?.type || "";
          let txt = "";

          if (mType === "A") {
            const w = parseFloat(b.width || 0).toFixed(2);
            const h = parseFloat(b.height || 0).toFixed(2);
            txt = `• ${matName} (${w} \u00d7 ${h} m)`;
          } else {
            // Length or Piece, no width/height, just qty
            txt = `• ${matName} - Qty: ${Number(b.amount || 0).toFixed(2)}`;
          }

          doc.text(txt, lm + 10, y);
          y += 4;
        });
        y += 1;
        doc.setFontSize(8);
      }

      // Add Releases (L&P Materials) for the order
      const lpReleases = (o.releases || []).filter((r: any) => r.material_type !== 'A');
      if (lpReleases.length > 0) {
        if (y > 270) { doc.addPage(); y = 15; }
        doc.setFontSize(7);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100);
        doc.text("Released L&P:", lm + 5, y);
        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
        y += 4;

        lpReleases.forEach((r: any) => {
          if (y > 280) { doc.addPage(); y = 15; }
          const txt = `• ${r.material_name || "Unknown"} - Qty: ${Number(r.amount || 0).toFixed(2)}`;
          doc.text(txt, lm + 10, y);
          y += 4;
        });
        y += 1;
        doc.setFontSize(8);
      }

      // Add Cutting Files (Areal Materials) for the order
      if (o.cutting_files && o.cutting_files.length > 0) {
        if (y > 270) { doc.addPage(); y = 15; }
        doc.setFontSize(7);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100);
        doc.text("Cutting (Areal):", lm + 5, y);
        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
        y += 4;

        o.cutting_files.forEach((c: any) => {
          if (y > 280) { doc.addPage(); y = 15; }
          const matName = c.on?.material?.name || c.old_material?.name || "Unknown Sheet";
          const dStr = c.date ? new Date(c.date).toLocaleDateString() : "-";
          const txt = `• ${matName} [${(c.status || "").replace(/-/g, " ")}]`;
          doc.text(txt, lm + 10, y);
          y += 4;
        });
        y += 1;
        doc.setFontSize(8);
      }

      if (o.boms?.length > 0 || lpReleases?.length > 0 || o.cutting_files?.length > 0) {
        y += 1;
      } else {
        y += 3;
      }
    });
    y += 3;

    // Payment Summary
    doc.setDrawColor(200);
    doc.line(lm, y, rm, y);
    y += 5;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Payment Summary", lm, y);
    y += 5;
    doc.setFontSize(9);
    const totalPaid = paymentsList.reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
    const paymentSummary = [
      ["Full Payment", formatCurrency(order.full_payment)],
      ["Advance", formatCurrency(order.advance_payment)],
      ["Total Paid", formatCurrency(totalPaid)],
      ["Remaining", formatCurrency(order.remaining_payment)],
    ];
    paymentSummary.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, lm, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), lm + 30, y);
      y += 4.5;
    });
    y += 3;

    // Individual Payments
    if (paymentsList.length > 0) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("Type", lm, y);
      doc.text("Method", lm + 30, y);
      doc.text("Amount", lm + 65, y);
      doc.text("Status", lm + 100, y);
      doc.text("Date", lm + 130, y);
      y += 1;
      doc.line(lm, y, rm, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      paymentsList.forEach((p: any) => {
        if (y > 270) {
          doc.addPage();
          y = 15;
        }
        const reason = ({ PRE: "Advance", REM: "Remaining", FULL: "Full" } as any)[p.reason] || p.reason;
        const status = p.status === "C" ? "Confirmed" : p.status === "R" ? "Rejected" : "Pending";
        doc.text(reason, lm, y);
        doc.text(p.method || "-", lm + 30, y);
        doc.text(formatCurrency(p.amount), lm + 65, y);
        doc.text(status, lm + 100, y);
        doc.text(p.created_at ? new Date(p.created_at).toLocaleDateString() : "-", lm + 130, y);
        y += 4.5;
      });
    }

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Order Container #${order.id} — ${order.client}`, w / 2, 290, { align: "center" });

    // Try multiple download approaches for Telegram Mini App compatibility
    try {
      const fileName = `Order_${order.id}_${order.client?.replace(/\s+/g, "_")}.pdf`;
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);

      // If inside Telegram WebApp, try opening the BLOB url in a new tab 
      // or opening it directly since standard downloads are often blocked
      if ((window as any).Telegram?.WebApp) {
        // Try creating an anchor tag first
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();

        // As a fallback in TG WebApp, also open the window
        setTimeout(() => {
          document.body.removeChild(link);
          window.open(url, "_blank");
        }, 100);
      } else {
        // Standard Web Approach
        doc.save(fileName);
      }
    } catch (err) {
      console.error("PDF download failed:", err);
      doc.save(`Order_${order.id}_${order.client?.replace(/\s+/g, "_")}.pdf`);
    }
  };

  // Add import at the top

  // Update the tabs array to include pity-costs

  // Add the tab content for pity-costs

  useEffect(() => {
    if (activeTab === "payments") {
      fetchPayments();
    }
  }, [order.id, activeTab]);

  // --- Formatters ---
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  // --- Helpers ---
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "C":
        return <CheckCircle size={18} className="text-emerald-500" />;
      case "P":
        return <Clock size={18} className="text-amber-500" />;
      case "R":
        return <XCircle size={18} className="text-rose-500" />;
      default:
        return <AlertCircle size={18} className="text-gray-400" />;
    }
  };

  const getReasonText = (reason: string) => {
    const map: Record<string, string> = {
      PRE: "Advance Payment",
      REM: "Remaining Payment",
      FULL: "Full Payment",
      SALES: "Product Sales",
      MAINTENANCE: "Maintenance",
    };
    return map[reason] || reason;
  };

  const getOrderStatusColor = (status: string) => {
    if (!status)
      return "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400";
    if (status.includes("CONFIRMED") || status.includes("COMPLETED")) {
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
    }
    if (status.includes("STARTED") || status.includes("ACCEPTED")) {
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    }
    if (status.includes("PRE")) {
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800";
    }
    return "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 border-gray-200 dark:border-zinc-700";
  };

  // --- Components ---
  const InfoRow = ({ icon: Icon, label, value, subValue }: any) => (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
      <div className="mt-1 p-2 bg-gray-100 dark:bg-zinc-800 rounded-md text-gray-500 dark:text-gray-400">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
          {value || "N/A"}
        </p>
        {subValue && (
          <p className="text-sm text-gray-500 dark:text-gray-500">{subValue}</p>
        )}
      </div>
    </div>
  );

  const SectionTitle = ({ title, icon: Icon }: any) => (
    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-zinc-800 pb-2">
      {Icon && <Icon size={16} className="text-blue-600 dark:text-blue-400" />}
      {title}
    </h3>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-zinc-800">
        {/* Header - Always Visible */}
        <div className="shrink-0 p-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-start">
          <div className="flex gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hidden sm:block">
              <Package size={28} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {order.client}
                </h2>
                <span
                  className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${getOrderStatusColor(
                    order.orders?.[0]?.order_status
                  )}`}
                >
                  {order.orders?.[0]?.order_status?.replace(/-/g, " ") ||
                    "UNKNOWN"}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  {order.orders
                    ?.slice(0, 3)
                    .map((item: any) => (
                      <span
                        key={item.order_code}
                        className="font-mono text-xs bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded"
                      >
                        ORD-{item.order_code}{item.order_name ? ` - ${item.order_name}` : ''}
                      </span>
                    ))
                    .reduce(
                      (acc: any[], x: any) =>
                        acc.length ? [...acc, " ", x] : [x],
                      []
                    )}
                  {order.orders?.length > 3 && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 ml-1">
                      +{order.orders.length - 3} more
                    </span>
                  )}
                </span>
                <span>•</span>
                <span>{formatDate(order.created_at)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="shrink-0 px-6 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
          <div className="flex gap-6 overflow-x-auto py-1">
            {[
              { id: "overview", label: "Overview", icon: Info },
              {
                id: "orders",
                label: `Sub-Orders (${order.orders?.length || 0})`,
                icon: Layers,
              },
              { id: "payments", label: "Payments", icon: CreditCard },
              { id: "documents", label: "Docs", icon: FileText },
              { id: "pity-costs", label: "Pity Costs", icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors shrink-0 whitespace-nowrap ${activeTab === tab.id
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
              >
                <tab.icon size={16} className="shrink-0" />
                <span className="truncate max-w-[150px]">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50/30 dark:bg-zinc-950/30 p-6">
          {/* --- TAB: OVERVIEW --- */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
              <div className="space-y-8">
                {/* Client Info Grid */}
                <div>
                  <SectionTitle title="Client Information" icon={User} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <InfoRow icon={User} label="Name" value={order.client} />
                    <InfoRow
                      icon={Phone}
                      label="Contact"
                      value={order.contact}
                    />
                    <InfoRow
                      icon={MapPin}
                      label="Location"
                      value={order.location}
                      className="sm:col-span-2"
                    />
                  </div>
                </div>

                {/* Services */}
                <div>
                  <SectionTitle title="Services & Complexity" icon={Settings} />
                  <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-2">
                      <div
                        className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2 ${order.instalation_service
                          ? "bg-green-100 text-green-600 dark:bg-green-900/20"
                          : "bg-gray-100 text-gray-400 dark:bg-zinc-800"
                          }`}
                      >
                        <Wrench size={20} />
                      </div>
                      <p className="text-sm font-medium dark:text-white">
                        Installation
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.instalation_service ? "Included" : "No"}
                      </p>
                    </div>
                    <div className="text-center p-2">
                      <div
                        className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2 ${order.delivery_service
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20"
                          : "bg-gray-100 text-gray-400 dark:bg-zinc-800"
                          }`}
                      >
                        <Truck size={20} />
                      </div>
                      <p className="text-sm font-medium dark:text-white">
                        Delivery
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.delivery_service ? "Included" : "No"}
                      </p>
                    </div>
                    <div className="text-center p-2">
                      <div className="mx-auto w-10 h-10 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/20 flex items-center justify-center mb-2">
                        <Settings size={20} />
                      </div>
                      <p className="text-sm font-medium dark:text-white">
                        Difficulty
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.order_difficulty || "Standard"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Logistics */}
                <div>
                  <SectionTitle title="Logistics & Finance" icon={Receipt} />
                  <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
                    <InfoRow
                      icon={Calendar}
                      label="Delivery Date"
                      value={formatDate(order.delivery_date)}
                    />
                    <div className="border-t border-gray-100 dark:border-zinc-800"></div>
                    <InfoRow
                      icon={FileText}
                      label="Invoice Status"
                      value={order.invoice ? "Invoice Required" : "No Invoice"}
                    />
                    <div className="border-t border-gray-100 dark:border-zinc-800"></div>
                    <div className="flex items-center gap-3 p-4 bg-blue-50/50 dark:bg-blue-900/10">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md">
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase">
                          Total Amount
                        </p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(order.full_payment)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes & Special Req */}
                {(order.special_requerment || order.note) && (
                  <div>
                    <SectionTitle
                      title="Notes & Requirements"
                      icon={AlertCircle}
                    />
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg p-4 space-y-3">
                      {order.special_requerment && (
                        <div>
                          <p className="text-xs font-bold text-amber-800 dark:text-amber-500 uppercase">
                            Special Requirement
                          </p>
                          <p className="text-sm text-gray-800 dark:text-gray-300 mt-1">
                            {order.special_requerment}
                          </p>
                        </div>
                      )}
                      {order.note && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase">
                            General Note
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 italic">
                            "{order.note}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- TAB: ORDERS --- */}
          {activeTab === "orders" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {!order.orders?.length ? (
                <div className="text-center py-12 text-gray-500">
                  No sub-orders found.
                </div>
              ) : (
                order.orders.map((item: any) => (
                  <div
                    key={item.order_code}
                    className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                  >
                    {/* Item Header */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500">
                          <Package size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white">
                            ORD-{item.order_code}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {item.design_type}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono font-medium text-gray-900 dark:text-gray-200">
                          {formatCurrency(item.price)}
                        </span>
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getOrderStatusColor(
                            item.order_status
                          )}`}
                        >
                          {item.order_status.replace(/-/g, " ")}
                        </span>
                      </div>
                    </div>

                    {/* Item Details */}
                    <div className="p-4 bg-gray-50/50 dark:bg-zinc-900/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">
                          Components
                        </span>
                        <div className="flex gap-2 text-gray-700 dark:text-gray-300">
                          <span className="bg-white dark:bg-zinc-800 px-2 py-1 rounded border border-gray-200 dark:border-zinc-700">
                            BOM: {item.boms?.length || 0}
                          </span>
                          <span className="bg-white dark:bg-zinc-800 px-2 py-1 rounded border border-gray-200 dark:border-zinc-700">
                            Files: {item.cutting_files?.length || 0}
                          </span>
                        </div>
                      </div>

                      {/* Mockup Preview */}
                      {item.mockup?.mockup_image && (
                        <div className="flex items-center gap-3">
                          <img
                            src={item.mockup.mockup_image}
                            alt="Mockup"
                            onClick={() =>
                              window.open(item.mockup.mockup_image, "_blank")
                            }
                            className="w-12 h-12 object-cover rounded bg-white border border-gray-200 dark:border-zinc-700 cursor-pointer hover:scale-105 transition-transform"
                          />
                          <div>
                            <p className="text-xs font-medium text-gray-900 dark:text-white">
                              Mockup
                            </p>
                            <p
                              className="text-[10px] text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                              onClick={() =>
                                window.open(item.mockup.mockup_image, "_blank")
                              }
                            >
                              View Image
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Modification Preview */}
                      {item.mockup_modification?.mockup_image && (
                        <div className="flex items-center gap-3">
                          <img
                            src={item.mockup_modification.mockup_image}
                            alt="Modification"
                            onClick={() =>
                              window.open(
                                item.mockup_modification.mockup_image,
                                "_blank"
                              )
                            }
                            className="w-12 h-12 object-cover rounded bg-white border border-amber-200 dark:border-amber-900 cursor-pointer hover:scale-105 transition-transform"
                          />
                          <div>
                            <p className="text-xs font-medium text-amber-700 dark:text-amber-500">
                              Modified
                            </p>
                            <p
                              className="text-[10px] text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                              onClick={() =>
                                window.open(
                                  item.mockup_modification.mockup_image,
                                  "_blank"
                                )
                              }
                            >
                              View Change
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "pity-costs" && (
            <div className="animate-in fade-in duration-300">
              <PityCostsSection orderContainerId={order.id} />
            </div>
          )}

          {/* --- TAB: PAYMENTS --- */}
          {activeTab === "payments" && (
            <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
              {paymentsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Loader className="animate-spin h-8 w-8 mb-4 text-blue-500" />
                  <p>Loading financial data...</p>
                </div>
              ) : paymentsError ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-lg text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
                  <p className="text-red-700 dark:text-red-400 mb-4">
                    {paymentsError}
                  </p>
                  <button
                    onClick={fetchPayments}
                    className="text-sm font-medium text-red-600 underline"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  {/* Payment Summary Header */}
                  <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 mb-6">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                      <DollarSign size={16} className="text-blue-600 dark:text-blue-400" />
                      Payment Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Full Payment</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(order.full_payment)}</p>
                      </div>
                      <div className="text-center p-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Advance Paid</p>
                        <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{formatCurrency(order.advance_payment)}</p>
                      </div>
                      <div className="text-center p-3 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Paid</p>
                        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                          {formatCurrency(payments.reduce((sum, p) => sum + parseFloat(p.amount), 0))}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-rose-50/50 dark:bg-rose-900/10 rounded-lg">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Remaining</p>
                        <p className="text-lg font-bold text-rose-700 dark:text-rose-400">{formatCurrency(order.remaining_payment)}</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    {(() => {
                      const fullPay = parseFloat(order.full_payment || '0');
                      const totalPaid = payments.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
                      const pct = fullPay > 0 ? Math.min((totalPaid / fullPay) * 100, 100) : 0;
                      return (
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{Math.round(pct)}% Paid</span>
                            <span>{formatCurrency(totalPaid)} / {formatCurrency(fullPay)}</span>
                          </div>
                          <div className="h-2 w-full bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Payment Cards */}
                  {payments.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-lg border border-dashed border-gray-300 dark:border-zinc-700">
                      <CreditCard className="mx-auto h-12 w-12 text-gray-300 dark:text-zinc-600 mb-3" />
                      <p className="text-gray-500">No payment history recorded.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-5 relative overflow-hidden group hover:shadow-md transition-shadow"
                        >
                          {/* Status Indicator Line */}
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-1 ${payment.status === "C"
                              ? "bg-emerald-500"
                              : payment.status === "R"
                                ? "bg-rose-500"
                                : "bg-amber-500"
                              }`}
                          />

                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                                  {getReasonText(payment.reason)}
                                </h4>
                                {getStatusIcon(payment.status)}
                              </div>
                              <p className="text-sm text-gray-500 flex items-center gap-2">
                                <Calendar size={14} />{" "}
                                {formatDate(payment.created_at)}
                              </p>

                              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-xs text-gray-400 uppercase tracking-wider">
                                    Method
                                  </span>
                                  <p className="font-medium text-gray-700 dark:text-gray-300">
                                    {payment.method}{" "}
                                    {payment.account ? `(#${payment.account})` : ""}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-400 uppercase tracking-wider">
                                    Wallet
                                  </span>
                                  <p className="font-medium text-gray-700 dark:text-gray-300">
                                    {payment.wallet?.name || "N/A"}
                                  </p>
                                </div>
                                {payment.note && (
                                  <div className="col-span-2">
                                    <span className="text-xs text-gray-400 uppercase tracking-wider">Note</span>
                                    <p className="font-medium text-gray-700 dark:text-gray-300">{payment.note}</p>
                                  </div>
                                )}
                                {payment.confirmed_by && (
                                  <div className="col-span-2 pt-2 border-t border-gray-100 dark:border-zinc-800 mt-2">
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                      <CheckCircle size={12} /> Confirmed by{" "}
                                      {payment.confirmed_by.telegram_user_name}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Amount & Proof */}
                            <div className="flex flex-col items-start md:items-end justify-between min-w-[150px]">
                              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(payment.amount)}
                              </span>

                              {/* Screenshot + Receipt + Invoice Images */}
                              <div className="mt-3 flex flex-wrap gap-2">
                                {payment.confirmation_image && (
                                  <button
                                    onClick={() => setFullscreenImage(payment.confirmation_image!)}
                                    className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg"
                                  >
                                    <Image size={14} /> Screenshot
                                  </button>
                                )}
                                {payment.invoice_image && (
                                  <button
                                    onClick={() => setFullscreenImage(payment.invoice_image!)}
                                    className="flex items-center gap-2 text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg"
                                  >
                                    <Receipt size={14} /> Invoice
                                  </button>
                                )}
                                {payment.additional_image && (
                                  <button
                                    onClick={() => setFullscreenImage(payment.additional_image!)}
                                    className="flex items-center gap-2 text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline bg-teal-50 dark:bg-teal-900/20 px-3 py-2 rounded-lg"
                                  >
                                    <Image size={14} /> Additional
                                  </button>
                                )}
                              </div>

                              {/* Upload / Update buttons for invoice payments */}
                              {payment.invoice && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {/* Invoice Image Upload */}
                                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer px-3 py-2 rounded-lg border border-dashed border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors">
                                    {uploadingPaymentId === payment.id ? (
                                      <Loader size={14} className="animate-spin" />
                                    ) : payment.invoice_image ? (
                                      <Pencil size={14} />
                                    ) : (
                                      <Plus size={14} />
                                    )}
                                    {payment.invoice_image ? "Update Invoice" : "Add Invoice"}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleImageUpload(payment.id, "invoice_image", file);
                                        e.target.value = "";
                                      }}
                                    />
                                  </label>

                                  {/* Additional Image Upload */}
                                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer px-3 py-2 rounded-lg border border-dashed border-teal-300 dark:border-teal-700 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-colors">
                                    {uploadingPaymentId === payment.id ? (
                                      <Loader size={14} className="animate-spin" />
                                    ) : payment.additional_image ? (
                                      <Pencil size={14} />
                                    ) : (
                                      <Plus size={14} />
                                    )}
                                    {payment.additional_image ? "Update Additional" : "Add Additional"}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleImageUpload(payment.id, "additional_image", file);
                                        e.target.value = "";
                                      }}
                                    />
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* --- TAB: DOCUMENTS --- */}
          {activeTab === "documents" && (
            <div className="max-w-xl mx-auto animate-in fade-in duration-300 space-y-4">
              <SectionTitle title="Document Information" icon={FileText} />

              <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-5 space-y-4">
                {[{ key: "folder_no", label: "Folder No" }, { key: "pad_no", label: "Pad No" }, { key: "receipt_no", label: "Receipt No" }, { key: "invoice_no", label: "Invoice No" }].map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">{label}</label>
                    <input
                      type="text"
                      value={(docFields as any)[key]}
                      onChange={(e) => setDocFields(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={`Enter ${label.toLowerCase()}`}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                    />
                  </div>
                ))}

                <button
                  onClick={saveDocFields}
                  disabled={docSaving}
                  className={`w-full mt-2 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${docSaved
                    ? "bg-emerald-600 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                    } disabled:opacity-50`}
                >
                  {docSaving ? (
                    <><Loader size={16} className="animate-spin" /> Saving...</>
                  ) : docSaved ? (
                    <><CheckCircle size={16} /> Saved!</>
                  ) : (
                    "Save Document Info"
                  )}
                </button>

                <button
                  onClick={generatePDF}
                  className="w-full py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900"
                >
                  <Download size={16} /> Get PDF
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Fullscreen Image Overlay */}
        {fullscreenImage && (
          <div
            className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
            onClick={() => setFullscreenImage(null)}
          >
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
            >
              <X size={24} />
            </button>
            <img
              src={fullscreenImage}
              alt="Full screen view"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;
