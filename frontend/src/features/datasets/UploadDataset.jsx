import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, Database, Settings, FileText, 
  CheckCircle2, AlertCircle, Loader2, ChevronRight, 
  BarChart3, Clock, Sparkles
} from 'lucide-react';
import { formatISTDateTime } from '../../utils/dateUtils';

const UploadDataset = () => {
  const [batches, setBatches] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState(0); // For pipeline animation
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);
  const [error, setError] = useState('');

  // UI Configuration States
  const [datasetName, setDatasetName] = useState('');
  const [hasHeaders, setHasHeaders] = useState(true);

  const API_BASE_URL = 'http://127.0.0.1:8000';

  // 1. Fetch previous CSV Batches from Backend
  const fetchBatches = async () => {
    try {
      setIsLoadingBatches(true);
      const response = await fetch(`${API_BASE_URL}/batches`);
      if (!response.ok) throw new Error('Failed to fetch batches');
      const data = await response.json();
      setBatches(data);
    } catch (err) {
      console.error(err);
      setError('Could not load history. Is backend running?');
    } finally {
      setIsLoadingBatches(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // 2. Handle File Selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file);
      setDatasetName(file.name.replace('.csv', ''));
      setError('');
    } else {
      setSelectedFile(null);
      setError('Invalid file type. Please upload a .csv file.');
    }
  };

  // 3. Upload File to Backend
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      setIsUploading(true);
      setError('');
      setUploadStep(1); // Uploading
      
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulate pipeline steps for UI
      const parseTimer = setTimeout(() => setUploadStep(2), 1500); // Parsing
      const cleanTimer = setTimeout(() => setUploadStep(3), 3000); // Cleaning

      const response = await fetch(`${API_BASE_URL}/upload_csv`, {
        method: 'POST',
        body: formData
      });

      // Clear timers if response comes back faster
      clearTimeout(parseTimer);
      clearTimeout(cleanTimer);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed due to backend error');
      }

      setUploadStep(4); // Complete
      setTimeout(() => {
        setSelectedFile(null);
        setDatasetName('');
        setIsUploading(false);
        setUploadStep(0);
        fetchBatches(); // Refresh table
      }, 2000);
      
    } catch (err) {
      console.error("Upload Error:", err);
      setError(err.message);
      setIsUploading(false);
      setUploadStep(0); // Reset animation on error
    }
  };

  // 4. View Data Function
  const handleViewData = async (batchId) => {
    try {
      alert("Fetching cleaned data from backend... Check your browser console!");
      const response = await fetch(`${API_BASE_URL}/batches/${batchId}/cleaned`);
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data = await response.json();
      console.log("✅ Cleaned Data for Batch", batchId, ":", data);
      
      alert(`Successfully fetched ${data.length} cleaned rows!\nPress F12 to see the actual JSON data in the browser console.`);
      
    } catch (err) {
      console.error(err);
      alert("Error fetching data: " + err.message);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto text-gray-200">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Database className="h-8 w-8 text-emerald-500" />
            Data Ingestion Pipeline
          </h1>
          <p className="text-gray-400 mt-2 text-sm max-w-2xl">
            Upload raw product datasets. Our AI pipeline will automatically parse, clean, and structure your data for intelligence extraction.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          AI Engine Online
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Upload & Config Area (Spans 2 columns) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Dropzone */}
          <div className="bg-[#0f1115] border border-gray-800 rounded-2xl p-6 relative overflow-hidden group">
            <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-gray-400" /> Source File
            </h2>
            
            <div className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all duration-200
              ${selectedFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-gray-700 hover:border-gray-500 bg-[#16191e]'}`}>
              
              <input 
                type="file" accept=".csv" onChange={handleFileChange}
                className="hidden" id="file-upload"
              />
              
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center w-full text-center">
                {selectedFile ? (
                  <>
                    <div className="h-16 w-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                      <FileText className="h-8 w-8 text-emerald-400" />
                    </div>
                    <span className="text-lg font-medium text-emerald-400">{selectedFile.name}</span>
                    <span className="text-sm text-gray-500 mt-1">{(selectedFile.size / 1024).toFixed(2)} KB • CSV Format</span>
                    <span className="text-xs text-gray-400 mt-4 underline hover:text-white">Click to change file</span>
                  </>
                ) : (
                  <>
                    <div className="h-16 w-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-gray-700 transition-colors">
                      <UploadCloud className="h-8 w-8 text-gray-400" />
                    </div>
                    <span className="text-lg font-medium text-white">Click to browse or drag file here</span>
                    <span className="text-sm text-gray-500 mt-2">Supports raw product catalogs (.csv)</span>
                  </>
                )}
              </label>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </div>

          {/* Configuration Panel */}
          <div className="bg-[#0f1115] border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-400" /> Pipeline Configuration
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Dataset Alias</label>
                <input 
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  placeholder="e.g., Q3_Electronics_Catalog"
                  className="w-full bg-[#16191e] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Data Schema Options</label>
                <div className="flex items-center gap-4 h-[42px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={hasHeaders}
                      onChange={(e) => setHasHeaders(e.target.checked)}
                      className="rounded border-gray-700 bg-gray-800 text-emerald-500 focus:ring-emerald-500/20 w-4 h-4"
                    />
                    <span className="text-sm text-gray-300">Contains Headers</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-800 flex justify-end">
              <button 
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-medium py-2.5 px-6 rounded-lg transition-all flex items-center gap-2"
              >
                {isUploading ? (
                  <><Loader2 className="animate-spin h-4 w-4" /> Processing Pipeline...</>
                ) : (
                  <>Start Ingestion <ChevronRight className="h-4 w-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Pipeline Status (Right Column) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0f1115] border border-gray-800 rounded-2xl p-6 h-full">
            <h2 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-400" /> Live Status
            </h2>

            <div className="space-y-6">
              {/* Pipeline Steps Tracker */}
              <div className="relative border-l border-gray-800 ml-3 space-y-8 pb-4">
                {[
                  { step: 1, label: 'Uploading File', desc: 'Transferring to secure vault' },
                  { step: 2, label: 'Parsing Schema', desc: 'Detecting columns & types' },
                  { step: 3, label: 'AI Cleaning', desc: 'Handling nulls & duplicates' },
                  { step: 4, label: 'Ready for Intelligence', desc: 'Saved to Master DB' }
                ].map((item) => (
                  <div key={item.step} className="relative pl-6">
                    <div className={`absolute -left-[11px] top-1 h-5 w-5 rounded-full border-2 flex items-center justify-center bg-[#0f1115]
                      ${uploadStep > item.step ? 'border-emerald-500 bg-emerald-500/20 text-emerald-500' : 
                        uploadStep === item.step ? 'border-blue-500 border-t-transparent animate-spin' : 'border-gray-700'}`}>
                      {uploadStep > item.step && <CheckCircle2 className="h-3 w-3" />}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${uploadStep >= item.step ? 'text-white' : 'text-gray-500'}`}>
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="mt-8 pt-6 border-t border-gray-800">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">System Metrics</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#16191e] p-3 rounded-lg border border-gray-800">
                    <p className="text-xs text-gray-400 mb-1">Avg. Process Time</p>
                    <p className="text-lg font-medium text-white">1.2s</p>
                  </div>
                  <div className="bg-[#16191e] p-3 rounded-lg border border-gray-800">
                    <p className="text-xs text-gray-400 mb-1">Success Rate</p>
                    <p className="text-lg font-medium text-emerald-400">99.8%</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* History Table Section */}
      <div className="bg-[#0f1115] border border-gray-800 rounded-2xl overflow-hidden mt-4">
        <div className="px-6 py-5 border-b border-gray-800 flex justify-between items-center bg-[#16191e]/50">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-400" /> Processing History
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 uppercase bg-[#16191e]">
              <tr>
                <th className="px-6 py-4 font-medium">Batch ID</th>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoadingBatches ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Fetching records...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    No datasets processed yet. Start by uploading a CSV.
                  </td>
                </tr>
              ) : (
                batches.map((batch, index) => (
                  <tr key={index} className="hover:bg-[#16191e]/80 transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-300">
                      {/* FIXED: Priority to batch_id from backend pipeline */}
                      {batch.batch_id?.substring(0,8) || batch._id?.substring(0,8) || `BCH-${1000+index}`}...
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {batch.uploaded_at ? formatISTDateTime(batch.uploaded_at) : 'Recently'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Cleaned
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* FIXED: Sending correct ID to backend API */}
                      <button 
                        onClick={() => handleViewData(batch.batch_id || batch._id)}
                        className="text-emerald-400 hover:text-emerald-300 font-medium text-xs hover:underline"
                      >
                        View Data
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default UploadDataset;