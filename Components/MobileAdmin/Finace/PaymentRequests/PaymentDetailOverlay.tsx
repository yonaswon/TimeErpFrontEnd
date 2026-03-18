// PaymentDetailOverlay.tsx
import {
  X,
  User,
  MapPin,
  Calendar,
  FileText,
  CreditCard,
  Building,
  Package,
  Wrench,
  ShieldCheck,
  CheckCircle,
  Loader2,
  ImageIcon,
  Copy,
  Check,
} from "lucide-react";
import { Payment } from "@/types/finance";
import { useState } from "react";

interface PaymentDetailOverlayProps {
  payment: Payment;
  onClose: () => void;
  onConfirm: (paymentId: number) => void;
  isConfirming?: boolean;
}

export const PaymentDetailOverlay = ({
  payment,
  onClose,
  onConfirm,
  isConfirming,
}: PaymentDetailOverlayProps) => {
  const container = payment.order_container;
  const maintenance = payment.maintenance;
  const isPending = payment.status === "P";
  const isCashPayment = payment.method === "CASH";
  const showConfirmButton = isPending && !isCashPayment;
  const isSalesPayment = payment.reason === "SALES";
  const isMaintenance = payment.reason === "MAINTENANCE";
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (payment.transaction_id) {
      try {
        await navigator.clipboard.writeText(payment.transaction_id);
      } catch (err) {
        // Fallback for Telegram Web App / non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = payment.transaction_id;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (fallbackErr) {
          console.error('Fallback copy failed', fallbackErr);
        }
        document.body.removeChild(textArea);
      }
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const getReasonDisplay = (reason: string) => {
    const map: Record<string, string> = {
      PRE: "Pre-Payment",
      REM: "Remaining Payment",
      FULL: "Full Payment",
      SALES: "Product Sales",
      MAINTENANCE: "Maintenance",
    };
    return map[reason] || reason;
  };

  const statusColor =
    payment.status === "P"
      ? "bg-[#F59E0B]/10 text-[#F59E0B]"
      : "bg-[#16A34A]/10 text-[#16A34A] dark:text-[#22C55E]";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-[#F9FAFB] dark:bg-[#0F172A] w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1E293B] border-b border-[#E5E7EB] dark:border-[#334155]">
          <div>
            <h2 className="text-lg font-bold text-[#111827] dark:text-[#F1F5F9]">
              Payment Details
            </h2>
            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
              #{payment.id} · {new Date(payment.created_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="w-8 h-8 rounded-lg bg-[#F9FAFB] dark:bg-[#0F172A] flex items-center justify-center hover:bg-[#E5E7EB] dark:hover:bg-[#334155] transition-colors"
          >
            <X className="w-4 h-4 text-[#6B7280]" />
          </button>
        </div>

        {/* ─── Content ─── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Amount Card */}
          <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-[#E5E7EB] dark:border-[#334155]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mb-0.5">
                  Amount
                </p>
                <p className="text-2xl font-bold text-[#111827] dark:text-[#F1F5F9]">
                  {payment.amount} Birr
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusColor}`}
              >
                {payment.status === "P" ? "Pending" : "Confirmed"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <InfoPill
                icon={CreditCard}
                label={payment.method}
                color="bg-[#2563EB]/10 text-[#2563EB] dark:text-[#3B82F6]"
              />
              <InfoPill
                icon={FileText}
                label={getReasonDisplay(payment.reason)}
                color="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
              />
              <InfoPill
                icon={Building}
                label={payment.wallet.name}
                color="bg-[#F9FAFB] dark:bg-[#0F172A] text-[#6B7280] dark:text-[#94A3B8]"
              />
              {payment.invoice && (
                <InfoPill
                  icon={FileText}
                  label="Invoice"
                  color="bg-[#F59E0B]/10 text-[#F59E0B]"
                />
              )}
              {payment.transaction_id && (
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                  title="Copy Transaction ID"
                >
                  <span className="truncate max-w-[120px]">{payment.transaction_id}</span>
                  {copiedId ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
            </div>
          </div>

          {/* ─── Order Container Details ─── */}
          {container && (
            <Section title="Client & Order Info" icon={User}>
              <div className="space-y-3">
                {/* Client row */}
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-[#2563EB] dark:text-[#3B82F6]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#111827] dark:text-[#F1F5F9]">
                      {container.client}
                    </p>
                    <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                      {container.contact}
                    </p>
                    <div className="flex items-center space-x-1 text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span>{container.location}</span>
                    </div>
                  </div>
                </div>

                {/* Payment breakdown */}
                <div className="grid grid-cols-3 gap-2">
                  <MiniStat
                    label="Full"
                    value={`${container.full_payment} Birr`}
                  />
                  <MiniStat
                    label="Advance"
                    value={`${container.advance_payment} Birr`}
                  />
                  <MiniStat
                    label="Remaining"
                    value={`${container.remaining_payment} Birr`}
                  />
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap gap-2">
                  <InfoPill
                    icon={Calendar}
                    label={new Date(
                      container.delivery_date
                    ).toLocaleDateString()}
                    color="bg-[#F9FAFB] dark:bg-[#0F172A] text-[#6B7280] dark:text-[#94A3B8]"
                  />
                  <InfoPill
                    icon={FileText}
                    label={container.order_difficulty}
                    color="bg-[#F9FAFB] dark:bg-[#0F172A] text-[#6B7280] dark:text-[#94A3B8]"
                  />
                </div>

                {/* Services */}
                <div className="flex gap-2">
                  {container.instalation_service && (
                    <span className="text-xs px-2 py-1 rounded-md bg-[#16A34A]/10 text-[#16A34A] dark:text-[#22C55E] font-medium">
                      ✓ Installation
                    </span>
                  )}
                  {container.delivery_service && (
                    <span className="text-xs px-2 py-1 rounded-md bg-[#16A34A]/10 text-[#16A34A] dark:text-[#22C55E] font-medium">
                      ✓ Delivery
                    </span>
                  )}
                </div>
              </div>
            </Section>
          )}

          {/* ─── Orders List ─── */}
          {container && container.orders && container.orders.length > 0 && (
            <Section
              title={`Orders (${container.orders.length})`}
              icon={Package}
            >
              <div className="space-y-2">
                {container.orders.map((order) => (
                  <div
                    key={order.order_code}
                    className="flex items-center space-x-3 bg-[#F9FAFB] dark:bg-[#0F172A] rounded-xl p-3 border border-[#E5E7EB] dark:border-[#334155]"
                  >
                    {order.mockup_image ? (
                      <img
                        src={order.mockup_image}
                        alt={`ORD-${order.order_code}`}
                        className="w-12 h-12 rounded-lg object-cover border border-[#E5E7EB] dark:border-[#334155] flex-shrink-0 cursor-pointer"
                        onClick={() =>
                          setExpandedImage(order.mockup_image)
                        }
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-[#E5E7EB] dark:bg-[#334155] flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-5 h-5 text-[#6B7280] dark:text-[#94A3B8]" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9]">
                        ORD-{order.order_code}
                      </p>
                      {order.order_name && (
                        <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] truncate">
                          {order.order_name}
                        </p>
                      )}
                    </div>
                    <span className="text-xs px-2 py-1 rounded-md bg-[#2563EB]/10 text-[#2563EB] dark:text-[#3B82F6] font-semibold flex-shrink-0">
                      {order.order_status.replace(/-/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ─── Maintenance Details ─── */}
          {isMaintenance && maintenance && (
            <Section title="Maintenance Info" icon={Wrench}>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-5 h-5 text-[#F59E0B]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9]">
                        MNT-{maintenance.id}
                      </p>
                      {maintenance.under_warranty && (
                        <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded-md text-xs font-bold bg-[#16A34A]/10 text-[#16A34A] dark:text-[#22C55E]">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Warranty</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
                      {maintenance.order && (
                        <span className="font-semibold text-[#2563EB] dark:text-[#3B82F6]">
                          ORD-{maintenance.order}
                        </span>
                      )}
                      {maintenance.old_order_code && (
                        <span className="font-medium">
                          OLD-{maintenance.old_order_code}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {maintenance.client_name && (
                  <DetailRow label="Client" value={maintenance.client_name} />
                )}
                {maintenance.client_contact && (
                  <DetailRow
                    label="Contact"
                    value={maintenance.client_contact}
                  />
                )}
                {maintenance.reported_issue && (
                  <div>
                    <p className="text-xs font-medium text-[#6B7280] dark:text-[#94A3B8] mb-1">
                      Reported Issue
                    </p>
                    <p className="text-sm text-[#111827] dark:text-[#F1F5F9] leading-relaxed bg-[#F9FAFB] dark:bg-[#0F172A] rounded-lg p-3 border border-[#E5E7EB] dark:border-[#334155]">
                      {maintenance.reported_issue}
                    </p>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* ─── Sales Info ─── */}
          {isSalesPayment && payment.material_sales_recored && (
            <Section title="Sales Information" icon={Package}>
              <div className="space-y-3">
                {payment.material_sales_recored.release?.map(
                  (releaseItem: any) => (
                    <div
                      key={releaseItem.id}
                      className="bg-[#F9FAFB] dark:bg-[#0F172A] rounded-xl p-3 border border-[#E5E7EB] dark:border-[#334155] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#111827] dark:text-[#F1F5F9]">
                          {releaseItem.material.name}
                        </p>
                        <span className="text-xs font-medium text-[#6B7280] dark:text-[#94A3B8]">
                          Qty: {releaseItem.amount}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#6B7280] dark:text-[#94A3B8]">
                        <span>📦 {releaseItem.inventory.name}</span>
                        <span>
                          ·{" "}
                          {new Date(releaseItem.date).toLocaleDateString()}
                        </span>
                      </div>
                      {releaseItem.each_areal_material?.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-[#E5E7EB] dark:border-[#334155]">
                          {releaseItem.each_areal_material.map(
                            (am: any) => (
                              <div
                                key={am.id}
                                className="text-xs text-[#6B7280] dark:text-[#94A3B8] bg-white dark:bg-[#1E293B] rounded-lg px-2.5 py-1.5"
                              >
                                <span className="font-medium">{am.code}</span>{" "}
                                · {am.current_width}×{am.current_height}
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </Section>
          )}

          {/* ─── Notes ─── */}
          {(container?.special_requerment || container?.note || payment.note) && (
            <Section title="Notes" icon={FileText}>
              <div className="space-y-2.5">
                {container?.special_requerment && (
                  <NoteBlock
                    label="Special Requirements"
                    text={container.special_requerment}
                  />
                )}
                {container?.note && (
                  <NoteBlock label="Order Note" text={container.note} />
                )}
                {payment.note && (
                  <NoteBlock label="Payment Note" text={payment.note} />
                )}
              </div>
            </Section>
          )}

          {/* ─── Images ─── */}
          {(payment.invoice_image ||
            payment.confirmation_image ||
            payment.additional_image) && (
              <Section title="Documents" icon={ImageIcon}>
                <div className="grid grid-cols-2 gap-3">
                  {payment.invoice_image && (
                    <ImageCard
                      label="Invoice"
                      src={payment.invoice_image}
                      onExpand={() => setExpandedImage(payment.invoice_image)}
                    />
                  )}
                  {payment.confirmation_image && (
                    <ImageCard
                      label="Confirmation"
                      src={payment.confirmation_image}
                      onExpand={() =>
                        setExpandedImage(payment.confirmation_image)
                      }
                    />
                  )}
                  {payment.additional_image && (
                    <ImageCard
                      label="Additional"
                      src={payment.additional_image}
                      onExpand={() =>
                        setExpandedImage(payment.additional_image)
                      }
                    />
                  )}
                </div>
              </Section>
            )}
        </div>

        {/* ─── Footer ─── */}
        <div className="p-4 bg-white dark:bg-[#1E293B] border-t border-[#E5E7EB] dark:border-[#334155] flex gap-3">
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-[#6B7280] dark:text-[#94A3B8] bg-[#F9FAFB] dark:bg-[#0F172A] hover:bg-[#E5E7EB] dark:hover:bg-[#334155] transition-colors border border-[#E5E7EB] dark:border-[#334155]"
          >
            Close
          </button>
          {showConfirmButton && (
            <button
              onClick={() => onConfirm(payment.id)}
              disabled={isConfirming}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center space-x-2 transition-colors ${isConfirming
                ? "bg-[#16A34A]/50 cursor-not-allowed"
                : "bg-[#16A34A] hover:bg-[#15803D] active:bg-[#166534]"
                }`}
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Confirming...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm Payment</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ─── Expanded Image Viewer ─── */}
      {expandedImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <img
            src={expandedImage}
            alt="Expanded view"
            className="max-w-full max-h-[85vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setExpandedImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Helper Components ──────────────────────────────────

const Section = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: any;
  children: React.ReactNode;
}) => (
  <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-[#E5E7EB] dark:border-[#334155]">
    <div className="flex items-center space-x-2 mb-3">
      {Icon && (
        <Icon className="w-4 h-4 text-[#6B7280] dark:text-[#94A3B8]" />
      )}
      <h3 className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9] uppercase tracking-wider">
        {title}
      </h3>
    </div>
    {children}
  </div>
);

