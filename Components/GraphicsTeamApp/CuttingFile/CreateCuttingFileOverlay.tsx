// CreateCuttingFileOverlay.tsx
import { useState, useEffect } from 'react';
import { X, Upload, FileText, Package, AlertCircle, Image } from 'lucide-react';
import { Material, EachArealMaterial, Order } from '@/types/cutting';
import api from '@/api';

interface CreateCuttingFileOverlayProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateCuttingFileOverlay = ({ onClose, onSuccess }: CreateCuttingFileOverlayProps) => {
  const [step, setStep] = useState(1);
  const [crv3dFile, setCrv3dFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [eachArealMaterials, setEachArealMaterials] = useState<EachArealMaterial[]>([]);
  const [selectedEachArealMaterial, setSelectedEachArealMaterial] = useState<EachArealMaterial | null>(null);
  const [oldMaterialNumber, setOldMaterialNumber] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState({
    materials: false,
    eachArealMaterials: false,
    orders: false
  });

  // Fetch materials
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoadingStates(prev => ({ ...prev, materials: true }));
        const response = await api.get('/materials/?type=A');
        setMaterials(response.data.results);
      } catch (err) {
        setError('Failed to fetch materials');
      } finally {
        setLoadingStates(prev => ({ ...prev, materials: false }));
      }
    };
    fetchMaterials();
  }, []);

  // Fetch each areal materials when material is selected
  useEffect(() => {
    if (selectedMaterial) {
      const fetchEachArealMaterials = async () => {
        try {
          setLoadingStates(prev => ({ ...prev, eachArealMaterials: true }));
          const response = await api.get(`/each-areal-materials/?finished=false&material=${selectedMaterial.id}&ordering=-date`);
          setEachArealMaterials(response.data);
          setSelectedEachArealMaterial(null);
        } catch (err) {
          setError('Failed to fetch material sheets');
        } finally {
          setLoadingStates(prev => ({ ...prev, eachArealMaterials: false }));
        }
      };
      fetchEachArealMaterials();
    }
  }, [selectedMaterial]);

  // Fetch orders when each areal material or old material number is selected
  useEffect(() => {
    if ((selectedEachArealMaterial || oldMaterialNumber.trim() !== '') && selectedMaterial) {
      const fetchOrders = async () => {
        try {
          setLoadingStates(prev => ({ ...prev, orders: true }));
          const response = await api.get(`/api/orders/?material=${selectedMaterial.id}&order_status=PRE-ACCEPTED,PRE-CONFIRMED&ordering=-created_at`);
          setOrders(response.data.results);
          setSelectedOrders([]);
        } catch (err) {
          setError('Failed to fetch orders');
        } finally {
          setLoadingStates(prev => ({ ...prev, orders: false }));
        }
      };
      fetchOrders();
    }
  }, [selectedEachArealMaterial, oldMaterialNumber, selectedMaterial]);

  const handleCrv3dFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.crv3d')) {
        setCrv3dFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a .crv3d file');
      }
    }
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if it's an image file
      if (selectedFile.type.startsWith('image/')) {
        setImageFile(selectedFile);
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

  const handleSubmit = async () => {
    if (!crv3dFile || !imageFile || (!selectedEachArealMaterial && oldMaterialNumber.trim() === '') || selectedOrders.length === 0) {
      setError('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('crv3d', crv3dFile);
      formData.append('image', imageFile);

      if (selectedEachArealMaterial) {
        formData.append('on', selectedEachArealMaterial.id.toString());
      }

      if (oldMaterialNumber.trim() !== '' && selectedMaterial) {
        formData.append('old_material_number', oldMaterialNumber.trim());
        formData.append('old_material', selectedMaterial.id.toString());
      }

      selectedOrders.forEach(orderCode => {
        formData.append('orders', orderCode.toString());
      });

      await api.post('/api/cuttingfiles/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create cutting file');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return crv3dFile !== null && imageFile !== null;
      case 2: return selectedMaterial !== null;
      case 3: return selectedEachArealMaterial !== null || oldMaterialNumber.trim() !== '';
      case 4: return selectedOrders.length > 0;
      default: return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Create Cutting File
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= stepNum
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600 dark:bg-zinc-700 dark:text-gray-400'
                  }`}>
                  {stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`w-12 h-1 mx-2 ${step > stepNum ? 'bg-blue-600' : 'bg-gray-200 dark:bg-zinc-700'
                    }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Upload Files</span>
            <span>Select Material</span>
            <span>Select Sheet</span>
            <span>Select Orders</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: File Upload */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Upload CRV3D File
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Select your cutting file in CRV3D format
                </p>
                <input
                  type="file"
                  accept=".crv3d"
                  onChange={handleCrv3dFileSelect}
                  className="hidden"
                  id="crv3d-upload"
                />
                <label
                  htmlFor="crv3d-upload"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Choose CRV3D File</span>
                </label>
                {crv3dFile && (
                  <p className="mt-3 text-sm text-green-600">
                    Selected: {crv3dFile.name}
                  </p>
                )}
              </div>

              <div className="text-center">
                <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Upload Preview Image
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Select a preview image for the cutting file
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  <Image className="w-4 h-4" />
                  <span>Choose Image</span>
                </label>
                {imageFile && (
                  <p className="mt-3 text-sm text-green-600">
                    Selected: {imageFile.name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Material Selection */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Select Material Type
              </h3>
              {loadingStates.materials ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {materials.map((material) => (
                    <button
                      key={material.id}
                      onClick={() => setSelectedMaterial(material)}
                      className={`p-4 text-left rounded-lg border transition-colors ${selectedMaterial?.id === material.id
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
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Step 3: Each Areal Material Selection */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Old Material
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Enter an old material ID if the material is not registered in the system.
                </p>
                <input
                  type="text"
                  placeholder="Enter Old Material Number"
                  value={oldMaterialNumber}
                  onChange={(e) => {
                    setOldMaterialNumber(e.target.value);
                    if (e.target.value.trim() !== '') {
                      setSelectedEachArealMaterial(null);
                    }
                  }}
                  className="w-full h-[44px] px-4 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200 dark:border-zinc-700"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white dark:bg-zinc-800 text-sm font-medium text-gray-500 dark:text-gray-400">
                    OR
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Select Registered Material Sheet
                </h3>
                {loadingStates.eachArealMaterials ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {eachArealMaterials && eachArealMaterials.length > 0 ? eachArealMaterials.map((eam) => (
                      <button
                        key={eam.id}
                        onClick={() => {
                          setSelectedEachArealMaterial(eam);
                          setOldMaterialNumber('');
                        }}
                        className={`p-4 text-left rounded-lg border transition-colors ${selectedEachArealMaterial?.id === eam.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-zinc-700 hover:border-blue-600'
                          }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {eam.code} - {eam.material_name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Current Size: {eam.current_width}x{eam.current_height} |
                          Status: <span className={
                            eam.finished
                              ? 'text-green-600 font-medium'
                              : eam.started
                                ? 'text-amber-600 font-medium'
                                : 'text-blue-600 font-medium'
                          }>
                            {eam.finished ? 'Finished' : eam.started ? 'Started' : 'Available'}
                          </span>
                        </div>
                      </button>
                    )) : (
                      <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-zinc-700 rounded-lg">
                        No material sheets available for the selected material.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Order Selection */}
          {step === 4 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Select Orders ({selectedOrders.length} selected)
              </h3>
              {loadingStates.orders ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {orders.map((order) => {
                    const bom = order.boms[0];
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
                            <span className="font-medium text-gray-900 dark:text-white">
                              ORD-{order.order_code}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${order.order_status === 'PRE-ACCEPTED'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                              }`}>
                              {order.order_status.replace('-', ' ')}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Size: {bom.width} x {bom.height}
                          </div>

                          {/* Mockup Image */}
                          {(order.mockup_image || order.mockup_modification?.mockup_image || order.mockup?.mockup_image) && (
                            <img
                              src={order.mockup_image || order.mockup_modification?.mockup_image || order.mockup?.mockup_image || ''}
                              alt="Order mockup"
                              className="w-16 h-16 object-cover rounded border border-gray-300 mt-2"
                            />
                          )}



                          {/* Related Cutting Files */}
                          {order.cutting_files && order.cutting_files.length > 0 && (
                            <div className="mt-3">
                              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Existing Cutting Files:
                              </div>
                              <div className="space-y-1">
                                {order.cutting_files.map(cf => (
                                  <div
                                    key={cf.id}
                                    className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-zinc-800 p-1.5 rounded border border-gray-100 dark:border-zinc-700"
                                  >
                                    {cf.on ? `${cf.on.material_name} - Code: ${cf.on.code}` : cf.old_material ? `${cf.old_material.name} - ${cf.old_material_number}` : 'Unknown Material'}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t border-gray-200 dark:border-zinc-700">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          <button
            onClick={() => step < 4 ? setStep(step + 1) : handleSubmit()}
            disabled={!canProceed() || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating...</span>
              </div>
            ) : step < 4 ? (
              'Next'
            ) : (
              'Create Cutting File'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};