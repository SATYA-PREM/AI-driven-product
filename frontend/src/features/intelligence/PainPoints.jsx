import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Activity,
  Eye,
  FileText,
  MessageSquare,
  Star,
  TrendingDown,
  Users,
} from 'lucide-react';
import {
  Card,
  KpiCard,
  ImpactBadge,
  cn,
} from './components/IntelligenceUIPrimitives';
import { intelligenceApi } from '../../api/intelligence';
import { productApi } from '../../api/workspaces';
import { 
  getActiveWorkspaceId, 
  getActiveProductId, 
  setActiveProductId, 
  subscribeToActiveProduct,
  getActiveDatasetId,
  subscribeToActiveDataset
} from '../../utils/workspaceAccess';

export default function PainPoints(props) {
  const { workspaceId: routeWorkspaceId } = useParams();
  const workspaceId = props.workspaceId || routeWorkspaceId || getActiveWorkspaceId();

  const [products, setProducts] = useState(props.products || []);
  const [selectedProductId, setSelectedProductId] = useState(props.selectedProductId || getActiveProductId());
  const [selectedDatasetId, setSelectedDatasetId] = useState(props.selectedDatasetId || getActiveDatasetId());
  const [liveData, setLiveData] = useState(props.liveData || { issues: [] });
  const [isLoading, setIsLoading] = useState(!props.liveData);

  useEffect(() => {
    const unsubProd = subscribeToActiveProduct((newProdId) => {
      setSelectedProductId(newProdId);
    });
    const unsubDs = subscribeToActiveDataset((newDsId) => {
      setSelectedDatasetId(newDsId);
    });
    return () => {
      unsubProd();
      unsubDs();
    };
  }, []);

  useEffect(() => {
    if (props.liveData) setLiveData(props.liveData);
    if (props.products) setProducts(props.products);
  }, [props.liveData, props.products]);

  useEffect(() => {
    if (!props.liveData && workspaceId) {
      let isMounted = true;
      setIsLoading(true);
      const opts = {};
      if (selectedProductId) opts.product_id = selectedProductId;
      if (selectedDatasetId) opts.dataset_id = selectedDatasetId;

      Promise.allSettled([
        intelligenceApi.getIssues(workspaceId, opts, 100),
        productApi.list(workspaceId),
      ]).then(([issRes, prodRes]) => {
        if (!isMounted) return;
        if (issRes.status === 'fulfilled' && Array.isArray(issRes.value)) {
          setLiveData((prev) => ({ ...prev, issues: issRes.value }));
        }
        if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value)) {
          setProducts(prodRes.value);
        }
      }).finally(() => {
        if (isMounted) setIsLoading(false);
      });

      return () => { isMounted = false; };
    }
  }, [props.liveData, workspaceId, selectedProductId, selectedDatasetId]);

  const onToast = props.onToast || ((msg) => console.log(msg));
  const issues = liveData.issues || [];
  const [selectedPainPoint, setSelectedPainPoint] = useState(issues[0] || null);

  useEffect(() => {
    if (issues.length > 0 && !selectedPainPoint) {
      setSelectedPainPoint(issues[0]);
    }
  }, [issues]);

  const activeItem = selectedPainPoint || issues[0] || {
    name: 'No Pain Points Ingested',
    title: 'No Pain Points Ingested',
    description: 'Upload customer feedback to extract critical issues.',
    frequency: 0,
    evidence_record_ids: [],
    priority_level: 'low',
    priority_score: 0,
  };

  const highImpactCount = issues.filter(i => i.priority_level === 'high' || i.priority_score >= 60).length;
  const totalMentions = issues.reduce((acc, i) => acc + (i.frequency || i.evidence_record_ids?.length || 1), 0);

  return (
    <div className="space-y-4 font-sans select-none">
      {!props.liveData && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-white/[0.08] mb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Pain Points Analytics
            </h1>
            <p className="text-xs text-slate-400">Deep dive into customer friction points and issue clusters.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <KpiCard icon={Activity} title="Total Pain Points" value={issues.length.toString()} tone="purple" />
        <KpiCard icon={MessageSquare} title="Total Mentions" value={totalMentions.toString()} tone="blue" />
        <KpiCard icon={Users} title="Affected Clusters" value={issues.length.toString()} tone="green" />
        <KpiCard icon={Star} title="High Impact Issues" value={highImpactCount.toString()} tone="amber" />
        <KpiCard icon={TrendingDown} title="Sentiment Impact" value="Negative" trendType="down" tone="red" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card noPadding title="">
          <div className="p-4 border-b border-white/[0.08] flex justify-between items-center">
            <h3 className="text-[13px] font-semibold text-slate-100">Customer Pain Points</h3>
          </div>
          {issues.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">No pain point clusters available. Ingest feedback to identify issues.</div>
          ) : (
            <table className="w-full text-left text-[11px]">
              <thead className="bg-white/[0.02] text-slate-400 border-b border-white/[0.08]">
                <tr>{['Pain Point', 'Mentions', 'Impact Level', 'Priority Score', 'Action'].map(h => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {issues.map((r, idx) => {
                  const impact = r.priority_level ? (r.priority_level.charAt(0).toUpperCase() + r.priority_level.slice(1)) : 'Medium';
                  const isSel = (selectedPainPoint?.cluster_id || selectedPainPoint?.name) === (r.cluster_id || r.name);
                  return (
                    <tr key={r.cluster_id || idx} onClick={() => setSelectedPainPoint(r)} className={cn("cursor-pointer transition-colors hover:bg-white/[0.04]", isSel ? "bg-purple-500/10 border-l-4 border-purple-500" : "border-l-4 border-transparent")}>
                      <td className="px-4 py-3 font-semibold text-slate-200">{r.name || r.title}</td>
                      <td className="px-4 py-3 text-slate-300">{r.frequency || r.evidence_record_ids?.length || 1} mentions</td>
                      <td className="px-4 py-3"><ImpactBadge value={impact} /></td>
                      <td className="px-4 py-3 text-rose-400 font-mono font-bold">{r.priority_score ? `${r.priority_score}/100` : 'N/A'}</td>
                      <td className="px-4 py-3"><Eye className="w-4 h-4 text-purple-400 transition-transform hover:scale-125" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Pain Point Details" className="border-t-2 border-t-rose-500">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-white text-[13px]">{activeItem.name || activeItem.title}</span>
            <ImpactBadge value={activeItem.priority_level ? activeItem.priority_level.toUpperCase() : 'MEDIUM'} />
          </div>
          <p className="text-[10px] text-slate-400 mb-4">{activeItem.description || activeItem.summary || 'Customer friction point extracted from feedback dataset.'}</p>
          <div className="space-y-3 text-[11px] border-t border-white/[0.08] pt-3">
            <div className="flex justify-between"><span className="text-slate-400">Total Mentions</span><span className="text-white font-medium">{activeItem.frequency || activeItem.evidence_record_ids?.length || 1}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Priority Score</span><span className="text-rose-400 font-bold">{activeItem.priority_score ? `${activeItem.priority_score}/100` : 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Severity</span><span className="text-amber-400 font-medium">{activeItem.severity || activeItem.priority_level || 'Medium'}</span></div>
          </div>
          <button onClick={() => onToast(`Inspecting details for ${activeItem.name || activeItem.title}`)} className="w-full mt-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl py-2.5 text-xs font-bold transition-all shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 cursor-pointer">
            <FileText className="w-3.5 h-3.5"/> Inspect Feedback Signals
          </button>
        </Card>
      </div>
    </div>
  );
}
