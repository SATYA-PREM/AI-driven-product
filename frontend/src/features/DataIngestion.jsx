import { useState, useRef } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { UploadCloud, FileJson, CheckCircle2, Loader2, Server, BrainCircuit } from 'lucide-react';

export default function DataIngestion() {
  const navigate = useNavigate();
  const { workspaceId } = useParams(); // URL se workspace ID nikalne ke liye
  
  // Safe context extraction (Agar bahar use hua toh crash nahi hoga)
  const context = useOutletContext();
  const isDark = context?.isDark ?? true; 
  
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState('idle');
  const [currentStep, setCurrentStep] = useState(0);

  const themeBg = isDark ? 'bg-[#0a0a0a]/80 border-white/10' : 'bg-white/90 border-gray-200 shadow-xl';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const accent = isDark ? 'text-[#00FFA3]' : 'text-blue-600';

  const processingSteps = [
    { name: "Uploading Telemetry Data...", icon: UploadCloud },
    { name: "Sanitizing & Validating Dataset", icon: Server },
    { name: "Running Semantic AI Analysis", icon: BrainCircuit },
    { name: "Compiling Intelligence Insights", icon: CheckCircle2 }
  ];

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(); 
    }
  };

  const handleUpload = () => {
    setUploadState('processing');
    
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setCurrentStep(step);
      
      if (step >= processingSteps.length) {
        clearInterval(interval);
        setUploadState('complete');
        
        // Processing complete hone ke baad proper workspace dashboard par redirect
        setTimeout(() => {
          navigate(`/workspace/${workspaceId || 'default'}/intelligence/insights`); 
        }, 1500);
      }
    }, 1200); 
  };

  const preventDefaults = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className={`min-h-full flex items-center justify-center p-6 ${isDark ? 'bg-[#050505]' : 'bg-gray-50'}`}>
      <div className="w-full max-w-4xl flex flex-col gap-8 animate-fade-in-up">
        
        <div className="text-center space-y-2">
          <h1 className={`text-3xl font-black tracking-tight ${textMain}`}>Initialize Data Pipeline</h1>
          <p className={`text-sm font-medium max-w-lg mx-auto ${textMuted}`}>
            Upload your product telemetry (CSV/JSON). Our deterministic engine will process, clean, and map the data into actionable intelligence.
          </p>
        </div>

        <div className={`p-8 rounded-[2rem] border backdrop-blur-3xl transition-all relative overflow-hidden ${themeBg}`}>
          
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] blur-[150px] opacity-10 pointer-events-none ${isDark ? 'bg-[#00FFA3]' : 'bg-blue-500'}`}></div>

          {uploadState === 'idle' && (
            <>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={onFileChange} 
                className="hidden" 
                accept=".csv,.json,.xlsx"
              />
              
              <div 
                onDragEnter={(e) => { preventDefaults(e); setIsDragging(true); }}
                onDragLeave={(e) => { preventDefaults(e); setIsDragging(false); }}
                onDragOver={preventDefaults}
                onDrop={(e) => { preventDefaults(e); setIsDragging(false); triggerFileSelect(); }}
                onClick={triggerFileSelect}
                className={`relative z-10 border-2 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
                  isDragging 
                    ? (isDark ? 'border-[#00FFA3] bg-[#00FFA3]/5' : 'border-blue-500 bg-blue-50')
                    : (isDark ? 'border-white/20 hover:border-[#00FFA3]/50 hover:bg-white/5' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50')
                }`}
              >
                <div className={`w-16 h-16 mb-4 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'}`}>
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${textMain}`}>Drag & Drop Dataset</h3>
                <p className={`text-sm mb-6 ${textMuted}`}>Support for .CSV, .JSON, or .XLSX (Max 50MB)</p>
                
                <div className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-transform hover:scale-105 ${isDark ? 'bg-[#00FFA3] text-black' : 'bg-blue-600 text-white'}`}>
                  Browse Files
                </div>
              </div>
            </>
          )}

          {uploadState !== 'idle' && (
            <div className="relative z-10 py-10 px-4 flex flex-col items-center">
              <div className="relative mb-12">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${isDark ? 'border-[#00FFA3]/30 bg-black' : 'border-blue-200 bg-white'}`}>
                  {uploadState === 'processing' ? (
                    <Loader2 className={`w-12 h-12 animate-spin ${accent}`} />
                  ) : (
                    <CheckCircle2 className={`w-12 h-12 ${accent}`} />
                  )}
                </div>
                {uploadState === 'processing' && (
                  <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${isDark ? 'bg-[#00FFA3]' : 'bg-blue-600'}`}></div>
                )}
              </div>

              <div className="w-full max-w-md space-y-6">
                {processingSteps.map((step, idx) => {
                  const isCompleted = currentStep > idx;
                  const isActive = currentStep === idx;
                  const isPending = currentStep < idx;
                  
                  return (
                    <div key={idx} className={`flex items-center gap-4 transition-all duration-500 ${isPending ? 'opacity-30' : 'opacity-100'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-colors ${
                        isCompleted ? (isDark ? 'bg-[#00FFA3]/20 border-[#00FFA3] text-[#00FFA3]' : 'bg-emerald-100 border-emerald-500 text-emerald-600') :
                        isActive ? (isDark ? 'bg-white/10 border-[#00FFA3] text-white shadow-[0_0_15px_rgba(0,255,163,0.3)]' : 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm') :
                        (isDark ? 'bg-white/5 border-white/10 text-gray-500' : 'bg-gray-100 border-gray-200 text-gray-400')
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-sm font-bold ${isActive ? textMain : textMuted}`}>{step.name}</h4>
                        {isActive && (
                          <div className={`h-1 mt-2 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                            <div className={`h-full w-full animate-progress-indeterminate rounded-full ${isDark ? 'bg-[#00FFA3]' : 'bg-blue-600'}`}></div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}