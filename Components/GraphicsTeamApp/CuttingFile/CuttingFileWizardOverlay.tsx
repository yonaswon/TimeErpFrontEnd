// CuttingFileWizardOverlay.tsx — shared 6-step wizard for create and edit
import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Upload, FileText, Package, AlertCircle, Layers, Check, Loader2 } from 'lucide-react';
import { CuttingFile, Material, EachArealMaterial, Order } from '@/types/cutting';
import api from '@/api';
import axios from 'axios';

const STEP_LABELS = [
  'Upload Files',
  'Select Material',
  'Select Sheet',
  'Select Orders',
  'Select Layers',
  'Review & Submit',
];

export interface CuttingFileWizardOverlayProps {
  mode: 'create' | 'edit';
  initialFile?: CuttingFile;
  onClose: () => void;
  onSuccess: () => void;
}

export const CuttingFileWizardOverlay = ({
  mode,
  initialFile,
  onClose,
  onSuccess,
}: CuttingFileWizardOverlayProps) => {
  const isEdit = mode === 'edit';

  const existingCrv3dName = useMemo(
    () => (initialFile?.crv3d ? initialFile.crv3d.split('/').pop() || 'file.crv3d' : null),
    [initialFile]
  );
  const existingDxfName = useMemo(
    () => (initialFile?.dxf_file ? initialFile.dxf_file.split('/').pop() || 'file.dxf' : null),
    [initialFile]
  );
  const hasExistingFiles = Boolean(existingCrv3dName && existingDxfName);

  const [step, setStep] = useState(1);
  const [crv3dFile, setCrv3dFile] = useState<File | null>(null);
  const [dxfFile, setDxfFile] = useState<File | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [eachArealMaterials, setEachArealMaterials] = useState<EachArealMaterial[]>([]);
  const [selectedEachArealMaterial, setSelectedEachArealMaterial] = useState<EachArealMaterial | null>(
    initialFile?.on || null
  );
  const [oldMaterialNumber, setOldMaterialNumber] = useState<string>(initialFile?.old_material_number || '');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<number[]>(
    initialFile?.orders.map(o => o.order_code) || []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState({
    materials: false,
    eachArealMaterials: false,
    orders: false,
  });

  const [selectedLayerNumber, setSelectedLayerNumber] = useState<number | null>(
    initialFile?.selected_layer_number ?? null
  );

  const [orderTab, setOrderTab] = useState<'Active' | 'All'>('Active');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [debouncedOrderSearchQuery, setDebouncedOrderSearchQuery] = useState('');

  const [tempId, setTempId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const tempIdRef = useRef<number | null>(null);
  const uploadPromiseRef = useRef<Promise<number | null> | null>(null);
  const materialInitializedRef = useRef(false);
  const linkedOrdersRef = useRef<Order[]>(initialFile?.orders || []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedOrderSearchQuery(orderSearchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [orderSearchQuery]);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoadingStates(prev => ({ ...prev, materials: true }));
        const response = await api.get('/materials/?type=A');
        setMaterials(response.data.results);

        if (isEdit && initialFile && !materialInitializedRef.current) {
          const currentMaterialId = initialFile.on?.material || initialFile.old_material?.id;
          const currentMaterial = response.data.results.find(
            (m: Material) => m.id === currentMaterialId
          );
          if (currentMaterial) {
            setSelectedMaterial(currentMaterial);
          }
          materialInitializedRef.current = true;
        }
      } catch {
        setError('Failed to fetch materials');
      } finally {
        setLoadingStates(prev => ({ ...prev, materials: false }));
      }
    };
    fetchMaterials();
  }, [initialFile, isEdit]);

  useEffect(() => {
    if (selectedMaterial) {
      const fetchEachArealMaterials = async () => {
        try {
          setLoadingStates(prev => ({ ...prev, eachArealMaterials: true }));
          const response = await api.get(
            `/each-areal-materials/?finished=false&material=${selectedMaterial.id}&ordering=-date`
          );
          setEachArealMaterials(response.data);

          if (isEdit && initialFile?.on) {
            const currentEam = response.data.find(
              (eam: EachArealMaterial) => eam.id === initialFile.on?.id
            );
            if (currentEam) {
              setSelectedEachArealMaterial(currentEam);
            }
          } else if (!isEdit) {
            setSelectedEachArealMaterial(null);
          }
        } catch {
          setError('Failed to fetch material sheets');
        } finally {
          setLoadingStates(prev => ({ ...prev, eachArealMaterials: false }));
        }
      };
      fetchEachArealMaterials();
    }
  }, [selectedMaterial, initialFile, isEdit]);

  useEffect(() => {
    if ((selectedEachArealMaterial || oldMaterialNumber.trim() !== '') && selectedMaterial) {
      const fetchOrders = async () => {
        try {
          setLoadingStates(prev => ({ ...prev, orders: true }));
          let url = `/api/orders/?material=${selectedMaterial.id}&ordering=-created_at`;

          if (orderTab === 'Active') {
            url += `&order_status=PRE-ACCEPTED,PRE-CONFIRMED`;
          }

          if (orderTab === 'All' && debouncedOrderSearchQuery.trim() !== '') {
            url += `&search=${encodeURIComponent(debouncedOrderSearchQuery.trim())}`;
          }

          const response = await api.get(url);
          const fetched: Order[] = response.data.results || [];

          const merged = [...fetched];
          const seen = new Set(fetched.map(o => o.order_code));
          for (const linked of linkedOrdersRef.current) {
            if (!seen.has(linked.order_code)) {
              merged.push(linked as Order);
              seen.add(linked.order_code);
            }
          }
          setOrders(merged);
        } catch {
          setError('Failed to fetch orders');
        } finally {
          setLoadingStates(prev => ({ ...prev, orders: false }));
        }
      };
      fetchOrders();
    }
  }, [selectedEachArealMaterial, oldMaterialNumber, selectedMaterial, orderTab, debouncedOrderSearchQuery]);

  useEffect(() => {
    if (!isEdit) {
      setSelectedOrders([]);
    }
  }, [selectedEachArealMaterial, oldMaterialNumber, selectedMaterial, isEdit]);

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

  const handleDxfFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.dxf')) {
        setDxfFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a .dxf file');
      }
    }
  };

  const startBackgroundUpload = async (): Promise<number | null> => {
    abortRef.current?.abort();

    if (tempIdRef.current) {
      api.delete(`/api/cuttingfiles/${tempIdRef.current}/delete-temp/`).catch(() => {});
      setTempId(null);
      tempIdRef.current = null;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setUploading(true);
    setUploadDone(false);
    setUploadError(false);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('crv3d', crv3dFile!);
    formData.append('dxf_file', dxfFile!);

    try {
      const res = await api.post('/api/cuttingfiles/upload-temp/', formData, {
        signal: controller.signal,
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          setUploadProgress(Math.round((e.loaded * 100) / (e.total || 1)));
        },
      });
      setTempId(res.data.temp_id);
      tempIdRef.current = res.data.temp_id;
      setUploadDone(true);
      return res.data.temp_id as number;
    } catch (err) {
      if (!axios.isCancel(err)) {
        setUploadError(true);
      }
      return null;
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (crv3dFile && dxfFile) {
      uploadPromiseRef.current = startBackgroundUpload();
    }
  }, [crv3dFile, dxfFile]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (tempIdRef.current) {
        api.delete(`/api/cuttingfiles/${tempIdRef.current}/delete-temp/`).catch(() => {});
      }
    };
  }, []);

  const handleOrderToggle = (orderCode: number) => {
    setSelectedOrders(prev =>
      prev.includes(orderCode)
        ? prev.filter(code => code !== orderCode)
        : [...prev, orderCode]
    );
  };

  const filesReady = isEdit
    ? hasExistingFiles || (crv3dFile !== null && dxfFile !== null)
    : crv3dFile !== null && dxfFile !== null;

  const displayCrv3dName = crv3dFile?.name || existingCrv3dName;
  const displayDxfName = dxfFile?.name || existingDxfName;
  const filesChanged = crv3dFile !== null || dxfFile !== null;

  const handleSubmit = async () => {
    if (!filesReady || (!selectedEachArealMaterial && oldMaterialNumber.trim() === '') || selectedOrders.length === 0 || selectedLayerNumber === null) {
      setError('Please fill all required fields');
      return;
    }

    if (!isEdit && (!crv3dFile || !dxfFile)) {
      setError('Please upload both CRV3D and DXF files');
      return;
    }

    if (filesChanged && (!crv3dFile || !dxfFile)) {
      setError('Please select both CRV3D and DXF files when replacing');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();

      if (filesChanged) {
        let finalTempId = tempId;
        if (!finalTempId && uploading && uploadPromiseRef.current) {
          finalTempId = await uploadPromiseRef.current;
        }

        if (finalTempId) {
          formData.append('temp_id', finalTempId.toString());
        } else if (crv3dFile && dxfFile) {
          formData.append('crv3d', crv3dFile);
          formData.append('dxf_file', dxfFile);
        }
      }

      if (selectedEachArealMaterial) {
        formData.append('on', selectedEachArealMaterial.id.toString());
      } else if (isEdit) {
        formData.append('on', '');
      }

      if (oldMaterialNumber.trim() !== '' && selectedMaterial) {
        formData.append('old_material_number', oldMaterialNumber.trim());
        formData.append('old_material', selectedMaterial.id.toString());
      } else if (isEdit) {
        formData.append('old_material_number', '');
      }

      selectedOrders.forEach(orderCode => {
        formData.append('orders', orderCode.toString());
      });

      if (selectedLayerNumber !== null) {
        formData.append('selected_layer_number', selectedLayerNumber.toString());
      }

      if (isEdit && initialFile) {
        await api.patch(`/api/cuttingfiles/${initialFile.id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/api/cuttingfiles/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      tempIdRef.current = null;
      onSuccess();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string; error?: string } } };
      setError(apiErr.response?.data?.message || apiErr.response?.data?.error || `Failed to ${isEdit ? 'update' : 'create'} cutting file`);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return filesReady;
      case 2: return selectedMaterial !== null;
      case 3: return selectedEachArealMaterial !== null || oldMaterialNumber.trim() !== '';
      case 4: return selectedOrders.length > 0;
      case 5: return selectedLayerNumber !== null;
      case 6: return true;
      default: return false;
    }
  };

  const totalSteps = 6;
  const title = isEdit ? 'Edit Cutting File' : 'Create Cutting File';
  const submitLabel = isEdit ? 'Save Changes' : 'Create Cutting File';
  const loadingLabel = isEdit ? 'Saving...' : 'Creating...';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= stepNum
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600 dark:bg-zinc-700 dark:text-gray-400'
                  }`}>
                  {step > stepNum ? <Check className="w-4 h-4" /> : stepNum}
                </div>
                {stepNum < totalSteps && (
                  <div className={`w-6 sm:w-10 h-1 mx-1 ${step > stepNum ? 'bg-blue-600' : 'bg-gray-200 dark:bg-zinc-700'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            {STEP_LABELS.map((label, i) => (
              <span key={i} className={`${step === i + 1 ? 'text-blue-600 font-medium' : ''}`}
                style={{ maxWidth: `${100 / totalSteps}%`, textAlign: 'center', fontSize: '0.65rem' }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {step > 1 && filesChanged && (uploading || uploadDone || uploadError) && (
          <div className="px-6 py-2 border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50">
            {uploading && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5 whitespace-nowrap">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Uploading {uploadProgress}%
                </span>
                <div className="flex-1 bg-gray-200 dark:bg-zinc-700 rounded-full h-1">
                  <div className="bg-blue-600 h-1 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
            {uploadDone && (
              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5">
                <Check className="w-3 h-3" />
                Files ready — {isEdit ? 'update' : 'creation'} will be instant
              </span>
            )}
            {uploadError && (
              <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3" />
                Upload failed — will upload on submit
              </span>
            )}
          </div>
        )}

        <div className="p-6 space-y-6">
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              {isEdit && hasExistingFiles && !filesChanged && (
                <div className="p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                  Current files are kept unless you choose new ones below.
                </div>
              )}
              <div className="text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {isEdit ? 'Replace CRV3D File (optional)' : 'Upload CRV3D File'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {isEdit ? 'Keep existing or select a new CRV3D file' : 'Select your cutting file in CRV3D format'}
                </p>
                <input type="file" accept=".crv3d" onChange={handleCrv3dFileSelect} className="hidden" id="crv3d-upload" />
                <label htmlFor="crv3d-upload" className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                  <FileText className="w-4 h-4" />
                  <span>{isEdit ? 'Change CRV3D File' : 'Choose CRV3D File'}</span>
                </label>
                {displayCrv3dName && (
                  <p className="mt-3 text-sm text-green-600">✓ {displayCrv3dName}</p>
                )}
              </div>

              <div className="text-center">
                <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {isEdit ? 'Replace DXF File (optional)' : 'Upload DXF File'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {isEdit ? 'Keep existing or select a new DXF file' : 'Select the exported DXF version with layers'}
                </p>
                <input type="file" accept=".dxf" onChange={handleDxfFileSelect} className="hidden" id="dxf-upload" />
                <label htmlFor="dxf-upload" className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                  <Layers className="w-4 h-4" />
                  <span>{isEdit ? 'Change DXF File' : 'Choose DXF File'}</span>
                </label>
                {displayDxfName && (
                  <p className="mt-3 text-sm text-green-600">✓ {displayDxfName}</p>
                )}
              </div>

              {filesChanged && crv3dFile && dxfFile && (
                <div className="mt-4 p-3 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50">
                  {uploading && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Uploading files... {uploadProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-1.5">
                        <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}
                  {uploadDone && (
                    <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                      <Check className="w-3.5 h-3.5" />
                      Files uploaded — ready for instant {isEdit ? 'update' : 'creation'}
                    </span>
                  )}
                  {uploadError && (
                    <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Upload failed — will upload on submit
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Select Material Type</h3>
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
                      <div className="font-medium text-gray-900 dark:text-white">{material.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Available: {material.available} | Size: {material.width}x{material.height}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Old Material</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Enter an old material ID if the material is not registered in the system.
                </p>
                <input
                  type="text"
                  placeholder="Enter Old Material Number"
                  value={oldMaterialNumber}
                  onChange={(e) => {
                    setOldMaterialNumber(e.target.value);
                    if (e.target.value.trim() !== '') setSelectedEachArealMaterial(null);
                  }}
                  className="w-full h-[44px] px-4 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200 dark:border-zinc-700"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white dark:bg-zinc-800 text-sm font-medium text-gray-500 dark:text-gray-400">OR</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Select Registered Material Sheet</h3>
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
                        <div className="font-medium text-gray-900 dark:text-white">{eam.code} - {eam.material_name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Current Size: {eam.current_width}x{eam.current_height} |
                          Status: <span className={eam.finished ? 'text-green-600 font-medium' : eam.started ? 'text-amber-600 font-medium' : 'text-blue-600 font-medium'}>
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

          {step === 4 && (
            <div className="flex flex-col h-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-3 sm:space-y-0">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white whitespace-nowrap">
                  Select Orders <span className="text-sm font-normal text-gray-500">({selectedOrders.length} selected)</span>
                </h3>
                <div className="flex w-full sm:w-auto space-x-2">
                  <div className="flex space-x-2 bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
                    <button onClick={() => setOrderTab('Active')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${orderTab === 'Active' ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>Active</button>
                    <button onClick={() => setOrderTab('All')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${orderTab === 'All' ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>All</button>
                  </div>
                </div>
              </div>
              {orderTab === 'All' && (
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search by order code or name..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 dark:text-gray-200"
                  />
                </div>
              )}
              {loadingStates.orders ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {orders.map((order) => {
                    const bom = order.boms[0];
                    return (
                      <label key={order.order_code} className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-blue-600 cursor-pointer transition-colors">
                        <input type="checkbox" checked={selectedOrders.includes(order.order_code)} onChange={() => handleOrderToggle(order.order_code)} className="mt-1 text-blue-600 rounded" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 dark:text-white">ORD-{order.order_code}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${order.order_status === 'PRE-ACCEPTED' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                              {order.order_status.replace('-', ' ')}
                            </span>
                          </div>
                          {order.order_name && (
                            <div className="text-sm text-gray-800 dark:text-gray-300 mt-0.5 font-medium">{order.order_name}</div>
                          )}
                          {bom && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Size: {bom.width} x {bom.height}</div>
                          )}
                          {(order.mockup_image || order.mockup_modification?.mockup_image || order.mockup?.mockup_image) && (
                            <img src={order.mockup_image || order.mockup_modification?.mockup_image || order.mockup?.mockup_image || ''} alt="Order mockup" className="w-16 h-16 object-cover rounded border border-gray-300 mt-2" />
                          )}
                          {order.cutting_files && order.cutting_files.length > 0 && (
                            <div className="mt-3">
                              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Existing Cutting Files:</div>
                              <div className="space-y-1">
                                {order.cutting_files.map(cf => (
                                  <div key={cf.id} className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-zinc-800 p-1.5 rounded border border-gray-100 dark:border-zinc-700">
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

          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Select Active Cut Layer</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Which layer number is the current cut on your DXF file?</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                  const isSelected = selectedLayerNumber === num;
                  return (
                    <button
                      key={num}
                      onClick={() => setSelectedLayerNumber(num)}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-red-500 bg-red-50 dark:bg-red-900/20 ring-2 ring-red-500/30' : 'border-gray-200 dark:border-zinc-700 hover:border-blue-400 bg-white dark:bg-zinc-800'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${isSelected ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300'}`}>{num}</div>
                        <span className={`font-medium text-sm ${isSelected ? 'text-red-700 dark:text-red-300' : 'text-gray-900 dark:text-white'}`}>Layer {num}</span>
                      </div>
                      {isSelected && <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full uppercase">Active</span>}
                    </button>
                  );
                })}
              </div>
              {selectedLayerNumber !== null && (
                <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">Layer {selectedLayerNumber} selected as active cut</p>
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">The actual layer name will be resolved from your DXF file automatically.</p>
                </div>
              )}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Review Cutting File</h3>
              <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <Loader2 className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {filesChanged || !isEdit ? 'Preview will be generated after save' : 'Preview will be re-generated if analysis fields changed'}
                  </p>
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">DXF analysis, detection image, and line image are processed in the background.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                  <div className="text-gray-500 dark:text-gray-400">CRV3D File</div>
                  <div className="font-medium text-gray-900 dark:text-white truncate">{displayCrv3dName || 'N/A'}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                  <div className="text-gray-500 dark:text-gray-400">DXF File</div>
                  <div className="font-medium text-gray-900 dark:text-white truncate">{displayDxfName || 'N/A'}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                  <div className="text-gray-500 dark:text-gray-400">Material</div>
                  <div className="font-medium text-gray-900 dark:text-white">{selectedMaterial?.name || 'N/A'}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                  <div className="text-gray-500 dark:text-gray-400">Sheet</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {selectedEachArealMaterial ? `${selectedEachArealMaterial.code} - ${selectedEachArealMaterial.material_name}` : oldMaterialNumber || 'N/A'}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                  <div className="text-gray-500 dark:text-gray-400">Active Layer</div>
                  <div className="font-medium text-red-600">{selectedLayerNumber !== null ? `Layer ${selectedLayerNumber}` : 'None'}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                  <div className="text-gray-500 dark:text-gray-400">Orders</div>
                  <div className="font-medium text-gray-900 dark:text-white">{selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between p-6 border-t border-gray-200 dark:border-zinc-700">
          <button onClick={() => step > 1 ? setStep(step - 1) : onClose()} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors">
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          <button
            onClick={() => step < totalSteps ? setStep(step + 1) : handleSubmit()}
            disabled={!canProceed() || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{uploading ? `Waiting for upload... ${uploadProgress}%` : loadingLabel}</span>
              </div>
            ) : step < totalSteps ? (
              'Next'
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
