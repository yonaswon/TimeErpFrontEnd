// CuttingFile.tsx
import { useState, useEffect } from 'react';
import { Download, Plus, FileText, Package, Calendar, Ruler, Edit, User, Play, CheckCircle, Scissors, FileUp } from 'lucide-react';
import { CuttingFile, CuttingFileResponse } from '@/types/cutting';
import api from '@/api';
import { CuttingFileDetailOverlay } from './CuttingFileDetailOverlay';
import { CreateCuttingFileOverlay } from './CreateCuttingFileOverlay';
import { EditCuttingFileOverlay } from './EditCuttingFileOverlay';
import { DxfOrdersList } from './DxfOrdersList';

type TopTab = 'cutting_files' | 'dxf_orders'

export const CuttingFileComponent = () => {
  const [activeTab, setActiveTab] = useState<TopTab>('cutting_files')
  const [cuttingFiles, setCuttingFiles] = useState<CuttingFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<CuttingFile | null>(null);
  const [editingFile, setEditingFile] = useState<CuttingFile | null>(null);
  const [showCreateOverlay, setShowCreateOverlay] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCuttingFiles = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<CuttingFileResponse>(`/api/cuttingfiles/?ordering=-date&page=${page}`);
      setCuttingFiles(response.data.results);
      setTotalPages(Math.ceil(response.data.count / 10));
      setCurrentPage(page);
    } catch (err) {
      setError('Failed to fetch cutting files');
      console.error('Error fetching cutting files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCuttingFiles();
  }, []);

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

  const handlePageChange = (page: number) => {
    fetchCuttingFiles(page);
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
            <button
              onClick={() => setShowCreateOverlay(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>

          {cuttingFiles.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Cutting Files
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Get started by creating your first cutting file
              </p>
              <button
                onClick={() => setShowCreateOverlay(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Cutting File
              </button>
            </div>
          ) : (
            <>
              {/* Cutting Files Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center space-x-2 mt-8">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded-lg ${currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-zinc-700 dark:text-gray-300'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
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
    const statusConfig = {
      'NOT-ASSIGNED': { color: 'bg-gray-100 text-gray-800', label: 'Not Assigned' },
      'ASSIGNED': { color: 'bg-blue-100 text-blue-800', label: 'Assigned' },
      'STARTED': { color: 'bg-yellow-100 text-yellow-800', label: 'Started' },
      'COMPLATED': { color: 'bg-green-100 text-green-800', label: 'Completed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['NOT-ASSIGNED'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={onViewDetails}>
      {/* Header with Actions */}
      <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {fileName.length > 15 ? fileName.substring(0, 15) + '...' : fileName}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleEditClick}
              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
              title="Edit cutting file"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownloadClick}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Download CRV3D file"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status and Assignment */}
        <div className="flex items-center justify-between mt-2">
          <div>
            {getStatusBadge(file.status)}
          </div>
          {file.assigned_to && (
            <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
              <User className="w-3 h-3" />
              <span>@{file.assigned_to.telegram_user_name}</span>
            </div>
          )}
        </div>

        {/* Material Info */}
        <div className="mt-2 text-left">
          {file.on ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {file.on.material_name} - {file.on.code}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Size: {file.on.current_width} x {file.on.current_height}
              </p>
            </>
          ) : file.old_material && file.old_material_number ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {file.old_material.name} - {file.old_material_number}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                Unregistered Sheet
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Unknown Material
            </p>
          )}
        </div>
      </div>

      {/* Preview Image */}
      <div className="aspect-video bg-gray-100 dark:bg-zinc-700">
        <img
          src={file.image}
          alt="Cutting preview"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Orders List */}
      <div className="p-4">
        <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 mb-2">
          <Package className="w-4 h-4" />
          <span>Connected Orders:</span>
        </div>
        <div className="space-y-1">
          {file.orders.map((order) => (
            <div
              key={order.order_code}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                ORD-{order.order_code}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs ${order.order_status === 'PRE-ACCEPTED'
                ? 'bg-yellow-100 text-yellow-800'
                : order.order_status === 'PRE-CONFIRMED'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
                }`}>
                {order.order_status.replace('-', ' ')}
              </span>
            </div>
          ))}
        </div>

        {/* Timeline Information */}
        <div className="mt-3 space-y-1 text-xs text-gray-500">
          {file.start_date && (
            <div className="flex items-center space-x-1">
              <Play className="w-3 h-3 text-yellow-600" />
              <span>Started: {new Date(file.start_date).toLocaleDateString()}</span>
            </div>
          )}
          {file.complate_date && (
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span>Completed: {new Date(file.complate_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Date */}
        <div className="flex items-center space-x-1 text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700">
          <Calendar className="w-3 h-3" />
          <span>Created: {new Date(file.date).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};