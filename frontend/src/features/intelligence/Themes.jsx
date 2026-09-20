import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  FileText,
  Grid2X2,
  MessageSquare,
  Sparkles,
  Target,
} from 'lucide-react';
import {
  Card,
  KpiCard,
  ImpactBadge,
  cn,
} from './components/IntelligenceUIPrimitives';
import { 
  getActiveWorkspaceId, 
  getActiveProductId, 
  setActiveProductId, 
  subscribeToActiveProduct,
  getActiveDatasetId,
  subscribeToActiveDataset
} from '../../utils/workspaceAccess';

export default function Themes(props) {
  const { workspaceId: routeWorkspaceId } = useParams();
  const workspaceId = props.workspaceId || routeWorkspaceId || getActiveWorkspaceId();

  const [products, setProducts] = useState(props.products || []);
  const [selectedProductId, setSelectedProductId] = useState(props.selectedProductId || getActiveProductId());
  const [selectedDatasetId, setSelectedDatasetId] = useState(props.selectedDatasetId || getActiveDatasetId());
  const [liveData, setLiveData] = useState(props.liveData || { features: [] });
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

  const handleProductChange = (e) => {
    const val = e.target.value;
    setSelectedProductId(val);
    setActiveProductId(val);
  };

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
        intelligenceApi.getFeatures(workspaceId, opts, 100),
        productApi.list(workspaceId),
      ]).then(([featRes, prodRes]) => {
        if (!isMounted) return;
        if (featRes.status === 'fulfilled' && Array.isArray(featRes.value)) {
          setLiveData({ features: featRes.value });
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
  const features = liveData.features || [];
  const [selectedTheme, setSelectedTheme] = useState(features[0] || null);

  useEffect(() => {
    if (features.length > 0 && !selectedTheme) {
      setSelectedTheme(features[0]);
    }
  }, [features]);

  const activeTheme = selectedTheme || features[0] || {
    name: 'No Feature Themes',
    title: 'No Feature Themes',
    request_count: 0,
    priority_level: 'P1',
  };

  return (
    <div className="space-y-4 font-sans select-none">
      {!props.liveData && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-[#263348] mb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Feature Demand Themes
            </h1>
            <p className="text-xs text-slate-400">Opportunity clusters and feature request frequency analysis.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard icon={Grid2X2} title="Total Feature Themes" value={features.length.toString()} trend="Agent 2 Extracted" tone="purple" />
        <KpiCard icon={MessageSquare} title="Total Demand Requests" value={features.reduce((acc, f) => acc + (f.frequency || f.request_count || 1), 0).toString()} tone="blue" />
        <KpiCard icon={Target} title="High Demand Themes" value={features.filter(f => f.priority_level === 'p1' || f.priority_level === 'high').length.toString()} tone="red" />
        <KpiCard icon={Sparkles} title="Opportunity Confidence" value="High (92%)" tone="green" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card noPadding title="">
          <div className="p-4 border-b border-[#263348] flex justify-between items-center">
            <h3 className="text-[13px] font-semibold text-slate-100">Feature Demand Themes (Click to inspect)</h3>
          </div>
          {features.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">No feature themes extracted yet. Ingest data to extract opportunities.</div>
          ) : (
            <table className="w-full text-left text-[11px]">
              <thead className="bg-[#172033] text-slate-400 border-b border-[#263348]">
                <tr>{['Theme Name', 'Requests', 'Priority', 'Impact'].map(h => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-[#263348]">
                {features.map((r, idx) => {
                  const isSel = (selectedTheme?.cluster_id || selectedTheme?.name) === (r.cluster_id || r.name);
                  return (
                    <tr key={r.cluster_id || idx} onClick={() => setSelectedTheme(r)} className={cn("cursor-pointer transition-colors hover:bg-[#1e293b]", isSel ? "bg-[#1e293b] border-l-4 border-violet-500" : "border-l-4 border-transparent")}>
                      <td className="px-4 py-3 font-semibold text-slate-200">{r.name || r.title}</td>
                      <td className="px-4 py-3 text-slate-400">{r.frequency || r.request_count || 1} requests</td>
                      <td className="px-4 py-3"><span className="text-blue-400 font-semibold">{r.priority_level?.toUpperCase() || 'P1'}</span></td>
                      <td className="px-4 py-3"><ImpactBadge value={r.priority_level === 'p1' ? 'High' : 'Medium'} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Theme Details" className="border-t-2 border-t-violet-500">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white text-[13px]">{activeTheme.name || activeTheme.title}</span>
            <ImpactBadge value={activeTheme.priority_level?.toUpperCase() || 'P1'} />
          </div>
          <p className="text-[10px] text-slate-400 mb-4">{activeTheme.description || 'Feature opportunity cluster synthesized from customer feedback.'}</p>
          <div className="space-y-2.5 text-[11px] border-t border-[#263348] pt-3">
            <div className="flex justify-between"><span className="text-slate-400">Demand Volume</span><span className="text-white font-medium">{activeTheme.frequency || activeTheme.request_count || 1} requests</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Priority Level</span><span className="text-blue-400 font-medium">{activeTheme.priority_level?.toUpperCase() || 'P1'}</span></div>
          </div>
          <button onClick={() => onToast(`Viewing demand for ${activeTheme.name || activeTheme.title}`)} className="w-full mt-5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg py-2.5 text-[11px] font-medium transition-all hover:scale-[1.01] active:scale-[0.99] shadow flex items-center justify-center gap-2">
            <FileText className="w-3.5 h-3.5"/> Inspect Related Feedback
          </button>
        </Card>
      </div>
    </div>
  );
}

