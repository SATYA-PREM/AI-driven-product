import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  FileText,
  ChevronDown,
  Layers,
  ArrowLeft,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Sparkles,
  ExternalLink,
  Info
} from 'lucide-react';
import { prdApi } from '../../api/prd';
import { getActiveWorkspaceId } from '../../utils/workspaceAccess';
import { useTheme } from '../../context/ThemeContext';
import PRDDocumentView from './components/PRDDocumentView';

export default function PRDViewerPage() {
  const { workspaceId: routeWsId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDark } = useTheme();

  const workspaceId = routeWsId || getActiveWorkspaceId();
  const queryPrdId = searchParams.get('prdId');

  const [projectsList, setProjectsList] = useState([]);
  const [selectedPrdId, setSelectedPrdId] = useState(queryPrdId || null);
  const [prdData, setPrdData] = useState(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingPRD, setIsLoadingPRD] = useState(false);
  const [error, setError] = useState(null);

  // 1. Fetch available PRD projects for this workspace
  useEffect(() => {
    if (!workspaceId) return;

    let isMounted = true;
    setIsLoadingList(true);
    setError(null);

    prdApi.listProjects(workspaceId)
      .then((projects) => {
        if (!isMounted) return;
        const list = Array.isArray(projects) ? projects : [];
        setProjectsList(list);

        // Determine which PRD to select
        const initialPrdId = queryPrdId || (list.length > 0 ? list[0].prd_id : null);
        if (initialPrdId) {
          setSelectedPrdId(initialPrdId);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load PRD projects list:', err);
        setError('Could not load workspace PRD list.');
      })
      .finally(() => {
        if (isMounted) setIsLoadingList(false);
      });

    return () => {
      isMounted = false;
    };
  }, [workspaceId, queryPrdId]);

  // Sync selectedPrdId when queryPrdId in URL search params changes
  useEffect(() => {
    if (queryPrdId && queryPrdId !== selectedPrdId) {
      setSelectedPrdId(queryPrdId);
    }
  }, [queryPrdId]);

  // 2. Fetch full PRD details whenever selectedPrdId changes
  useEffect(() => {
    if (!workspaceId || !selectedPrdId) {
      setPrdData(null);
      return;
    }

    let isMounted = true;
    setIsLoadingPRD(true);
    setError(null);

    prdApi.getPRD(workspaceId, selectedPrdId)
      .then((data) => {
        if (!isMounted) return;
        setPrdData(data || null);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error(`Failed to load PRD data for ${selectedPrdId}:`, err);
        setError(`Failed to load PRD document ${selectedPrdId}.`);
      })
      .finally(() => {
        if (isMounted) setIsLoadingPRD(false);
      });

    return () => {
      isMounted = false;
    };
  }, [workspaceId, selectedPrdId]);

  // Handler to switch selected PRD
  const handleSelectPRD = (newPrdId) => {
    setSelectedPrdId(newPrdId);
    setSearchParams({ prdId: newPrdId });
  };

  const handlePrint = () => {
    window.print();
  };

  const currentProject = projectsList.find((p) => p.prd_id === selectedPrdId) || prdData?.project;

  return (
    <div className={`w-full max-w-7xl mx-auto space-y-6 pb-16 font-sans ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Top Banner & Selector */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
        isDark ? 'bg-[#090d1c]/80 border-white/[0.08] backdrop-blur-xl' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isDark ? 'bg-purple-500/15 border border-purple-500/30 text-purple-400' : 'bg-purple-50 border border-purple-200 text-purple-600'
          }`}>
            <FileText size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                PRD Document Viewer
              </h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                Read-Only
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Official product requirements specifications, architecture, acceptance criteria, and traceability.
            </p>
          </div>
        </div>

        {/* PRD Selector & Print */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* PRD Dropdown */}
          <div className="relative min-w-[240px]">
            <select
              value={selectedPrdId || ''}
              onChange={(e) => handleSelectPRD(e.target.value)}
              disabled={isLoadingList || projectsList.length === 0}
              className={`w-full appearance-none text-xs font-bold pl-3 pr-8 py-2 rounded-xl border transition-colors cursor-pointer outline-none ${
                isDark
                  ? 'bg-[#12172b] border-white/[0.12] text-white hover:border-purple-400 focus:border-purple-500'
                  : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-purple-300 focus:border-purple-600 shadow-xs'
              }`}
            >
              {projectsList.length === 0 ? (
                <option value="">{isLoadingList ? 'Loading PRDs...' : 'No PRDs available'}</option>
              ) : (
                projectsList.map((p) => (
                  <option key={p.prd_id} value={p.prd_id}>
                    {p.prd_id} — {p.title || 'PRD Document'} ({p.current_version || 'v1.0'})
                  </option>
                ))
              )}
            </select>
            <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          </div>

          {/* Print button */}
          <button
            type="button"
            onClick={handlePrint}
            title="Print or Save as PDF"
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDark
                ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300 hover:text-white'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs'
            }`}
          >
            <Printer size={15} />
            <span className="hidden sm:inline">Print / Export</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoadingPRD ? (
        <div className={`p-16 text-center text-xs border rounded-2xl flex flex-col items-center justify-center gap-3 shadow-sm ${
          isDark ? 'text-slate-400 bg-[#090d1c]/80 border-white/[0.08]' : 'text-slate-500 bg-white border-slate-200'
        }`}>
          <div className="w-7 h-7 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <span>Loading PRD Document specifications...</span>
        </div>
      ) : error ? (
        <div className={`p-12 text-center rounded-2xl border space-y-3 ${
          isDark ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          <Info size={32} className="mx-auto text-rose-400" />
          <p className="text-sm font-bold">{error}</p>
          <p className="text-xs opacity-80 max-w-md mx-auto">
            Please make sure a PRD has been generated in this workspace or select another PRD from the list.
          </p>
        </div>
      ) : !prdData ? (
        <div className={`p-16 text-center border rounded-2xl space-y-3 ${
          isDark ? 'text-slate-400 bg-[#090d1c]/80 border-white/[0.08]' : 'text-slate-500 bg-white border-slate-200'
        }`}>
          <FileText size={40} className={`mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
          <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>No PRD Selected</h3>
          <p className="text-xs max-w-sm mx-auto">
            Select a PRD from the dropdown menu above to inspect the full product requirements specification.
          </p>
        </div>
      ) : (
        <PRDDocumentView
          prdData={prdData}
          readOnly={true}
        />
      )}
    </div>
  );
}

