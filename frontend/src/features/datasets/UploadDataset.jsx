import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, Database, Settings, FileText, 
  CheckCircle2, AlertCircle, Loader2, ChevronRight, 
  BarChart3, Clock, Sparkles
} from 'lucide-react';
import { formatISTDateTime } from '../../utils/dateUtils';
import { API_BASE_URL as CORE_API_URL } from '../../api/core';

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

  // Derive backend origin from configured env variable (strip /api/v1 if present)
  const API_BASE_URL = CORE_API_URL.replace(/\/api\/v1\/?$/, '');

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
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto text-slate-200">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
              <Database className="h-5 w-5" />
            </div>
            Data Ingestion Pipeline
          </h1>
          <p className="text-slate-400 mt-1.5 text-xs max-w-2xl">
            Upload raw customer feedback. The pipeline parses, cleans, and structures your data for autonomous AI analysis.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5" />
          Pipeline Ready
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Upload & Config Area (Spans 2 columns) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Dropzone */}
          <div className="bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden shadow-lg">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-purple-400" /> Source File
            </h2>
            
            <div className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all duration-200 ${
              selectedFile ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/[0.1] hover:border-purple-500/40 bg-white/[0.02]'
            }`}>
              
              <input 
                type="file" accept=".csv" onChange={handleFileChange}
                className="hidden" id="file-upload"
              />
              
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center w-full text-center">
                {selectedFile ? (
                  <>
                    <div className="h-14 w-14 bg-purple-500/20 border border-purple-500/30 rounded-2xl flex items-center justify-center mb-3">
                      <FileText className="h-7 w-7 text-purple-300" />
                    </div>
                    <span className="text-base font-semibold text-purple-300">{selectedFile.name}</span>
                    <span className="text-xs text-slate-400 mt-1 font-mono">{(selectedFile.size / 1024).toFixed(2)} KB • CSV Format</span>
                    <span className="text-xs text-slate-400 mt-3 underline hover:text-white">Click to change file</span>
                  </>
                ) : (
                  <>
                    <div className="h-14 w-14 bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center justify-center mb-3 group-hover:border-purple-500/40 transition-colors">
                      <UploadCloud className="h-7 w-7 text-slate-400" />
                    </div>
                    <span className="text-base font-semibold text-white">Click to browse or drag file here</span>
                    <span className="text-xs text-slate-400 mt-1">Supports CSV customer feedback batches (.csv)</span>
                  </>
                )}
              </label>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-rose-300 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </div>

          {/* Configuration Panel */}
          <div className="bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 shadow-lg">
            <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
              <Settings className="h-4 w-4 text-purple-400" /> Configuration
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Dataset Name</label>
                <input 
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  placeholder="e.g., Q3_Feedback_Batch"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/40 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Schema Format</label>
                <div className="flex items-center gap-4 h-[38px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={hasHeaders}
                      onChange={(e) => setHasHeaders(e.target.checked)}
                      className="rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500/20 w-4 h-4"
                    />
                    <span className="text-xs text-slate-300">File Contains Column Headers</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-white/[0.06] flex justify-end">
              <button 
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20 cursor-pointer"
              >
                {isUploading ? (
                  <><Loader2 className="animate-spin h-3.5 w-3.5" /> Ingesting Dataset...</>
                ) : (
                  <>Start Ingestion <ChevronRight className="h-3.5 w-3.5" /></>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Pipeline Status (Right Column) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 h-full shadow-lg">
            <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-400" /> Ingestion Status
            </h2>

            <div className="space-y-6">
              {/* Pipeline Steps Tracker */}
              <div className="relative border-l border-white/[0.08] ml-3 space-y-6 pb-2">
                {[
                  { step: 1, label: 'Uploading File', desc: 'Ingesting to workspace repository' },
                  { step: 2, label: 'Parsing Schema', desc: 'Detecting columns & data types' },
                  { step: 3, label: 'AI Cleaning', desc: 'Sanitizing & imputing missing data' },
                  { step: 4, label: 'Ready for Analysis', desc: 'Stored & canonicalized' }
                ].map((item) => (
                  <div key={item.step} className="relative pl-6">
                    <div className={`absolute -left-[11px] top-1 h-5 w-5 rounded-full border-2 flex items-center justify-center bg-[#090d1c] ${
                      uploadStep > item.step ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : 
                      uploadStep === item.step ? 'border-purple-500 border-t-transparent animate-spin' : 'border-white/20'
                    }`}>
                      {uploadStep > item.step && <CheckCircle2 className="h-3 w-3" />}
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${uploadStep >= item.step ? 'text-white' : 'text-slate-400'}`}>
                        {item.label}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-5 border-t border-white/[0.06]">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">System Metrics</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.03] p-3 rounded-xl border border-white/[0.06]">
                    <p className="text-[10px] text-slate-400 mb-0.5">Avg Processing</p>
                    <p className="text-base font-bold text-white">1.2s</p>
                  </div>
                  <div className="bg-white/[0.03] p-3 rounded-xl border border-white/[0.06]">
                    <p className="text-[10px] text-slate-400 mb-0.5">Success Rate</p>
                    <p className="text-base font-bold text-emerald-400">99.8%</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* History Table Section */}
      <div className="bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg mt-2">
        <div className="px-6 py-4 border-b border-white/[0.06] flex justify-between items-center bg-white/[0.02]">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-400" /> Recent Batch Ingestions
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] text-slate-400 font-mono uppercase bg-white/[0.03]">
              <tr>
                <th className="px-6 py-3.5 font-semibold">Batch ID</th>
                <th className="px-6 py-3.5 font-semibold">Timestamp</th>
                <th className="px-6 py-3.5 font-semibold">Status</th>
                <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isLoadingBatches ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-purple-400" />
                    Fetching records...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-slate-500">
                    No datasets processed yet. Start by uploading a CSV.
                  </td>
                </tr>
              ) : (
                batches.map((batch, index) => (
                  <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-3.5 font-mono text-slate-300">
                      {batch.batch_id?.substring(0,8) || batch._id?.substring(0,8) || `BCH-${1000+index}`}...
                    </td>
                    <td className="px-6 py-3.5 text-slate-400">
                      {batch.uploaded_at ? formatISTDateTime(batch.uploaded_at) : 'Recently'}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Ingested
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button 
                        onClick={() => handleViewData(batch.batch_id || batch._id)}
                        className="text-purple-300 hover:text-white font-medium text-xs hover:underline cursor-pointer"
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