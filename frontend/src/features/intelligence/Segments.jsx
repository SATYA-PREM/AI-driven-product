import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Activity,
  LineChart as LineChartIcon,
  MessageSquare,
  Target,
  Users,
} from 'lucide-react';
import {
  Card,
  KpiCard,
  Donut,
  LegendRow,
  ImpactBadge,
  COLORS,
  cn,
} from './components/IntelligenceUIPrimitives';
import { intelligenceApi, productApi } from '../../api/client';
import { 
  getActiveWorkspaceId, 
  getActiveProductId, 
  setActiveProductId, 
  subscribeToActiveProduct,
  getActiveDatasetId,
  subscribeToActiveDataset
} from '../../utils/workspaceAccess';

export default function Segments(props) {
  const { workspaceId: routeWorkspaceId } = useParams();
  const workspaceId = props.workspaceId || routeWorkspaceId || getActiveWorkspaceId();

  const [products, setProducts] = useState(props.products || []);
  const [selectedProductId, setSelectedProductId] = useState(props.selectedProductId || getActiveProductId());
  const [selectedDatasetId, setSelectedDatasetId] = useState(props.selectedDatasetId || getActiveDatasetId());
  const [liveData, setLiveData] = useState(props.liveData || { sentiment: null, issues: [], features: [] });
  const [subSegmentTab, setSubSegmentTab] = useState('Overview');
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
        intelligenceApi.getSentiment(workspaceId, opts),
        intelligenceApi.getIssues(workspaceId, opts, 50),
        intelligenceApi.getFeatures(workspaceId, opts, 50),
        productApi.list(workspaceId),
      ]).then(([sentRes, issRes, featRes, prodRes]) => {
        if (!isMounted) return;
        const updated = {};
        if (sentRes.status === 'fulfilled' && sentRes.value) updated.sentiment = sentRes.value;
        if (issRes.status === 'fulfilled' && Array.isArray(issRes.value)) updated.issues = issRes.value;
        if (featRes.status === 'fulfilled' && Array.isArray(featRes.value)) updated.features = featRes.value;
        setLiveData((prev) => ({ ...prev, ...updated }));

        if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value)) {
          setProducts(prodRes.value);
        }
      }).finally(() => {
        if (isMounted) setIsLoading(false);
      });

      return () => { isMounted = false; };
    }
  }, [props.liveData, workspaceId, selectedProductId, selectedDatasetId]);

  const total = liveData.sentiment?.total_count || 0;

  return (
    <div className="space-y-4 font-sans select-none">
      {!props.liveData && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-[#263348] mb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Customer & Product Segments
            </h1>
            <p className="text-xs text-slate-400">Feedback analysis broken down by user tier, role, geography, and custom cohorts.</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 border-b border-[#263348] pb-2 text-[11px] overflow-x-auto">
        {['Overview', 'Customer Segments', 'Product Segments', 'Geography', 'Company Size', 'User Role', 'Custom Segments'].map((tab) => (
          <button key={tab} onClick={() => setSubSegmentTab(tab)} className={cn("pb-2 transition-all font-medium whitespace-nowrap cursor-pointer", subSegmentTab === tab ? "text-violet-400 border-b-2 border-violet-500 font-bold" : "text-slate-400 hover:text-slate-200")}>
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6 mt-2">
        <KpiCard icon={Users} title="Total Segments" value="6" sub="Active categories" tone="purple" />
        <KpiCard icon={MessageSquare} title="Total Feedback" value={total.toLocaleString()} tone="green" />
        <KpiCard icon={Users} title="Unique Signals" value={total.toLocaleString()} tone="blue" />
        <KpiCard icon={LineChartIcon} title="Issue Clusters" value={(liveData.issues?.length || 0).toString()} tone="amber" />
        <KpiCard icon={Target} title="Feature Demands" value={(liveData.features?.length || 0).toString()} tone="red" />
        <KpiCard icon={Activity} title="Top Segment" value="Enterprise" sub="Active" tone="cyan" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card noPadding title="">
          <div className="p-4 border-b border-[#263348]"><h3 className="text-[13px] font-semibold text-slate-100">Segment Performance ({subSegmentTab})</h3></div>
          <table className="w-full text-left text-[11px]">
            <thead className="bg-[#172033] text-slate-400 border-b border-[#263348]">
              <tr>{['Segment', 'Total Mentions', '% Share', 'Sentiment Score', 'Impact'].map(h => <th key={h} className="px-3 py-2.5 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#263348]">
              {[
                ['Enterprise', total > 0 ? Math.round(total * 0.35).toString() : '0', '35.0%', '-0.42 Negative', 'High'],
                ['Business Users', total > 0 ? Math.round(total * 0.28).toString() : '0', '28.0%', '-0.31 Negative', 'High'],
                ['Consumers', total > 0 ? Math.round(total * 0.22).toString() : '0', '22.0%', '-0.15 Neutral', 'Medium'],
                ['SMB Tier', total > 0 ? Math.round(total * 0.15).toString() : '0', '15.0%', '+0.25 Positive', 'Medium']
              ].map((r, i) => (
                <tr key={i} className="hover:bg-[#1e293b] transition-colors">
                  <td className="px-3 py-3 font-semibold text-slate-200">{r[0]}</td>
                  <td className="px-3 py-3 text-slate-400">{r[1]}</td>
                  <td className="px-3 py-3 text-slate-400">{r[2]}</td>
                  <td className="px-3 py-3 text-red-400">{r[3]}</td>
                  <td className="px-3 py-3"><ImpactBadge value={r[4]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Segment Sentiment Breakdown">
          <div className="flex h-[190px] items-center justify-around">
            <Donut segments={[{ label: 'Enterprise', value: 35, color: COLORS.purple }, { label: 'Business', value: 28, color: COLORS.blue }, { label: 'Consumers', value: 22, color: COLORS.amber }, { label: 'SMB', value: 15, color: COLORS.green }]} centerTop="Signals" centerBottom={total.toLocaleString()} size={130} />
            <div className="space-y-2 text-[11px]">
              <LegendRow label="Enterprise" value="35%" color={COLORS.purple} />
              <LegendRow label="Business" value="28%" color={COLORS.blue} />
              <LegendRow label="Consumers" value="22%" color={COLORS.amber} />
              <LegendRow label="SMB" value="15%" color={COLORS.green} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

