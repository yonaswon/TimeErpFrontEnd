// CuttingFile.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Plus, FileText, Package, Calendar, Edit, User, Play, CheckCircle, Scissors, FileUp, Loader2, Search, Filter, X, ChevronDown, Layers, Target } from 'lucide-react';
import { CuttingFile, CuttingFileResponse, Material } from '@/types/cutting';
import api from '@/api';
import { CuttingFileDetailOverlay } from './CuttingFileDetailOverlay';
import { CreateCuttingFileOverlay } from './CreateCuttingFileOverlay';
import { EditCuttingFileOverlay } from './EditCuttingFileOverlay';
import { DxfOrdersList } from './DxfOrdersList';
import { SearchFitSidebar } from './SearchFitSidebar';

type TopTab = 'cutting_files' | 'dxf_orders'

export const CuttingFileComponent = () => {
  const [activeTab, setActiveTab] = useState<TopTab>('cutting_files')
  const [cuttingFiles, setCuttingFiles] = useState<CuttingFile[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<CuttingFile | null>(null);
  const [editingFile, setEditingFile] = useState<CuttingFile | null>(null);
  const [showCreateOverlay, setShowCreateOverlay] = useState(false);
  const [showSearchFit, setShowSearchFit] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterMaterial, setFilterMaterial] = useState('');
  const [filterSheet, setFilterSheet] = useState('');

  // Materials list for filter dropdown
  const [materials, setMaterials] = useState<{ id: number; name: string }[]>([]);
  const [sheets, setSheets] = useState<{ id: number; code: number; material_name: string; label: string }[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build the API URL with current search/filter params
  const buildApiUrl = useCallback((extraParams?: string) => {
    const params = new URLSearchParams();
    params.set('ordering', '-date');
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (filterMaterial) params.set('material', filterMaterial);
    if (filterSheet) params.set('sheet', filterSheet);
    let url = `/api/cuttingfiles/?${params.toString()}`;
    if (extraParams) url += `&${extraParams}`;
    return url;
  }, [searchQuery, filterMaterial, filterSheet]);

  const fetchCuttingFiles = useCallback(async (url?: string, isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else if (cuttingFiles.length > 0) {
        setSearching(true);
      } else {
        setInitialLoading(true);
      }
      setError(null);

      let requestUrl = url || buildApiUrl();
      if (url) {
        // For load-more, extract the path from the full next URL
        try {
          const parsedUrl = new URL(url);
          requestUrl = parsedUrl.pathname + parsedUrl.search;
        } catch {
          requestUrl = url;
        }
      }

      const response = await api.get<CuttingFileResponse>(requestUrl);
      if (isLoadMore) {
        setCuttingFiles(prev => [...prev, ...response.data.results]);
      } else {
        setCuttingFiles(response.data.results);
      }
      setNextPageUrl(response.data.next);
      setTotalCount(response.data.count || 0);
    } catch (err) {
      setError('Failed to fetch cutting files');
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
      setSearching(false);
    }
  }, [buildApiUrl]);

  // Fetch materials for the filter dropdown (once)
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await api.get('/materials/?ordering=name&type=A');
        const mats = res.data.results || res.data || [];
        setMaterials(mats.map((m: any) => ({ id: m.id, name: m.name })));
      } catch { /* ignore */ }
    };
    const fetchSheets = async () => {
      try {
        const res = await api.get('/each-areal-materials/?finished=false&ordering=-code');
        const data = res.data.results || res.data || [];
        setSheets(data.map((s: any) => ({ id: s.id, code: s.code, material_name: s.material_name, label: `${s.material_name} #${s.code}` })));
      } catch { /* ignore */ }
    };
    fetchMaterials();
    fetchSheets();
  }, []);

  // Initial load
  useEffect(() => {
    fetchCuttingFiles();
  }, []);

  // Debounced search — re-fetch when search/filter changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCuttingFiles();
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, filterMaterial, filterSheet]);

  const handleDownload = (fileUrl: string, fileName: string) => {
    if ((window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.openLink(fileUrl);
    } else {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleLoadMore = () => {
    if (nextPageUrl && !loadingMore) {
      fetchCuttingFiles(nextPageUrl, true);
    }
  };

  const hasActiveFilters = searchQuery || filterMaterial || filterSheet;

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterMaterial('');
    setFilterSheet('');
  };

  return (
    <div className="space-y-4">
      {/* Top Navigation Tabs */}
      <div className="sticky top-0 z-10 bg-gray-50 dark:bg-zinc-900 pb-2 -mx-4 px-4 pt-1">
        <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('cutting_files')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'cutting_files'
              ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
              }`}
          >
            <Scissors className="w-4 h-4" />
            Cutting Files
          </button>
          <button
            onClick={() => setActiveTab('dxf_orders')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'dxf_orders'
              ? 'bg-white dark:bg-zinc-700 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
              }`}
          >
            <FileUp className="w-4 h-4" />
            DXF Orders
          </button>
        </div>
      </div>

      {/* DXF Orders Tab */}
      {activeTab === 'dxf_orders' && <DxfOrdersList />}

      {/* Cutting Files Tab */}
      {activeTab === 'cutting_files' && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Cutting Files</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSearchFit(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-purple-700 hover:to-indigo-700 active:scale-[0.97] transition-all"
              >
                <Target className="w-4 h-4" />
                Search & Fit
              </button>
              <button
                onClick={() => setShowCreateOverlay(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 active:scale-[0.97] transition-all"
              >
                <Plus className="w-4 h-4" />
                New
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by order code or name..."
                  className="w-full h-11 pl-10 pr-9 border border-gray-200 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`h-11 px-3 flex items-center gap-1.5 border rounded-xl text-sm font-medium transition-all shrink-0 ${
                  showFilters || filterMaterial || filterSheet
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400'
                    : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {(filterMaterial || filterSheet) && (
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold">
                    {(filterMaterial ? 1 : 0) + (filterSheet ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>

            {/* Filter Dropdowns */}
            {showFilters && (
              <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Filters</h4>
                  {hasActiveFilters && (
                    <button onClick={clearAllFilters} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
                      Clear All
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Material</label>
                    <select
                      value={filterMaterial}
                      onChange={(e) => { setFilterMaterial(e.target.value); setFilterSheet(''); }}
                      className="w-full h-10 px-3 border border-gray-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="">All Materials</option>
                      {materials.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Sheet</label>
                    <select
                      value={filterSheet}
                      onChange={(e) => setFilterSheet(e.target.value)}
                      className="w-full h-10 px-3 border border-gray-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
                      disabled={!filterMaterial}
                    >
                      <option value="">{filterMaterial ? 'All Sheets' : 'Select a material first'}</option>
                      {sheets
                         .filter(s => filterMaterial ? s.material_name === filterMaterial : false)
                         .map(s => (
                           <option key={s.id} value={s.code}>#{s.code}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Active filter pills */}
            {hasActiveFilters && !showFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-700 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800/40">
                    Search: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filterMaterial && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-xs text-green-700 dark:text-green-300 font-medium border border-green-200 dark:border-green-800/40">
                    Material: {filterMaterial}
                    <button onClick={() => setFilterMaterial('')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filterSheet && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-xs text-purple-700 dark:text-purple-300 font-medium border border-purple-200 dark:border-purple-800/40">
                    Sheet: #{filterSheet}
                    <button onClick={() => setFilterSheet('')}><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Searching indicator */}
          {searching && (
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Searching...</span>
            </div>
          )}

          {/* Results count */}
          {hasActiveFilters && !initialLoading && !searching && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {totalCount} cutting file{totalCount !== 1 ? 's' : ''} found
            </p>
          )}

          {/* Initial Loading State */}
          {initialLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading cutting files...</p>
            </div>
          ) : cuttingFiles.length === 0 && !hasActiveFilters ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="p-4 rounded-2xl bg-gray-100 dark:bg-zinc-800">
                <FileText className="w-10 h-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">No Cutting Files</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Get started by creating your first cutting file</p>
              <button
                onClick={() => setShowCreateOverlay(true)}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Create Cutting File
              </button>
            </div>
          ) : cuttingFiles.length === 0 && hasActiveFilters ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="p-4 rounded-2xl bg-gray-100 dark:bg-zinc-800">
                <Search className="w-10 h-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">No Results</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">No cutting files match your search or filters</p>
              <button onClick={clearAllFilters} className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">Clear Filters</button>
            </div>
          ) : (
            <>
              {/* Cutting Files List */}
              <div className="space-y-3">
                {cuttingFiles.map((file) => (
                  <CuttingFileCard
                    key={file.id}
                    file={file}
                    onViewDetails={() => setSelectedFile(file)}
                    onEdit={() => setEditingFile(file)}
                    onDownload={handleDownload}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {nextPageUrl && (
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loadingMore ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Loading...</span></>
                  ) : (
                    <><ChevronDown className="w-4 h-4" /><span>Load More</span></>
                  )}
                </button>
              )}
            </>
          )}

          {/* Detail Overlay */}
          {selectedFile && (
            <CuttingFileDetailOverlay
              file={selectedFile}
              onClose={() => setSelectedFile(null)}
              onDownload={handleDownload}
            />
          )}

          {/* Create Overlay */}
          {showCreateOverlay && (
            <CreateCuttingFileOverlay
              onClose={() => setShowCreateOverlay(false)}
              onSuccess={() => {
                setShowCreateOverlay(false);
                fetchCuttingFiles();
              }}
            />
          )}

          {/* Edit Overlay */}
          {editingFile && (
            <EditCuttingFileOverlay
              file={editingFile}
              onClose={() => setEditingFile(null)}
              onSuccess={() => {
                setEditingFile(null);
                fetchCuttingFiles();
              }}
            />
          )}

          {/* Search & Fit Sidebar */}
          <SearchFitSidebar
            isOpen={showSearchFit}
            onClose={() => setShowSearchFit(false)}
            materials={materials as any[]}
          />
        </>
      )}
    </div>
  );
};

interface CuttingFileCardProps {
  file: CuttingFile;
  onViewDetails: () => void;
  onEdit: (file: CuttingFile) => void;
  onDownload: (fileUrl: string, fileName: string) => void;
}

const CuttingFileCard = ({ file, onViewDetails, onEdit, onDownload }: CuttingFileCardProps) => {
  const fileName = file.crv3d.split('/').pop() || 'file.crv3d';

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload(file.crv3d, fileName);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(file);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      'NOT-ASSIGNED': { bg: 'bg-gray-100 dark:bg-zinc-700', text: 'text-gray-700 dark:text-gray-300', label: 'Not Assigned' },
      'ASSIGNED': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Assigned' },
      'STARTED': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', label: 'Started' },
      'COMPLATED': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Completed' }
    };
    return statusConfig[status] || statusConfig['NOT-ASSIGNED'];
  };

  const statusBadge = getStatusBadge(file.status);

  return (
    <div
      className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden active:scale-[0.99] transition-transform cursor-pointer"
      onClick={onViewDetails}
    >
      <div className="flex gap-3 p-3">
        {/* Preview thumbnail(s) */}
        <div className={`flex gap-1 ${file.line_image ? 'w-[164px]' : 'w-20'} shrink-0`}>
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600">
            <img src={file.image} alt="Cutting preview" className="w-full h-full object-contain" />
          </div>
          {file.line_image && (
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600">
              <img src={file.line_image} alt="Wireframe preview" className="w-full h-full object-contain" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Top row: filename + actions */}
          <div className="flex items-start justify-between mb-1">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-0.5 shrink-0 -mt-0.5 -mr-1">
              <button
                onClick={handleEditClick}
                className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDownloadClick}
                className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Material + status */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
              {statusBadge.label}
            </span>
            {file.assigned_to && (
              <span className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
                <User className="w-2.5 h-2.5" />@{file.assigned_to.telegram_user_name}
              </span>
            )}
          </div>

          {/* Material info */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {file.on ? (
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-blue-500 shrink-0" />
                <span className="truncate">{file.on.material_name} #{file.on.code}</span>
                <span className="text-gray-400 dark:text-gray-500">• {file.on.current_width}×{file.on.current_height}</span>
              </span>
            ) : file.old_material && file.old_material_number ? (
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="truncate">{file.old_material.name} #{file.old_material_number}</span>
                <span className="text-amber-500 text-[10px]">Unreg.</span>
              </span>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">Unknown Material</span>
            )}
          </div>
        </div>
      </div>

      {/* Orders */}
      <div className="px-3 pb-3">
        <div className="flex flex-wrap gap-1.5">
          {file.orders.map((order) => (
            <span
              key={order.order_code}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                order.order_status === 'CNC-COMPLETED'
                  ? 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800/40'
                  : order.order_status === 'CNC-STARTED'
                    ? 'bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/40'
                    : 'bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-600'
              }`}
            >
              ORD-{order.order_code}
              {order.order_name && (
                <span className="text-gray-500 dark:text-gray-400 font-normal truncate max-w-[100px]">— {order.order_name}</span>
              )}
            </span>
          ))}
        </div>

        {/* Timeline */}
        {(file.start_date || file.complate_date) && (
          <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400 dark:text-gray-500">
            {file.start_date && (
              <span className="flex items-center gap-0.5"><Play className="w-2.5 h-2.5 text-yellow-600" />{new Date(file.start_date).toLocaleDateString()}</span>
            )}
            {file.complate_date && (
              <span className="flex items-center gap-0.5"><CheckCircle className="w-2.5 h-2.5 text-green-600" />{new Date(file.complate_date).toLocaleDateString()}</span>
            )}
            <span className="flex items-center gap-0.5 ml-auto"><Calendar className="w-2.5 h-2.5" />{new Date(file.date).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
};