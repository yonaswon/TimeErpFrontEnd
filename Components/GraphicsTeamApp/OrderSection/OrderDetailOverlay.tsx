import { useState, useRef } from 'react'
import { Order } from '../../../types/cutting'
import { X, Calendar, User, FileText, Scissors, Package, Clock, CheckCircle2, AlertCircle, Upload, Download, FileUp, Trash2, CheckCircle, XCircle } from 'lucide-react'
import api from '../../../api'

interface OrderDetailOverlayProps {
  order: Order
  onClose: () => void
  onOrderUpdate?: (updatedOrder: Order) => void
}

const OrderDetailOverlay = ({ order: initialOrder, onClose, onOrderUpdate }: OrderDetailOverlayProps) => {
  const [order, setOrder] = useState<Order>(initialOrder)
  const [isUploading, setIsUploading] = useState(false)
  const [togglingDxfReady, setTogglingDxfReady] = useState(false)
  const [deletingDxfId, setDeletingDxfId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const formData = new FormData()

    Array.from(files).forEach((file) => {
      // Create a new File object with the safe name to avoid character encoding issues
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const newFile = new File([file], safeName, { type: file.type })
      formData.append('dxf_files', newFile)
    })

    try {
      const response = await api.post(`/api/orders/${order.order_code}/upload_dxf/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.status === 201) {
        // Fetch the updated order to get the new DXF files
        const orderResponse = await api.get(`/api/orders/${order.order_code}/`)
        const updatedOrder = orderResponse.data
        setOrder(updatedOrder)
        if (onOrderUpdate) {
          onOrderUpdate(updatedOrder)
        }
      }
    } catch (error) {
      console.error('Error uploading DXF files:', error)
      alert("Failed to upload DXF files.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const toggleDxfReady = async () => {
    try {
      setTogglingDxfReady(true)
      const response = await api.post(`/api/orders/${order.order_code}/toggle_dxf_ready/`)
      if (response.status === 200) {
        const updatedOrder = { ...order, dxf_file_ready: response.data.dxf_file_ready }
        setOrder(updatedOrder)
        if (onOrderUpdate) {
          onOrderUpdate(updatedOrder)
        }
      }
    } catch (error) {
      console.error('Error toggling DXF ready:', error)
    } finally {
      setTogglingDxfReady(false)
    }
  }

  const deleteDxfFile = async (dxfId: number) => {
    try {
      setDeletingDxfId(dxfId)
      await api.delete(`/api/orders/${order.order_code}/delete_dxf/${dxfId}/`)
      // Re-fetch order to get updated dxf_files
      const orderResponse = await api.get(`/api/orders/${order.order_code}/`)
      const updatedOrder = orderResponse.data
      setOrder(updatedOrder)
      if (onOrderUpdate) {
        onOrderUpdate(updatedOrder)
      }
    } catch (error) {
      console.error('Error deleting DXF file:', error)
    } finally {
      setDeletingDxfId(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CNC-COMPLETED':
      case 'ASSEMBLY-COMPLETED':
      case 'COMPLATED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'CNC-STARTED':
      case 'DANDI-STARTED':
      case 'STARTED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'REM-ACCEPTED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const formatStatus = (status: string) => {
    return status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              ORD{String(order.order_code).padStart(4, '0')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {formatDate(order.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 space-y-6">
          {/* Status Banner */}
          <div className={`p-4 rounded-xl flex items-center justify-between ${getStatusColor(order.order_status)} bg-opacity-50`}>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="font-medium text-sm">Current Status</span>
            </div>
            <span className="font-bold text-sm">{formatStatus(order.order_status)}</span>
          </div>

          {/* Mockup Section */}
          {(order.mockup || order.mockup_modification) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                Design & Mockup
              </h3>

              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 space-y-4 border border-gray-100 dark:border-zinc-800">
                {/* Designer Info */}
                {order.mockup && (
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-zinc-700">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Designer</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        @{order.mockup.designer.telegram_user_name}
                      </p>
                    </div>
                  </div>
                )}

                {/* Mockup Image */}
                {(order.mockup_modification?.mockup_image || order.mockup?.mockup_image) && (
                  <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700">
                    <img
                      src={order.mockup_modification?.mockup_image || order.mockup?.mockup_image}
                      alt="Mockup"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}

                {/* Notes */}
                {(order.mockup_modification?.note || order.mockup?.note) && (
                  <div className="bg-white dark:bg-zinc-800 p-3 rounded-lg text-sm text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-zinc-700">
                    <p className="font-medium text-xs text-gray-400 mb-1">Note</p>
                    {order.mockup_modification?.note || order.mockup?.note}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* BOM Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" />
              Bill of Materials
              <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                {order.boms.length}
              </span>
            </h3>

            {order.boms.length > 0 ? (
              <div className="grid gap-3">
                {order.boms.map((bom) => (
                  <div
                    key={bom.id}
                    className="bg-white dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {bom.material.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {bom.material.type === 'A' && `${bom.width} m x ${bom.height} m`}
                        {bom.material.type === 'L' && `${bom.amount} M`}
                        {bom.material.type === 'P' && `${bom.amount}`}
                        {/* Qty: {bom.amount} */}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">No BOM items added yet</p>
              </div>
            )}
          </div>

          {/* Cutting Files Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Scissors className="w-4 h-4 text-gray-500" />
              Cutting Files
              <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                {order.cutting_files?.length || 0}
              </span>
            </h3>

            {order.cutting_files && order.cutting_files.length > 0 ? (
              <div className="grid gap-3">
                {order.cutting_files.map((file) => (
                  <div
                    key={file.id}
                    className="bg-white dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 rounded-xl p-3"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                          <Scissors className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            File #{file.id}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {file.on?.material_name}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${getStatusColor(file.status)}`}>
                        {formatStatus(file.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <User className="w-3 h-3" />
                        <span>{file.assigned_to?.first_name || 'Unassigned'}</span>
                      </div>
                      {file.schedule_start_date && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(file.schedule_start_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">No cutting files assigned</p>
              </div>
            )}
          </div>

          {/* DXF Files Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileUp className="w-4 h-4 text-gray-500" />
                DXF Files
                <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                  {order.dxf_files?.flatMap(d => d.dxf_file).length || 0}
                </span>
                {/* DXF Ready Status */}
                {order.dxf_file_ready ? (
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Ready
                  </span>
                ) : (
                  <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Not Ready
                  </span>
                )}
              </h3>

              <div className="flex items-center gap-2">
                {/* Toggle DXF Ready */}
                <button
                  onClick={toggleDxfReady}
                  disabled={togglingDxfReady}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${order.dxf_file_ready
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40'
                      : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40'
                    }`}
                >
                  {togglingDxfReady ? (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current"></div>
                  ) : order.dxf_file_ready ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  {order.dxf_file_ready ? 'Ready' : 'Mark Ready'}
                </button>

                {/* Upload DXF */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  multiple
                  accept=".dxf"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>

            {order.dxf_files && order.dxf_files.length > 0 ? (
              <div className="grid gap-3">
                {order.dxf_files.flatMap(orderDxf => orderDxf.dxf_file).map((file, idx) => {
                  const fileName = file.dxf.split('/').pop() || `file-${idx}.dxf`
                  return (
                    <div
                      key={file.id}
                      className="bg-white dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 rounded-xl p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                            {fileName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(file.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={file.dxf.startsWith('http') ? file.dxf : `${api.defaults.baseURL || ''}${file.dxf}`}
                          download={fileName}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-blue-600 dark:text-zinc-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Download DXF"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => deleteDxfFile(file.id)}
                          disabled={deletingDxfId === file.id}
                          className="p-2 text-gray-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete DXF"
                        >
                          {deletingDxfId === file.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">No DXF files uploaded</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailOverlay