import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  Plus,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Printer,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { qaApi } from '../../api/qa';
import CreateQAReportModal from './components/CreateQAReportModal';

export default function QAReports() {
  const { workspaceId } = useParams();
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchReports = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await qaApi.getReports(workspaceId);
      setReports(res || []);
      if (res && res.length > 0 && !selectedReport) {
        setSelectedReport(res[0]);
      }
    } catch (err) {
      console.warn('Failed to load QA reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [workspaceId]);

  const handleExportCSV = (report) => {
    if (!report) return;
    const m = report.metrics || {};
    const rows = [
      ['Metric', 'Value'],
      ['Report Title', report.title],
      ['PRD Version', report.prd_version || 'v1.2'],
      ['Feature Scope', report.feature_id || 'Core'],
      ['QA Recommendation', report.qa_recommendation],
      ['Total Test Cases', m.total_test_cases || 0],
      ['Executed Test Cases', m.executed_test_cases || 0],
      ['Passed Tests', m.passed_tests || 0],
      ['Failed Tests', m.failed_tests || 0],
      ['Pass Rate', `${m.pass_rate || 0}%`],
      ['Requirement Coverage', `${report.requirement_coverage_pct || 0}%`],
      ['Author', report.author],
      ['Created At', report.created_at],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${report.report_id || 'qa_report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const current = selectedReport || reports[0];
  const metrics = current?.metrics || {};
  const defectsBySev = metrics.open_defects_by_severity || {};

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <BarChart2 size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              QA Reports
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono">
              Server-Calculated Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Authoritative test evaluation, coverage analysis, and quality recommendations for PM review
          </p>
        </div>

        <div className="flex items-center gap-2">
          {current && (
            <button
              onClick={() => handleExportCSV(current)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] hover:border-white/[0.2] text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          )}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>New QA Report</span>
          </button>
        </div>
      </div>

      {/* Main Content Split: List & Report Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Report Archives List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Historical QA Reports ({reports.length})
          </h3>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] text-center text-slate-400 text-xs">
              No reports created yet.
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map((rep) => {
                const isSelected = (current?.report_id === rep.report_id);
                return (
                  <div
                    key={rep.report_id}
                    onClick={() => setSelectedReport(rep)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-purple-950/25 border-purple-500/50 shadow-sm'
                        : 'bg-[#090d1c]/80 border-white/[0.06] hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-purple-300">
                        {rep.report_id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        rep.qa_recommendation === 'QA_PASSED'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : rep.qa_recommendation === 'QA_FAILED'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {rep.qa_recommendation}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{rep.title}</h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>{rep.author}</span>
                      <span>{rep.created_at?.slice(0, 10)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right (2 Cols): Selected Report Detail View */}
        <div className="lg:col-span-2">
          {current ? (
            <div className="p-6 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-6">
              {/* Report Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      {current.report_id}
                    </span>
                    <span className="text-xs text-slate-400">PRD: {current.prd_version || 'v1.2'}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">{current.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Author: <span className="text-slate-200">{current.author}</span> &bull; Generated: {current.created_at?.slice(0, 16).replace('T', ' ')}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold">QA RECOMMENDATION</span>
                  <span className={`inline-block font-bold px-3 py-1 rounded-xl text-xs border mt-1 ${
                    current.qa_recommendation === 'QA_PASSED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : current.qa_recommendation === 'QA_FAILED'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {current.qa_recommendation}
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06]">
                  <span className="text-slate-400 text-[10px] block">TOTAL TESTS</span>
                  <span className="text-xl font-black text-white">{metrics.total_test_cases || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06]">
                  <span className="text-slate-400 text-[10px] block">PASSED TESTS</span>
                  <span className="text-xl font-black text-emerald-400">{metrics.passed_tests || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06]">
                  <span className="text-slate-400 text-[10px] block">FAILED TESTS</span>
                  <span className="text-xl font-black text-rose-400">{metrics.failed_tests || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06]">
                  <span className="text-slate-400 text-[10px] block">REQUIREMENT COVERAGE</span>
                  <span className="text-xl font-black text-purple-400">{current.requirement_coverage_pct || 0}%</span>
                </div>
              </div>

              {/* Open Defects by Severity */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-2 text-xs">
                <span className="text-slate-400 font-semibold block text-[11px]">
                  OPEN DEFECTS BY SEVERITY
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center">
                    <span className="text-rose-400 text-[10px] block font-bold">CRITICAL</span>
                    <span className="text-lg font-black text-rose-300">{defectsBySev.CRITICAL || 0}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                    <span className="text-amber-400 text-[10px] block font-bold">HIGH</span>
                    <span className="text-lg font-black text-amber-300">{defectsBySev.HIGH || 0}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-center">
                    <span className="text-cyan-400 text-[10px] block font-bold">MEDIUM</span>
                    <span className="text-lg font-black text-cyan-300">{defectsBySev.MEDIUM || 0}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-500/10 border border-slate-500/20 text-center">
                    <span className="text-slate-400 text-[10px] block font-bold">LOW</span>
                    <span className="text-lg font-black text-slate-300">{defectsBySev.LOW || 0}</span>
                  </div>
                </div>
              </div>

              {/* Qualitative Quality Sections */}
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/[0.06] space-y-1">
                  <span className="text-slate-400 font-semibold block">Known Limitations</span>
                  <p className="text-slate-300">{current.known_limitations || 'None documented.'}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/[0.06] space-y-1">
                  <span className="text-rose-400 font-semibold block">Outstanding Quality Risks</span>
                  <p className="text-slate-300">{current.outstanding_risks || 'No outstanding critical risks.'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select or generate a QA Report to view evaluation details.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <CreateQAReportModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        workspaceId={workspaceId}
        onSuccess={() => fetchReports()}
      />
    </div>
  );
}

