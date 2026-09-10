import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { FileText, Trash2, Eye, CheckCircle, Clock, AlertTriangle, UploadCloud, Loader2, X, Database } from 'lucide-react';

export default function DatasetList() {
  const { isDark } = useOutletContext();
  const navigate = useNavigate();
  const { workspaceId } = useParams(); 
  
  const [datasets, setDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // States for View Data Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/batches');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setDatasets(data);
      } catch (error) {
        console.error("Error fetching datasets:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBatches();
  }, []);

  
  const handleViewData = async (batchId) => {
    setIsModalOpen(true);
    setIsLoadingData(true);
    setSelectedData(null);
    try {
      const response = await fetch(`http://127.0.0.1:8000/batches/${batchId}/cleaned`);
      if (!response.ok) throw new Error('Data fetch failed');
      const data = await response.json();
      
      
      setSelectedData(data && data.length > 0 ? data : { message: "No data found or file is empty." });
    } catch (error) {
      console.error(error);
      setSelectedData({ error: "Failed to load data from backend." });
    } finally {
      setIsLoadingData(false);
    }
  };

  
  const handleDelete = (batchId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this dataset?");
    if (confirmDelete) {
      setDatasets(datasets.filter(d => (d._id || d.batch_id) !== batchId));
    }
  };

  const getStatusBadge = (status) => {
    const currentStatus = status?.toUpperCase() || 'UNKNOWN';
    switch (currentStatus) {
      case 'CLEANED':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#00FFA3]/10 text-[#00FFA3] border border-[#00FFA3]/20"><CheckCircle className="h-3.5 w-3.5" /> Cleaned</span>;
      case 'PARSED':
      case 'RAW_STORED':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"><Clock className="h-3.5 w-3.5" /> Processing</span>;
      default:
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20"><AlertTriangle className="h-3.5 w-3.5" /> {currentStatus}</span>;
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 relative">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Datasets
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage your uploaded CSV files and check their processing status.
          </p>
        </div>
        
        <button 
          onClick={() => navigate(`/workspace/${workspaceId}/data/upload`)} 
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#00FFA3] text-black hover:bg-[#00FFA3]/90 transition-all shadow-[0_0_15px_rgba(0,255,163,0.3)] hover:shadow-[0_0_25px_rgba(0,255,163,0.5)]"
        >
          <UploadCloud className="h-4 w-4" />
          Upload New Dataset
        </button>
      </div>

      {/* Table Section */}
      <div className={`flex-1 rounded-2xl border overflow-hidden transition-colors flex flex-col backdrop-blur-sm ${isDark ? 'bg-[#0a0a0a]/60 border-white/10' : 'bg-white border-gray-200'}`}>
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-[#00FFA3]" />
            <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Syncing datasets from backend...</p>
          </div>
        ) : datasets.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className={`p-4 rounded-full mb-4 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
              <Database className={`h-8 w-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-lg font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>No datasets found</h3>
            <button 
              onClick={() => navigate(`/workspace/${workspaceId}/data/upload`)} 
              className="text-[#00FFA3] text-sm font-medium hover:text-[#00FFA3]/80"
            >
              Upload your first CSV &rarr;
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`text-xs uppercase tracking-wider ${isDark ? 'bg-white/5 text-gray-400 border-b border-white/10' : 'bg-gray-100 text-gray-500 border-b border-gray-200'}`}>
                  <th className="px-6 py-4 font-medium">Filename</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Rows (Valid / Total)</th>
                  <th className="px-6 py-4 font-medium">Upload Date</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
                {datasets.map((dataset) => {
                  const batchId = dataset._id || dataset.batch_id;
                  return (
                    <tr key={batchId} className={`group transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isDark ? 'bg-black/50 border border-white/5' : 'bg-white border shadow-sm'}`}>
                            <FileText className="h-5 w-5 text-[#00FFA3]" />
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{dataset.filename || 'Unknown File'}</p>
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>ID: {batchId.substring(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(dataset.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{dataset.valid_rows?.toLocaleString() || 0}</span>
                          <span className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>/ {dataset.total_rows?.toLocaleString() || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(dataset.uploaded_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          
                          {/* View Button */}
                          <button 
                            onClick={() => handleViewData(batchId)}
                            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-300 hover:text-[#00FFA3]' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'}`} title="View Data"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {/* Delete Button */}
                          <button 
                            onClick={() => handleDelete(batchId)}
                            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-rose-500/20 text-gray-400 hover:text-rose-400' : 'hover:bg-rose-100 text-gray-500 hover:text-rose-600'}`} title="Delete Dataset"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`w-full max-w-4xl max-h-[80vh] rounded-2xl border flex flex-col overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] ${isDark ? 'bg-[#0a0a0a] border-[#00FFA3]/20' : 'bg-white border-gray-200'}`}>
            
            <div className={`flex justify-between items-center p-4 border-b ${isDark ? 'border-white/10 bg-black/50' : 'border-gray-200'}`}>
              <h3 className={`font-semibold text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <Database className="h-5 w-5 text-[#00FFA3]" />
                Cleaned Data Preview
              </h3>
              <button onClick={() => setIsModalOpen(false)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500'}`}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className={`p-6 overflow-y-auto flex-1 ${isDark ? 'bg-[#050505]' : 'bg-gray-50'}`}>
              {isLoadingData ? (
                <div className="flex flex-col items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-[#00FFA3] mb-4" />
                  <p className="text-gray-400 text-sm font-medium">Fetching cleaned data from server...</p>
                </div>
              ) : (
                <pre className={`text-sm p-6 rounded-xl overflow-x-auto shadow-inner ${isDark ? 'bg-[#000000] text-[#00FFA3] border border-white/10' : 'bg-gray-900 text-emerald-400'}`}>
                  {JSON.stringify(selectedData, null, 2)}
                </pre>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}