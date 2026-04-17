// SearchFitSidebar.tsx
// Search & Fit: Upload a design DXF, find the top 3 best-fitting started sheets.
import React, { useState } from 'react';
import { X, Upload, Search, Target, Maximize2, ArrowRight, Layers, BarChart3 } from 'lucide-react';
import api from '@/api';
import { PlacementSuggestion, Material } from '@/types/cutting';

interface SearchFitSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  materials: Material[];
}

export const SearchFitSidebar: React.FC<SearchFitSidebarProps> = ({ isOpen, onClose, materials }) => {
  const [dxfFile, setDxfFile] = useState<File | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlacementSuggestion[]>([]);
  const [sheetsSearched, setSheetsSearched] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.dxf')) {
      setDxfFile(file);
      setError(null);
    } else {
      setError('Please select a .dxf file');
    }
  };

  const handleSearch = async () => {
    if (!dxfFile || !selectedMaterialId) {
      setError('Please select a DXF file and material');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      const formData = new FormData();
      formData.append('design_dxf', dxfFile);
      formData.append('material_id', selectedMaterialId.toString());

      const response = await api.post('/api/cuttingfiles/search_fit/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResults(response.data.results || []);
      setSheetsSearched(response.data.sheets_searched || 0);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDxfFile(null);
    setSelectedMaterialId(null);
    setResults([]);
    setHasSearched(false);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Sidebar Panel */}
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Search & Fit</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Find optimal sheet placement</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Step 1: Upload DXF */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Design DXF File</span>
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".dxf"
                onChange={handleFileSelect}
                className="hidden"
                id="search-dxf-upload"
              />
              <label
                htmlFor="search-dxf-upload"
                className={`flex items-center justify-center w-full py-4 px-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  dxfFile
                    ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-zinc-600 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10'
                }`}
              >
                {dxfFile ? (
                  <div className="text-center">
                    <Layers className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <span className="text-sm text-green-700 dark:text-green-400 font-medium">{dxfFile.name}</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <span className="text-sm text-gray-500">Click to upload DXF</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Step 2: Select Material */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
              <Maximize2 className="w-4 h-4" />
              <span>Material Type</span>
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
              {materials.filter(m => m.type === 'A').map(material => (
                <button
                  key={material.id}
                  onClick={() => setSelectedMaterialId(material.id)}
                  className={`text-left p-3 rounded-lg border text-sm transition-all ${
                    selectedMaterialId === material.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                      : 'border-gray-200 dark:border-zinc-700 hover:border-purple-300'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">{material.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={!dxfFile || !selectedMaterialId || loading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                <span>Searching started sheets...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Find Best Fit</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Results */}
          {hasSearched && !loading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Top {results.length} Results
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {sheetsSearched} sheet{sheetsSearched !== 1 ? 's' : ''} searched
                </span>
              </div>

              {results.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Target className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No suitable placements found</p>
                  <p className="text-xs mt-1">Try a different material or design</p>
                </div>
              ) : (
                results.map((result, index) => (
                  <div
                    key={`${result.sheet_id}-${index}`}
                    className={`rounded-xl border overflow-hidden transition-all ${
                      index === 0
                        ? 'border-purple-400 dark:border-purple-600 shadow-lg shadow-purple-100 dark:shadow-purple-900/20'
                        : 'border-gray-200 dark:border-zinc-700'
                    }`}
                  >
                    {/* Rank Badge */}
                    <div className={`px-4 py-2 flex items-center justify-between ${
                      index === 0
                        ? 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30'
                        : 'bg-gray-50 dark:bg-zinc-800'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-300 dark:bg-zinc-600 text-gray-700 dark:text-gray-300'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          Sheet #{result.sheet_code}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {result.material_name}
                      </span>
                    </div>

                    {/* Preview Image */}
                    {result.preview_image && (
                      <div className="bg-black/5 dark:bg-white/5 p-2">
                        <img
                          src={result.preview_image}
                          alt={`Placement on sheet ${result.sheet_code}`}
                          className="w-full h-auto rounded-lg"
                        />
                      </div>
                    )}

                    {/* Stats */}
                    <div className="p-4 space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Current</div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {result.current_usage_pct.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">After Fit</div>
                          <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {result.new_usage_pct.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Waste ↓</div>
                          <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                            {result.waste_reduction_pct.toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      {/* Usage Bar */}
                      <div className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full relative">
                          <div
                            className="absolute inset-y-0 left-0 bg-gray-400 dark:bg-zinc-500 rounded-full"
                            style={{ width: `${result.current_usage_pct}%` }}
                          />
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all"
                            style={{ width: `${result.new_usage_pct}%` }}
                          />
                        </div>
                      </div>

                      {result.rotation !== 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          Rotated {result.rotation}°
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {results.length > 0 && (
                <button
                  onClick={handleReset}
                  className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Search Again
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
