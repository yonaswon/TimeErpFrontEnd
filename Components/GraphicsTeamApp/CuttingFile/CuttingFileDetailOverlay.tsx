// CuttingFileDetailOverlay.tsx
import { useState, useEffect } from 'react';
import { X, Download, Package, Ruler, Calendar, User, DollarSign, Clock, Play, CheckCircle, UserCheck, BarChart3, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { CuttingFile, CuttingFileOrderDxf, SheetAnalysisResponse } from '@/types/cutting';
import api from '@/api';

interface CuttingFileDetailOverlayProps {
  file: CuttingFile;
  onClose: () => void;
  onDownload: (fileUrl: string, fileName: string) => void;
}

export const CuttingFileDetailOverlay = ({ file, onClose, onDownload }: CuttingFileDetailOverlayProps) => {
  const fileName = file.crv3d.split('/').pop() || 'file.crv3d';
  const [analysisData, setAnalysisData] = useState<SheetAnalysisResponse | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  // Fetch sheet analysis data
  useEffect(() => {
    fetchAnalysis();
  }, [file.id]);

  const fetchAnalysis = async () => {
    try {
      setAnalysisLoading(true);
      const response = await api.get(`/api/cuttingfiles/${file.id}/sheet_analysis/`);
      setAnalysisData(response.data);
    } catch (err) {
      console.error('Failed to fetch analysis:', err);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleReanalyze = async () => {
    try {
      setReanalyzing(true);
      await api.post(`/api/cuttingfiles/${file.id}/reanalyze/`);
      // Poll for completion
      setTimeout(fetchAnalysis, 3000);
      setTimeout(fetchAnalysis, 8000);
      setTimeout(fetchAnalysis, 15000);
    } catch (err) {
      console.error('Failed to reanalyze:', err);
    } finally {
      setReanalyzing(false);
    }
  };

  const handleDownload = () => {
    onDownload(file.crv3d, fileName);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'NOT-ASSIGNED': { bg: 'bg-[#F9FAFB] dark:bg-[#1E293B]', text: 'text-[#6B7280] dark:text-[#94A3B8]', border: 'border-[#E5E7EB] dark:border-[#334155]', label: 'Not Assigned' },
      'ASSIGNED': { bg: 'bg-[#EFF6FF] dark:bg-blue-900/30', text: 'text-[#2563EB] dark:text-[#3B82F6]', border: 'border-blue-200 dark:border-blue-800/50', label: 'Assigned' },
      'STARTED': { bg: 'bg-[#FEF3C7] dark:bg-amber-900/30', text: 'text-[#F59E0B] dark:text-[#FBBF24]', border: 'border-amber-200 dark:border-amber-800/50', label: 'Started' },
      'COMPLATED': { bg: 'bg-[#DCFCE7] dark:bg-green-900/30', text: 'text-[#16A34A] dark:text-[#22C55E]', border: 'border-green-200 dark:border-green-800/50', label: 'Completed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['NOT-ASSIGNED'];
    return (
      <span className={`px-3 py-1 rounded-[8px] text-[14px] font-medium border ${config.bg} ${config.text} ${config.border}`}>
        {config.label}
      </span>
    );
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-[#FFFFFF] dark:bg-[#0F172A] rounded-[12px] max-w-5xl w-full my-8 max-h-[90vh] overflow-y-auto relative flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#FFFFFF] dark:bg-[#0F172A] flex items-center justify-between p-[24px] border-b border-[#E5E7EB] dark:border-[#334155]">
          <div>
            <h2 className="text-[22px] font-semibold text-[#111827] dark:text-[#F1F5F9] leading-[1.2]">
              Cutting File Details
            </h2>
            <p className="text-[#6B7280] dark:text-[#94A3B8] text-[14px] mt-1">
              {fileName}
            </p>
          </div>
          <div className="flex items-center space-x-[16px]">
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-[16px] py-[12px] bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[8px] hover:bg-[#1D4ED8] dark:hover:bg-[#60A5FA] transition-colors font-medium text-[16px]"
            >
              <Download className="w-[20px] h-[20px]" />
              <span className="hidden sm:inline">Download CRV3D</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#6B7280] dark:text-[#94A3B8] hover:bg-[#F9FAFB] dark:hover:bg-[#1E293B] rounded-[8px] transition-colors"
            >
              <X className="w-[24px] h-[24px]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-[32px] space-y-[32px] bg-[#F9FAFB] dark:bg-[#0F172A]">
          {/* Status and Assignment Section */}
          <Section title="Production Status">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
              <div className="bg-[#FFFFFF] dark:bg-[#1E293B] p-[16px] rounded-[12px] border border-[#E5E7EB] dark:border-[#334155] space-y-[16px]">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium text-[#6B7280] dark:text-[#94A3B8]">Status</span>
                  {getStatusBadge(file.status)}
                </div>

                {file.assigned_to && (
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-medium text-[#6B7280] dark:text-[#94A3B8]">Assigned To</span>
                    <div className="flex items-center space-x-2">
                      <UserCheck className="w-[20px] h-[20px] text-[#16A34A] dark:text-[#22C55E]" />
                      <span className="text-[16px] font-medium text-[#111827] dark:text-[#F1F5F9]">
                        @{file.assigned_to.telegram_user_name}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-[#FFFFFF] dark:bg-[#1E293B] p-[16px] rounded-[12px] border border-[#E5E7EB] dark:border-[#334155] space-y-[16px]">
                {file.start_date && (
                  <div className="flex items-center space-x-3">
                    <div className="bg-[#FEF3C7] dark:bg-amber-900/30 p-2 rounded-lg">
                      <Play className="w-[20px] h-[20px] text-[#F59E0B] dark:text-[#FBBF24]" />
                    </div>
                    <div>
                      <div className="text-[14px] font-medium text-[#6B7280] dark:text-[#94A3B8]">Started</div>
                      <div className="text-[16px] text-[#111827] dark:text-[#F1F5F9]">
                        {formatDateTime(file.start_date)}
                      </div>
                    </div>
                  </div>
                )}

                {file.complate_date && (
                  <div className="flex items-center space-x-3">
                    <div className="bg-[#DCFCE7] dark:bg-green-900/30 p-2 rounded-lg">
                      <CheckCircle className="w-[20px] h-[20px] text-[#16A34A] dark:text-[#22C55E]" />
                    </div>
                    <div>
                      <div className="text-[14px] font-medium text-[#6B7280] dark:text-[#94A3B8]">Completed</div>
                      <div className="text-[16px] text-[#111827] dark:text-[#F1F5F9]">
                        {formatDateTime(file.complate_date)}
                      </div>
                    </div>
                  </div>
                )}

                {!file.start_date && !file.complate_date && (
                  <div className="text-[14px] text-[#6B7280] dark:text-[#94A3B8] italic">
                    No execution dates recorded yet
                  </div>
                )}
              </div>
            </div>

            {/* Schedule Information */}
            {(file.schedule_start_date || file.schedule_complate_date) && (
              <div className="mt-[16px] p-[16px] bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-[12px]">
                <h4 className="text-[18px] font-semibold text-[#111827] dark:text-[#F1F5F9] mb-[16px] leading-[1.2]">Schedule</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                  {file.schedule_start_date && (
                    <div className="flex items-center space-x-3">
                      <div className="bg-[#EFF6FF] dark:bg-blue-900/30 p-2 rounded-lg">
                        <Clock className="w-[20px] h-[20px] text-[#2563EB] dark:text-[#3B82F6]" />
                      </div>
                      <div>
                        <div className="text-[14px] font-medium text-[#6B7280] dark:text-[#94A3B8]">Scheduled Start</div>
                        <div className="text-[16px] text-[#111827] dark:text-[#F1F5F9]">
                          {formatDateTime(file.schedule_start_date)}
                        </div>
                      </div>
                    </div>
                  )}

                  {file.schedule_complate_date && (
                    <div className="flex items-center space-x-3">
                      <div className="bg-[#EFF6FF] dark:bg-blue-900/30 p-2 rounded-lg">
                        <Clock className="w-[20px] h-[20px] text-[#2563EB] dark:text-[#3B82F6]" />
                      </div>
                      <div>
                        <div className="text-[14px] font-medium text-[#6B7280] dark:text-[#94A3B8]">Scheduled Completion</div>
                        <div className="text-[16px] text-[#111827] dark:text-[#F1F5F9]">
                          {formatDateTime(file.schedule_complate_date)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Section>

          {/* ============================================================ */}
          {/* SHEET USAGE ANALYSIS SECTION */}
          {/* ============================================================ */}
          <SheetUsageAnalysis
            file={file}
            analysisData={analysisData}
            analysisLoading={analysisLoading}
            reanalyzing={reanalyzing}
            onReanalyze={handleReanalyze}
          />

          {/* Preview Image */}
          <Section title="Design Preview">
            <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-[12px] p-[16px]">
              <img
                src={file.image}
                alt="Cutting preview"
                className="w-full h-auto max-h-64 object-contain mx-auto rounded-[8px]"
              />
            </div>
          </Section>

          {/* Material Information */}
          <Section title="Material Information">
            <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-[12px] p-[16px]">
              {file.on ? (
                <>
                  <InfoRow label="Material" value={file.on.material_name} />
                  <InfoRow label="Code" value={file.on.code.toString()} />
                  <InfoRow label="Inventory" value={file.on.inventory_name} />
                  <InfoRow
                    label="Size"
                    value={`${file.on.current_width} x ${file.on.current_height}`}
                  />
                  <InfoRow
                    label="Status"
                    value={
                      <span className={`px-2 py-1 rounded-[8px] text-[14px] font-medium ${file.on.finished
                        ? 'bg-[#FEF2F2] dark:bg-red-900/30 text-[#DC2626] dark:text-[#EF4444]'
                        : file.on.started
                          ? 'bg-[#FEF3C7] dark:bg-amber-900/30 text-[#F59E0B] dark:text-[#FBBF24]'
                          : 'bg-[#DCFCE7] dark:bg-green-900/30 text-[#16A34A] dark:text-[#22C55E]'
                        }`}>
                        {file.on.finished ? 'Finished' : file.on.started ? 'In Progress' : 'Available'}
                      </span>
                    }
                    isLast={true}
                  />
                </>
              ) : file.old_material && file.old_material_number ? (
                <>
                  <InfoRow label="Material" value={file.old_material.name} />
                  <InfoRow label="Number" value={file.old_material_number} />
                  <InfoRow label="Status" value={
                    <span className="px-2 py-1 rounded-[8px] text-[14px] font-medium bg-[#FEF3C7] dark:bg-amber-900/30 text-[#F59E0B] dark:text-[#FBBF24]">
                      Unregistered Sheet
                    </span>
                  } isLast={true} />
                </>
              ) : (
                <InfoRow label="Material" value="Unknown Material" isLast={true} />
              )}
            </div>
          </Section>

          {/* Connected Orders */}
          <Section title={`Connected Orders (${file.orders.length})`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
              {file.orders.map((order) => (
                <OrderCard key={order.order_code} order={order} />
              ))}
            </div>
          </Section>

          {/* File Information */}
          <Section title="File Information">
            <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-[12px] p-[16px]">
              <InfoRow label="File Name" value={fileName} />
              <InfoRow label="Created Date" value={new Date(file.date).toLocaleDateString()} />
              <InfoRow label="Total Orders" value={file.orders.length.toString()} />
              <InfoRow label="File Status" value={getStatusBadge(file.status)} isLast={true} />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};


// ============================================================
// SHEET USAGE ANALYSIS COMPONENT
// ============================================================

interface SheetUsageAnalysisProps {
  file: CuttingFile;
  analysisData: SheetAnalysisResponse | null;
  analysisLoading: boolean;
  reanalyzing: boolean;
  onReanalyze: () => void;
}

const SheetUsageAnalysis = ({ file, analysisData, analysisLoading, reanalyzing, onReanalyze }: SheetUsageAnalysisProps) => {
  const [showPrevImage, setShowPrevImage] = useState(false);

  if (analysisLoading) {
    return (
      <Section title="Sheet Usage Analysis">
        <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-[12px] p-[32px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]"></div>
          <span className="ml-3 text-[#6B7280] dark:text-[#94A3B8]">Loading analysis...</span>
        </div>
      </Section>
    );
  }

  const status = analysisData?.analysis_status || file.analysis_status;
  const activeSelections = analysisData?.active_selections || [];
  const historySelections = analysisData?.history_selections || [];
  const allSelections = [...activeSelections, ...historySelections];
  const totalUsage = analysisData?.total_usage_percentage
    ? parseFloat(analysisData.total_usage_percentage)
    : file.total_usage_percentage
      ? parseFloat(file.total_usage_percentage)
      : null;

  return (
    <Section title="Sheet Usage Analysis">
      <div className="space-y-[16px]">
        {/* Analysis Status Header */}
        <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-[12px] p-[16px]">
          <div className="flex items-center justify-between mb-[16px]">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-[20px] h-[20px] text-[#2563EB] dark:text-[#3B82F6]" />
              <span className="text-[16px] font-semibold text-[#111827] dark:text-[#F1F5F9]">
                Analysis Status
              </span>
              <AnalysisStatusBadge status={status} />
            </div>
            <button
              onClick={onReanalyze}
              disabled={reanalyzing}
              className="flex items-center space-x-2 px-3 py-2 text-[14px] bg-[#EFF6FF] dark:bg-blue-900/30 text-[#2563EB] dark:text-[#3B82F6] rounded-[8px] hover:bg-[#DBEAFE] dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${reanalyzing ? 'animate-spin' : ''}`} />
              <span>{reanalyzing ? 'Analyzing...' : 'Re-analyze'}</span>
            </button>
          </div>

          {/* Error Display */}
          {(analysisData?.analysis_error || file.analysis_error) && (
            <div className="flex items-start space-x-2 p-3 bg-[#FEF2F2] dark:bg-red-900/20 rounded-[8px] border border-red-200 dark:border-red-800/30 mb-[16px]">
              <AlertTriangle className="w-4 h-4 text-[#DC2626] dark:text-[#EF4444] mt-0.5 shrink-0" />
              <span className="text-[14px] text-[#DC2626] dark:text-[#EF4444]">
                {analysisData?.analysis_error || file.analysis_error}
              </span>
            </div>
          )}

          {/* Sheet Dimensions */}
          {(analysisData?.sheet_width || file.sheet_width) && (
            <div className="grid grid-cols-3 gap-[12px] mb-[16px]">
              <div className="bg-[#F9FAFB] dark:bg-[#0F172A] rounded-[8px] p-3 text-center">
                <div className="text-[12px] text-[#6B7280] dark:text-[#94A3B8] mb-1">Sheet Width</div>
                <div className="text-[18px] font-bold text-[#111827] dark:text-[#F1F5F9]">
                  {analysisData?.sheet_width || file.sheet_width} m
                </div>
              </div>
              <div className="bg-[#F9FAFB] dark:bg-[#0F172A] rounded-[8px] p-3 text-center">
                <div className="text-[12px] text-[#6B7280] dark:text-[#94A3B8] mb-1">Sheet Height</div>
                <div className="text-[18px] font-bold text-[#111827] dark:text-[#F1F5F9]">
                  {analysisData?.sheet_height || file.sheet_height} m
                </div>
              </div>
              <div className="bg-[#F9FAFB] dark:bg-[#0F172A] rounded-[8px] p-3 text-center">
                <div className="text-[12px] text-[#6B7280] dark:text-[#94A3B8] mb-1">Total Orders</div>
                <div className="text-[18px] font-bold text-[#111827] dark:text-[#F1F5F9]">
                  {activeSelections.length}
                </div>
              </div>
            </div>
          )}

          {/* Total Usage Percentage Bar */}
          {totalUsage !== null && (
            <div className="mb-[8px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[14px] font-medium text-[#111827] dark:text-[#F1F5F9]">
                  Total Sheet Usage
                </span>
                <span className={`text-[20px] font-bold ${totalUsage >= 80 ? 'text-[#16A34A] dark:text-[#22C55E]'
                  : totalUsage >= 50 ? 'text-[#F59E0B] dark:text-[#FBBF24]'
                    : 'text-[#DC2626] dark:text-[#EF4444]'
                  }`}>
                  {totalUsage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-[#E5E7EB] dark:bg-[#334155] rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${totalUsage >= 80 ? 'bg-gradient-to-r from-[#16A34A] to-[#22C55E]'
                    : totalUsage >= 50 ? 'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]'
                      : 'bg-gradient-to-r from-[#DC2626] to-[#EF4444]'
                    }`}
                  style={{ width: `${Math.min(totalUsage, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Image Comparison */}
        <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-[12px] p-[16px]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[16px] font-semibold text-[#111827] dark:text-[#F1F5F9]">
              {showPrevImage ? 'Previous Cutting File (History)' : 'Current Cutting File'}
            </h4>
            {(analysisData?.previous_cutting_file?.image || file.previous_cutting_file_image) && (
              <button
                onClick={() => setShowPrevImage(!showPrevImage)}
                className="flex items-center space-x-2 px-3 py-1.5 text-[13px] bg-[#F9FAFB] dark:bg-[#0F172A] text-[#6B7280] dark:text-[#94A3B8] rounded-[8px] hover:bg-[#E5E7EB] dark:hover:bg-[#334155] transition-colors border border-[#E5E7EB] dark:border-[#334155]"
              >
                {showPrevImage ? (
                  <><ChevronRight className="w-4 h-4" /><span>Show Current</span></>
                ) : (
                  <><ChevronLeft className="w-4 h-4" /><span>Show Previous</span></>
                )}
              </button>
            )}
          </div>

          {/* Scrollable image container */}
          <div className="overflow-auto max-h-[500px] border border-[#E5E7EB] dark:border-[#334155] rounded-[8px] bg-white dark:bg-[#0F172A]">
            <img
              src={showPrevImage
                ? (analysisData?.previous_cutting_file?.image || file.previous_cutting_file_image || file.image)
                : (analysisData?.image || file.image)
              }
              alt={showPrevImage ? "Previous cutting file" : "Current cutting file"}
              className="w-full h-auto"
              style={{ minWidth: '600px' }}
            />
          </div>

          {/* Legend */}
          <div className="flex items-center space-x-6 mt-3 text-[13px]">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded border-2 border-[#EC4899] bg-[#EC4899]/20"></div>
              <span className="text-[#111827] dark:text-[#F1F5F9]">Active (Current Cut)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded border-2 border-[#374151] bg-[#374151]/20"></div>
              <span className="text-[#111827] dark:text-[#F1F5F9]">History (Previous Cut)</span>
            </div>
          </div>
        </div>

        {/* Per-Order DXF Analysis Cards */}
        {activeSelections.length > 0 && (
          <div>
            <h4 className="text-[16px] font-semibold text-[#111827] dark:text-[#F1F5F9] mb-3">
              Active Orders ({activeSelections.length})
            </h4>
            <div className="space-y-[12px] max-h-[400px] overflow-y-auto pr-1">
              {activeSelections.map((sel) => (
                <DxfAnalysisCard key={sel.id} selection={sel} isActive={true} />
              ))}
            </div>
          </div>
        )}

        {historySelections.length > 0 && (
          <div>
            <h4 className="text-[16px] font-semibold text-[#6B7280] dark:text-[#94A3B8] mb-3">
              History Orders ({historySelections.length})
            </h4>
            <div className="space-y-[12px] max-h-[300px] overflow-y-auto pr-1">
              {historySelections.map((sel) => (
                <DxfAnalysisCard key={sel.id} selection={sel} isActive={false} />
              ))}
            </div>
          </div>
        )}

        {allSelections.length === 0 && status !== 'PENDING' && (
          <div className="bg-[#FFFFFF] dark:bg-[#1E293B] border border-dashed border-[#E5E7EB] dark:border-[#334155] rounded-[12px] p-[32px] text-center">
            <BarChart3 className="w-10 h-10 text-[#6B7280] dark:text-[#94A3B8] mx-auto mb-3 opacity-50" />
            <p className="text-[#6B7280] dark:text-[#94A3B8] text-[14px]">
              No analysis data available. Click "Re-analyze" to run the analysis.
            </p>
          </div>
        )}
      </div>
    </Section>
  );
};


// ============================================================
// DXF ANALYSIS CARD COMPONENT
// ============================================================

const DxfAnalysisCard = ({ selection, isActive }: { selection: CuttingFileOrderDxf; isActive: boolean }) => {
  const usagePct = selection.usage_percentage ? parseFloat(selection.usage_percentage) : null;
  const accuracyPct = selection.size_accuracy_percentage ? parseFloat(selection.size_accuracy_percentage) : null;

  const borderColor = isActive
    ? 'border-[#EC4899] dark:border-[#F472B6]'
    : 'border-[#374151] dark:border-[#4B5563]';
  const bgColor = isActive
    ? 'bg-[#FDF2F8] dark:bg-pink-900/10'
    : 'bg-[#F9FAFB] dark:bg-[#1E293B]';
  const accentColor = isActive
    ? 'text-[#EC4899] dark:text-[#F472B6]'
    : 'text-[#374151] dark:text-[#9CA3AF]';

  return (
    <div className={`${bgColor} border-l-4 ${borderColor} rounded-[12px] p-[16px] border border-[#E5E7EB] dark:border-[#334155]`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {/* Order mockup thumbnail */}
          {selection.mockup_image ? (
            <img
              src={selection.mockup_image}
              alt="Order mockup"
              className="w-12 h-12 rounded-[8px] object-cover border border-[#E5E7EB] dark:border-[#334155]"
            />
          ) : (
            <div className="w-12 h-12 rounded-[8px] bg-[#F9FAFB] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#334155] flex items-center justify-center">
              <Package className="w-6 h-6 text-[#6B7280] dark:text-[#94A3B8] opacity-50" />
            </div>
          )}
          <div>
            <div className="text-[15px] font-semibold text-[#111827] dark:text-[#F1F5F9]">
              {selection.order_name}
            </div>
            <div className="text-[13px] text-[#6B7280] dark:text-[#94A3B8]">
              ORD-{selection.order_code}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-[6px] text-[12px] font-semibold ${accentColor} ${isActive ? 'bg-[#FCE7F3] dark:bg-pink-900/30' : 'bg-[#E5E7EB] dark:bg-[#334155]'}`}>
            {isActive ? '● ACTIVE' : '○ HISTORY'}
          </span>
          <AnalysisStatusBadge status={selection.analysis_status} small />
        </div>
      </div>

      {/* DXF Info */}
      {selection.dxf_file_detail && (
        <div className="text-[13px] text-[#6B7280] dark:text-[#94A3B8] mb-3">
          DXF: {selection.dxf_file_detail.dxf.split('/').pop()}
        </div>
      )}

      {/* Dimensions Comparison */}
      {(selection.dxf_width || selection.detected_width) && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-white dark:bg-[#0F172A] rounded-[8px] p-2.5 border border-[#E5E7EB] dark:border-[#334155]">
            <div className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] uppercase mb-1">DXF Size</div>
            <div className="text-[14px] font-medium text-[#111827] dark:text-[#F1F5F9]">
              {selection.dxf_width || '—'} × {selection.dxf_height || '—'}
            </div>
          </div>
          <div className="bg-white dark:bg-[#0F172A] rounded-[8px] p-2.5 border border-[#E5E7EB] dark:border-[#334155]">
            <div className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] uppercase mb-1">Detected Size</div>
            <div className="text-[14px] font-medium text-[#111827] dark:text-[#F1F5F9]">
              {selection.detected_width || '—'} × {selection.detected_height || '—'}
            </div>
          </div>
        </div>
      )}

      {/* Percentage Bars */}
      <div className="space-y-3">
        {/* Usage Percentage */}
        {usagePct !== null && (
          <PercentageBar
            label="Sheet Usage"
            value={usagePct}
            colorClass={
              usagePct >= 20 ? 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6]'
                : usagePct >= 10 ? 'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]'
                  : 'bg-gradient-to-r from-[#6B7280] to-[#9CA3AF]'
            }
          />
        )}

        {/* Size Accuracy Percentage */}
        {accuracyPct !== null && (
          <PercentageBar
            label="Size Accuracy"
            value={accuracyPct}
            colorClass={
              accuracyPct >= 98 ? 'bg-gradient-to-r from-[#16A34A] to-[#22C55E]'
                : accuracyPct >= 90 ? 'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]'
                  : 'bg-gradient-to-r from-[#DC2626] to-[#EF4444]'
            }
            threshold={98}
          />
        )}
      </div>

      {/* Analysis Notes */}
      {selection.analysis_notes && (
        <div className="mt-2 text-[12px] text-[#6B7280] dark:text-[#94A3B8] italic">
          {selection.analysis_notes}
        </div>
      )}
    </div>
  );
};


// ============================================================
// HELPER COMPONENTS
// ============================================================

const PercentageBar = ({
  label, value, colorClass, threshold
}: {
  label: string; value: number; colorClass: string; threshold?: number
}) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <span className="text-[12px] text-[#6B7280] dark:text-[#94A3B8]">{label}</span>
      <div className="flex items-center space-x-2">
        {threshold && value < threshold && (
          <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
        )}
        <span className={`text-[14px] font-bold ${threshold
          ? (value >= threshold ? 'text-[#16A34A] dark:text-[#22C55E]' : 'text-[#F59E0B] dark:text-[#FBBF24]')
          : 'text-[#111827] dark:text-[#F1F5F9]'
          }`}>
          {value.toFixed(1)}%
        </span>
      </div>
    </div>
    <div className="w-full bg-[#E5E7EB] dark:bg-[#334155] rounded-full h-2 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  </div>
);

const AnalysisStatusBadge = ({ status, small = false }: { status: string; small?: boolean }) => {
  const config = {
    'PENDING': { bg: 'bg-[#FEF3C7] dark:bg-amber-900/30', text: 'text-[#F59E0B] dark:text-[#FBBF24]', label: 'Pending' },
    'COMPLETED': { bg: 'bg-[#DCFCE7] dark:bg-green-900/30', text: 'text-[#16A34A] dark:text-[#22C55E]', label: 'Completed' },
    'FAILED': { bg: 'bg-[#FEF2F2] dark:bg-red-900/30', text: 'text-[#DC2626] dark:text-[#EF4444]', label: 'Failed' },
  }[status] || { bg: 'bg-[#F9FAFB]', text: 'text-[#6B7280]', label: status };

  return (
    <span className={`px-2 py-0.5 rounded-[6px] font-medium ${config.bg} ${config.text} ${small ? 'text-[11px]' : 'text-[13px]'}`}>
      {config.label}
    </span>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="w-full">
    <h3 className="text-[18px] font-semibold text-[#111827] dark:text-[#F1F5F9] mb-[16px] leading-[1.2]">{title}</h3>
    {children}
  </div>
);

const InfoRow = ({ label, value, isLast = false }: { label: string; value: React.ReactNode; isLast?: boolean }) => (
  <div className={`flex items-center justify-between py-[16px] ${!isLast ? 'border-b border-[#E5E7EB] dark:border-[#334155]' : ''}`}>
    <span className="text-[14px] text-[#6B7280] dark:text-[#94A3B8]">{label}</span>
    <span className="text-[16px] font-medium text-[#111827] dark:text-[#F1F5F9]">{value}</span>
  </div>
);

const OrderCard = ({ order }: { order: any }) => {
  const bom = order.boms && order.boms.length > 0 ? order.boms[0] : null;

  const displayOrderName = order.order_name
    || order.mockup?.name
    || order.mockup_modification?.name
    || order.mockup_modification?.mockup?.name
    || `Order #${order.order_code}`;

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#1E293B] rounded-[12px] p-[16px] border border-[#E5E7EB] dark:border-[#334155] flex flex-col h-full">
      {/* 1. Display Image */}
      {order?.mockup_image ? (
        <div className="w-full aspect-video rounded-[8px] overflow-hidden bg-[#F9FAFB] dark:bg-[#0F172A] mb-[16px] border border-[#E5E7EB] dark:border-[#334155]">
          <img
            src={order.mockup_image}
            alt="Order mockup"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full aspect-video rounded-[8px] overflow-hidden bg-[#F9FAFB] dark:bg-[#0F172A] mb-[16px] border border-[#E5E7EB] dark:border-[#334155] flex items-center justify-center">
          <Package className="w-[32px] h-[32px] text-[#6B7280] dark:text-[#94A3B8] opacity-50" />
        </div>
      )}

      <div className="flex-grow flex flex-col">
        {/* Order Name and Selection */}
        <div className="flex items-start justify-between mb-[16px] gap-[8px]">
          <div className="flex flex-col">
            <span className="text-[16px] font-semibold text-[#111827] dark:text-[#F1F5F9] line-clamp-2 leading-[1.2]">
              {displayOrderName}
            </span>
            <span className="text-[14px] text-[#6B7280] dark:text-[#94A3B8] mt-1">
              ORD-{order.order_code}
            </span>
          </div>
          <span className={`shrink-0 px-2 py-1 rounded-[8px] text-[12px] font-medium border ${order.order_status === 'PRE-ACCEPTED'
            ? 'bg-[#FEF3C7] dark:bg-amber-900/30 text-[#F59E0B] dark:text-[#FBBF24] border-amber-200 dark:border-amber-800/50'
            : order.order_status === 'PRE-CONFIRMED'
              ? 'bg-[#EFF6FF] dark:bg-blue-900/30 text-[#2563EB] dark:text-[#3B82F6] border-blue-200 dark:border-blue-800/50'
              : 'bg-[#F9FAFB] dark:bg-slate-800 text-[#6B7280] dark:text-[#94A3B8] border-gray-200 dark:border-slate-700'
            }`}>
            {order.order_status?.replace(/-/g, ' ')}
          </span>
        </div>

        {/* Details Bottom */}
        <div className="grid grid-cols-2 gap-[16px] text-[14px] mt-auto pt-[16px] border-t border-[#E5E7EB] dark:border-[#334155]">
          <div className="flex flex-col">
            <div className="flex items-center space-x-2 text-[#6B7280] dark:text-[#94A3B8] mb-[8px]">
              <Ruler className="w-[16px] h-[16px]" />
              <span>Size</span>
            </div>
            <span className="text-[#111827] dark:text-[#F1F5F9] font-medium">
              {bom ? `${bom.width} x ${bom.height}` : 'N/A'}
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-2 text-[#6B7280] dark:text-[#94A3B8] mb-[8px]">
              <DollarSign className="w-[16px] h-[16px]" />
              <span>Price</span>
            </div>
            <span className="text-[#111827] dark:text-[#F1F5F9] font-medium">
              ${order.price?.toLocaleString() || '0'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};