const InfoPill = ({
  icon: Icon,
  label,
  color,
}: {
  icon: any;
  label: string;
  color: string;
}) => (
  <span
    className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-semibold ${color}`}
  >
    <Icon className="w-3 h-3" />
    <span>{label}</span>
  </span>
);

const MiniStat = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-[#F9FAFB] dark:bg-[#0F172A] rounded-lg p-2.5 text-center border border-[#E5E7EB] dark:border-[#334155]">
    <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">{label}</p>
    <p className="text-sm font-bold text-[#111827] dark:text-[#F1F5F9] mt-0.5">
      {value}
    </p>
  </div>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-[#6B7280] dark:text-[#94A3B8]">{label}</span>
    <span className="font-medium text-[#111827] dark:text-[#F1F5F9]">
      {value}
    </span>
  </div>
);

const NoteBlock = ({ label, text }: { label: string; text: string }) => (
  <div>
    <p className="text-xs font-medium text-[#6B7280] dark:text-[#94A3B8] mb-1">
      {label}
    </p>
    <p className="text-sm text-[#111827] dark:text-[#F1F5F9] leading-relaxed bg-[#F9FAFB] dark:bg-[#0F172A] rounded-lg p-3 border border-[#E5E7EB] dark:border-[#334155]">
      {text}
    </p>
  </div>
);

const ImageCard = ({
  label,
  src,
  onExpand,
}: {
  label: string;
  src: string;
  onExpand: () => void;
}) => (
  <div
    className="space-y-1.5 cursor-pointer group"
    onClick={onExpand}
  >
    <img
      src={src}
      alt={label}
      className="w-full h-32 object-cover rounded-xl border border-[#E5E7EB] dark:border-[#334155] group-hover:opacity-90 transition-opacity"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = "none";
      }}
    />
    <p className="text-xs text-center text-[#6B7280] dark:text-[#94A3B8] font-medium">
      {label}
    </p>
  </div>
);