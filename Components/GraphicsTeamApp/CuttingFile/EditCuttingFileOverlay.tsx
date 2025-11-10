// EditCuttingFileOverlay.tsx
import { useState, useEffect } from 'react';
import { X, Save, Upload, FileText, Image, Package, AlertCircle, RefreshCw } from 'lucide-react';
import { CuttingFile, EachArealMaterial, Order, Material } from '@/types/cutting';
import api from '@/api';
interface EditCuttingFileOverlayProps {
  file: CuttingFile;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditCuttingFileOverlay = ({ file, onClose, onSuccess }: EditCuttingFileOverlayProps) => {
  const [selectedOrders, setSelectedOrders] = useState<number[]>(
    file.orders.map(order => order.order_code)
  );
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [eachArealMaterials, setEachArealMaterials] = useState<EachArealMaterial[]>([]);
  const [selectedEachArealMaterial, setSelectedEachArealMaterial] = useState<EachArealMaterial>(file.on);
  const [newCrv3dFile, setNewCrv3dFile] = useState<File | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState({
    materials: false,
    eachArealMaterials: false,
    orders: false
  });

  // Fetch all materials
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoadingStates(prev => ({ ...prev, materials: true }));
        const response = await api.get('/materials/?type=A');
        setMaterials(response.data.results);
        
        // Set the current material based on the file's eachArealMaterial
        const currentMaterial = response.data.results.find(
          (m: Material) => m.id === file.on.material
        );
        setSelectedMaterial(currentMaterial || null);
      } catch (err) {
        setError('Failed to fetch materials');
      } finally {
        setLoadingStates(prev => ({ ...prev, materials: false }));
      }
    };

    fetchMaterials();
  }, [file.on.material]);

  // Fetch each areal materials when material is selected or changes
  useEffect(() => {
    if (selectedMaterial) {
      const fetchEachArealMaterials = async () => {
        try {
          setLoadingStates(prev => ({ ...prev, eachArealMaterials: true }));
          const response = await api.get(
            `/each-areal-materials/?finished=false&material=${selectedMaterial.id}&ordering=-date`
          );
          setEachArealMaterials(response.data);
          
          // Try to maintain the current selection or select the first available
          const currentEam = response.data.find(
            (eam: EachArealMaterial) => eam.id === file.on.id
          );
          setSelectedEachArealMaterial(currentEam || response.data[0] || null);
        } catch (err) {
          setError('Failed to fetch material sheets');
        } finally {
          setLoadingStates(prev => ({ ...prev, eachArealMaterials: false }));
        }
      };
      fetchEachArealMaterials();
    }
  }, [selectedMaterial, file.on.id]);

  // Fetch orders when material changes
  useEffect(() => {
    if (selectedMaterial) {
      const fetchOrders = async () => {
        try {
          setLoadingStates(prev => ({ ...prev, orders: true }));
          const response = await api.get(
            `/api/orders/?material=${selectedMaterial.id}&order_status=PRE-ACCEPTED,PRE-CONFIRMED&ordering=-created_at`
          );
          setAvailableOrders(response.data.results);
        } catch (err) {
          setError('Failed to fetch orders');
        } finally {
          setLoadingStates(prev => ({ ...prev, orders: false }));
        }
      };
      fetchOrders();
    }
  }, [selectedMaterial]);

  const handleCrv3dFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.crv3d')) {
        setNewCrv3dFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a .crv3d file');
      }
    }
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith('image/')) {
        setNewImageFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a valid image file');
      }
    }
  };

  const handleOrderToggle = (orderCode: number) => {
    setSelectedOrders(prev =>
      prev.includes(orderCode)
        ? prev.filter(code => code !== orderCode)
        : [...prev, orderCode]
    );
  };

  const handleMaterialChange = (material: Material) => {
    setSelectedMaterial(material);
    // Reset orders when material changes since they are material-specific
    setSelectedOrders([]);
  };

  const handleSubmit = async () => {
    if (!selectedEachArealMaterial || selectedOrders.length === 0) {
      setError('Please select a material sheet and at least one order');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      
      // Add files if they were changed
      if (newCrv3dFile) {
        formData.append('crv3d', newCrv3dFile);
      }
      if (newImageFile) {
        formData.append('image', newImageFile);
      }
      
      // Add other data
      formData.append('on', selectedEachArealMaterial.id.toString());
      selectedOrders.forEach(orderCode => {
        formData.append('orders', orderCode.toString());
      });

      await api.patch(`/api/cuttingfiles/${file.id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update cutting file');
    } finally {
      setLoading(false);
    }
  };

  const isOrderCurrentlyConnected = (orderCode: number) => {
    return file.orders.some(order => order.order_code === orderCode);
  };

  const hasChanges = () => {
    return (
      newCrv3dFile !== null ||
      newImageFile !== null ||
      selectedEachArealMaterial.id !== file.on.id ||
      JSON.stringify(selectedOrders.sort()) !== JSON.stringify(file.orders.map(o => o.order_code).sort())
    );
  };

  const getPreviewImageUrl = () => {
    return newImageFile ? URL.createObjectURL(newImageFile) : file.image;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Edit Cutting File
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Update all information for this cutting file
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* File Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CRV3D File Upload */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                CRV3D File {newCrv3dFile && <span className="text-green-600 text-sm">(New)</span>}
              </h3>
              <div className="text-center p-6 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg hover:border-blue-500 transition-colors">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {newCrv3dFile ? newCrv3dFile.name : file.crv3d.split('/').pop()}
                </p>
                <input
                  type="file"
                  accept=".crv3d"
                  onChange={handleCrv3dFileSelect}
                  className="hidden"
                  id="crv3d-upload-edit"
                />
                <label
                  htmlFor="crv3d-upload-edit"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Change CRV3D</span>
                </label>
              </div>
            </div>

            {/* Image File Upload */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Preview Image {newImageFile && <span className="text-green-600 text-sm">(New)</span>}
              </h3>
              <div className="text-center p-6 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg hover:border-blue-500 transition-colors">
                <div className="mb-4">
                  <img
                    src={getPreviewImageUrl()}
                    alt="Preview"
                    className="w-24 h-24 object-contain mx-auto rounded-lg border border-gray-300"
                  />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileSelect}
                  className="hidden"
                  id="image-upload-edit"
                />
                <label
                  htmlFor="image-upload-edit"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  <Image className="w-4 h-4" />
                  <span>Change Image</span>
                </label>
              </div>
            </div>
          </div>

          {/* Material Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Material Type
            </h3>
            {loadingStates.materials ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {materials.map((material) => (
                  <button
                    key={material.id}
                    onClick={() => handleMaterialChange(material)}
                    className={`p-4 text-left rounded-lg border transition-colors ${
                      selectedMaterial?.id === material.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-blue-600'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {material.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Available: {material.available} | Size: {material.width}x{material.height}
                    </div>
                    {material.id === file.on.material && (
                      <div className="text-xs text-blue-600 mt-1">Current Material</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Material Sheet Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Material Sheet
              </h3>
              {loadingStates.eachArealMaterials && (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              )}
            </div>
            {loadingStates.eachArealMaterials ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {eachArealMaterials && eachArealMaterials.map((eam) => (
                  <label
                    key={eam.id}
                    className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-blue-600 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="eachArealMaterial"
                      checked={selectedEachArealMaterial?.id === eam.id}
                      onChange={() => setSelectedEachArealMaterial(eam)}
                      className="mt-1 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {eam.code} - {eam.material_name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Size: {eam.current_width}x{eam.current_height} | 
                        Status: {eam.finished ? 'Finished' : eam.started ? 'In Progress' : 'Available'}
                        {eam.id === file.on.id && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            Current
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
                {eachArealMaterials && eachArealMaterials.length === 0 && selectedMaterial && (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    No available material sheets found for {selectedMaterial.name}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Order Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Connected Orders
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedOrders.length} orders selected
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {loadingStates.orders && (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                )}
                <span className="text-sm text-gray-500">
                  {selectedOrders.length} / {availableOrders.length} selected
                </span>
              </div>
            </div>

            {loadingStates.orders ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availableOrders.map((order) => {
                  const bom = order.boms[0];
                  const isCurrent = isOrderCurrentlyConnected(order.order_code);
                  
                  return (
                    <label
                      key={order.order_code}
                      className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-blue-600 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.order_code)}
                        onChange={() => handleOrderToggle(order.order_code)}
                        className="mt-1 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Package className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              ORD-{order.order_code}
                            </span>
                            {isCurrent && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                Current
                              </span>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.order_status === 'PRE-ACCEPTED' 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {order.order_status.replace('-', ' ')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Size: {bom.width} x {bom.height} | 
                          Price: ${order.price || '0'}
                        </div>
                        {order.mockup?.mockup_image && (
                          <img
                            src={order.mockup.mockup_image}
                            alt="Order mockup"
                            className="w-16 h-16 object-cover rounded border border-gray-300 mt-2"
                          />
                        )}
                      </div>
                    </label>
                  );
                })}
                {availableOrders.length === 0 && selectedMaterial && (
                  <div className="text-center py-8 text-gray-500">
                    No available orders found for {selectedMaterial.name}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Current File Information */}
          <div className="bg-gray-50 dark:bg-zinc-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Original File Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <span className="font-medium">CRV3D File:</span> {file.crv3d.split('/').pop()}
              </div>
              <div>
                <span className="font-medium">Created:</span> {new Date(file.date).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Original Material:</span> {file.on.material_name} - {file.on.code}
              </div>
              <div>
                <span className="font-medium">Original Orders:</span> {file.orders.length}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-zinc-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !hasChanges() || selectedOrders.length === 0 || !selectedEachArealMaterial}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};