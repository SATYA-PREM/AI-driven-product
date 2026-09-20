import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  FileText,
  Grid2X2,
  Lightbulb,
  MessageSquare,
  MoreHorizontal,
  TrendingDown,
  Users,
  RefreshCw,
} from 'lucide-react';
import {
  Card,
  KpiCard,
  MiniBar,
  LineChart,
  Donut,
  LegendRow,
  ImpactBadge,
  COLORS,
} from './components/IntelligenceUIPrimitives';
import { intelligenceApi, datasetApi, productApi } from '../../api/client';
import { 
  getActiveWorkspaceId, 
  getActiveProductId, 
  setActiveProductId, 
  subscribeToActiveProduct,
  getActiveDatasetId,
  setActiveDatasetId,
  subscribeToActiveDataset
} from '../../utils/workspaceAccess';

export default function Overview(props) {
  const { workspaceId: routeWorkspaceId } = useParams();
  const workspaceId = props.workspaceId || routeWorkspaceId || getActiveWorkspaceId();

  const [products, setProducts] = useState(props.products || []);
  const [selectedProductId, setSelectedProductId] = useState(props.selectedProductId || getActiveProductId());
  const [selectedDatasetId, setSelectedDatasetId] = useState(props.selectedDatasetId || getActiveDatasetId());
  const [liveDatasets, setLiveDatasets] = useState(props.liveDatasets || []);

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
  const [liveData, setLiveData] = useState(props.liveData || {
    summary: null,
    issues: [],
    features: [],
    sentiment: null,
    trends: [],
    insights: [],
  });
  const [isLoading, setIsLoading] = useState(!props.liveData);
  const [isLiveConnected, setIsLiveConnected] = useState(true);

  // Sync props if provided by container
  useEffect(() => {
    if (props.liveData) setLiveData(props.liveData);
    if (props.liveDatasets) setLiveDatasets(props.liveDatasets);
    if (props.products) setProducts(props.products);
  }, [props.liveData, props.liveDatasets, props.products]);

  // Fetch if standalone route
  useEffect(() => {
    if (!props.liveData && workspaceId) {
      let isMounted = true;
      setIsLoading(true);

      const opts = {};
      if (selectedProductId) opts.product_id = selectedProductId;
      if (selectedDatasetId) opts.dataset_id = selectedDatasetId;

      Promise.allSettled([
        intelligenceApi.getSummary(workspaceId, opts),
        intelligenceApi.getIssues(workspaceId, opts, 50),
        intelligenceApi.getFeatures(workspaceId, opts, 50),
        intelligenceApi.getSentiment(workspaceId, opts),
        intelligenceApi.getTrends(workspaceId, opts, 50),
        intelligenceApi.getInsights(workspaceId, opts, 50),
        datasetApi.list(workspaceId),
        productApi.list(workspaceId),
      ]).then(([sumRes, issRes, featRes, sentRes, trendsRes, insRes, dsRes, prodRes]) => {
        if (!isMounted) return;
        const updated = {};
        if (sumRes.status === 'fulfilled' && sumRes.value) updated.summary = sumRes.value;
        if (issRes.status === 'fulfilled' && Array.isArray(issRes.value)) updated.issues = issRes.value;
        if (featRes.status === 'fulfilled' && Array.isArray(featRes.value)) updated.features = featRes.value;
        if (sentRes.status === 'fulfilled' && sentRes.value) updated.sentiment = sentRes.value;
        if (trendsRes.status === 'fulfilled' && Array.isArray(trendsRes.value)) updated.trends = trendsRes.value;
        if (insRes.status === 'fulfilled' && Array.isArray(insRes.value)) updated.insights = insRes.value;

        setLiveData((prev) => ({ ...prev, ...updated }));
        setIsLiveConnected(true);

        if (dsRes.status === 'fulfilled' && Array.isArray(dsRes.value)) setLiveDatasets(dsRes.value);
        if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value)) setProducts(prodRes.value);
      }).catch(() => {
        if (isMounted) setIsLiveConnected(false);
      }).finally(() => {
        if (isMounted) setIsLoading(false);
      });

      return () => { isMounted = false; };
    }
  }, [props.liveData, workspaceId, selectedProductId, selectedDatasetId]);

  const onToast = props.onToast || ((msg) => console.log(msg));

  const totalFeedback = liveData.sentiment?.total_count ?? liveData.summary?.summary?.total_feedback_analyzed ?? 0;
  const posPct = liveData.sentiment?.percentages?.positive ?? 0;
  const neuPct = liveData.sentiment?.percentages?.neutral ?? 0;
  const negPct = liveData.sentiment?.percentages?.negative ?? 0;

  const posCount = liveData.sentiment?.distribution?.positive ?? 0;
  const neuCount = liveData.sentiment?.distribution?.neutral ?? 0;
  const negCount = liveData.sentiment?.distribution?.negative ?? 0;

  // Feedback by Source from real datasets
  const sourcesData = useMemo(() => {
    if (liveDatasets && liveDatasets.length > 0) {
      const typeMap = {};
      liveDatasets.forEach((ds) => {
        const type = ds.source_type || 'CSV Ingestion';
        typeMap[type] = (typeMap[type] || 0) + (ds.total_rows || ds.row_count || 30);
      });
      const entries = Object.entries(typeMap);
      return entries.map(([name, count]) => {
        const pct = totalFeedback > 0 ? ((count / totalFeedback) * 100).toFixed(1) : 0;
        return { name, count, pct: `${pct}%`, valStr: `${count.toLocaleString()} (${pct}%)` };
      });
    }
    return [
      { name: 'CSV File Ingestion', count: totalFeedback, pct: '100%', valStr: `${totalFeedback.toLocaleString()} (100%)` }
    ];
  }, [liveDatasets, totalFeedback]);

  const maxSource = Math.max(...sourcesData.map(s => s.count), 1);

  // Line chart trends
  const trendLabels = useMemo(() => {
    if (liveDatasets && liveDatasets.length > 0) {
      return liveDatasets.map((d, idx) => d.filename ? (d.filename.length > 10 ? d.filename.slice(0, 8) + '..' : d.filename) : `Batch ${idx+1}`);
    }
    return ['Start', 'Raw Upload', 'Cleaned', 'AI Analyzed'];
  }, [liveDatasets]);

  const trendValues = useMemo(() => {
    if (liveDatasets && liveDatasets.length > 0) {
      return liveDatasets.map(d => d.total_rows || d.row_count || 30);
    }
    return [0, Math.round(totalFeedback * 0.3), Math.round(totalFeedback * 0.7), totalFeedback];
  }, [liveDatasets, totalFeedback]);

  const maxTrend = Math.max(...trendValues, 10);

  return (
    <div className="space-y-4 font-sans select-none">
      {!props.liveData && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-[#263348] mb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Product Overview
            </h1>
            <p className="text-xs text-slate-400">Executive summary of feedback signals across workspace products.</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        <KpiCard icon={MessageSquare} title="Total Feedback" value={totalFeedback.toLocaleString()} trend="Live from MongoDB" tone="purple" />
        <KpiCard icon={CheckCircle2} title="Positive Sentiment" value={`${posPct}%`} sub={`${posCount} signals`} trendType="up" tone="green" />
        <KpiCard icon={MoreHorizontal} title="Neutral Sentiment" value={`${neuPct}%`} sub={`${neuCount} signals`} trendType="down" tone="amber" />
        <KpiCard icon={TrendingDown} title="Negative Sentiment" value={`${negPct}%`} sub={`${negCount} signals`} trendType="down" tone="red" />
        <KpiCard icon={Users} title="Extracted Themes" value={((liveData.issues?.length || 0) + (liveData.features?.length || 0)).toString()} sub="Agent 2 Clusters" tone="blue" />
        <KpiCard icon={FileText} title="Generated Insights" value={(liveData.insights?.length || liveData.summary?.summary?.total_insights || 0).toString()} sub="Agent 3 Insights" tone="purple" />
      </div>

      {/* Overview Charts Row */}
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1.1fr_1.2fr]">
        <Card title="Feedback Trend Over Time" action={<span className="text-[10px] text-slate-400">Live Batches</span>}>
          <LineChart labels={trendLabels} max={Math.ceil(maxTrend * 1.2)} height={220} series={[{ key: 'main', color: COLORS.purple, values: trendValues, showDots: true, fillArea: true }]} />
        </Card>

        <Card title="Sentiment Distribution">
          <div className="flex h-[220px] flex-row items-center justify-center gap-6 px-4">
            <Donut segments={totalFeedback > 0 ? [{ label: 'Positive', value: posPct, color: COLORS.green }, { label: 'Neutral', value: neuPct, color: COLORS.amber }, { label: 'Negative', value: negPct, color: COLORS.red }] : [{ label: 'Empty', value: 100, color: '#1e293b' }]} centerTop="Total Signals" centerBottom={totalFeedback.toLocaleString()} size={135} />
            <div className="flex flex-col justify-center gap-3 text-[10px]">
              <LegendRow label="Positive" value={`${posPct}% (${posCount})`} color={COLORS.green} />
              <LegendRow label="Neutral" value={`${neuPct}% (${neuCount})`} color={COLORS.amber} />
              <LegendRow label="Negative" value={`${negPct}% (${negCount})`} color={COLORS.red} />
            </div>
          </div>
        </Card>

        <Card title="Feedback by Source">
          <div className="flex h-[220px] flex-col justify-center space-y-4">
            {sourcesData.map((src, idx) => (
              <MiniBar key={idx} label={src.name} right={src.valStr} value={src.count} max={maxSource} tone={idx % 2 === 0 ? 'purple' : 'blue'} />
            ))}
          </div>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        {/* Top Pain Points */}
        <Card title="Top Pain Points" action={<Link to={`/workspace/${workspaceId}/intelligence/issues`} className="text-[10px] text-violet-400 hover:text-violet-300 cursor-pointer transition-colors">View All ({liveData.issues?.length || 0})</Link>}>
          <div className="divide-y divide-[#263348]">
            {(!liveData.issues || liveData.issues.length === 0) ? (
              <div className="py-8 text-center text-xs text-slate-500">No pain points detected yet. Upload and analyze feedback signals.</div>
            ) : (
              liveData.issues.slice(0, 5).map((r, i) => {
                const impact = r.priority_level ? (r.priority_level.charAt(0).toUpperCase() + r.priority_level.slice(1)) : 'Medium';
                return (
                  <Link key={i} to={`/workspace/${workspaceId}/intelligence/issues`} className="flex items-center justify-between py-3 px-1 transition-colors hover:bg-[#1e293b]/50 rounded cursor-pointer block">
                    <div className="flex items-center gap-2 min-w-0">
                      <Activity className="h-4 w-4 text-violet-400 shrink-0" />
                      <span className="text-[11px] font-medium text-slate-200 truncate">{r.name || r.title}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] shrink-0">
                      <span className="text-slate-400">{r.frequency || 1} mentions</span>
                      <ImpactBadge value={impact} />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </Card>

        {/* Top Themes */}
        <Card title="Top Themes / Opportunities" action={<Link to={`/workspace/${workspaceId}/intelligence/themes`} className="text-[10px] text-violet-400 hover:text-violet-300 cursor-pointer transition-colors">View All ({liveData.features?.length || 0})</Link>}>
          <div className="divide-y divide-[#263348]">
            {(!liveData.features || liveData.features.length === 0) ? (
              <div className="py-8 text-center text-xs text-slate-500">No feature demand themes detected yet. Run AI analysis.</div>
            ) : (
              liveData.features.slice(0, 5).map((r, i) => (
                <Link key={i} to={`/workspace/${workspaceId}/intelligence/themes`} className="flex items-center justify-between py-3 px-1 transition-colors hover:bg-[#1e293b]/50 rounded cursor-pointer block">
                  <div className="flex items-center gap-2 min-w-0">
                    <Grid2X2 className="h-4 w-4 text-blue-400 shrink-0" />
                    <span className="text-[11px] font-medium text-slate-200 truncate">{r.name || r.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] shrink-0">
                    <span className="text-slate-400">{r.frequency || r.request_count || 1} requests</span>
                    <span className="text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">{r.priority_level?.toUpperCase() || 'P1'}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Key Insights (AI Generated) */}
        <Card title="Key Insights (Agent 3 Synthesized)" action={<Link to={`/workspace/${workspaceId}/reports`} className="text-[10px] text-violet-400 hover:text-violet-300 cursor-pointer transition-colors">Reports</Link>}>
          <div className="space-y-3">
            {(!liveData.insights || liveData.insights.length === 0) ? (
              <div className="py-8 text-center text-xs text-slate-500">No agent insights compiled yet. Run Agent 3 synthesis.</div>
            ) : (
              liveData.insights.slice(0, 4).map((ins, i) => (
                <div key={i} className="flex gap-3 bg-[#1e293b]/40 hover:bg-[#1e293b] p-3 rounded-lg border border-[#263348] transition-all duration-300 hover:translate-x-1">
                  <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-amber-400" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-white truncate">{ins.title}</p>
                    <p className="text-[10px] leading-relaxed text-slate-300 mt-0.5 line-clamp-2">{ins.recommended_action || ins.business_impact || 'Strategic recommendation compiled by AI agent.'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

