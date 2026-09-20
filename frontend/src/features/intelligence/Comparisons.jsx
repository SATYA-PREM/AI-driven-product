import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  FileText,
  MessageSquare,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Card,
  KpiCard,
  LineChart,
  Donut,
  COLORS,
  cn,
} from './components/IntelligenceUIPrimitives';
import { intelligenceApi, datasetApi, productApi } from '../../api/client';
import { 
  getActiveWorkspaceId, 
  getActiveProductId, 
  setActiveProductId, 
  subscribeToActiveProduct,
  getActiveDatasetId,
  subscribeToActiveDataset
} from '../../utils/workspaceAccess';

export default function Comparisons(props) {
  const { workspaceId: routeWorkspaceId } = useParams();
  const workspaceId = props.workspaceId || routeWorkspaceId || getActiveWorkspaceId();

  const [products, setProducts] = useState(props.products || []);
  const [selectedProductId, setSelectedProductId] = useState(props.selectedProductId || getActiveProductId());
  const [selectedDatasetId, setSelectedDatasetId] = useState(props.selectedDatasetId || getActiveDatasetId());
  const [liveDatasets, setLiveDatasets] = useState(props.liveDatasets || []);
  const [liveData, setLiveData] = useState(props.liveData || { sentiment: null, summary: null, issues: [], features: [] });

  const [compTab, setCompTab] = useState('Time Comparison');
  const [activeRange, setActiveRange] = useState('Last 30 Days');
  const [compData, setCompData] = useState(null);
  const [isLoadingComp, setIsLoadingComp] = useState(false);

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
    if (props.liveDatasets) setLiveDatasets(props.liveDatasets);
    if (props.products) setProducts(props.products);
  }, [props.liveData, props.liveDatasets, props.products]);

  // Load datasets if missing
  useEffect(() => {
    if (!props.liveDatasets && workspaceId) {
      datasetApi.list(workspaceId)
        .then((res) => { if (Array.isArray(res)) setLiveDatasets(res); })
        .catch(() => {});
      productApi.list(workspaceId)
        .then((res) => { if (Array.isArray(res)) setProducts(res); })
        .catch(() => {});
    }
  }, [props.liveDatasets, workspaceId]);

  const fetchComparison = async () => {
    if (!workspaceId) return;
    setIsLoadingComp(true);
    try {
      const opts = {};
      if (selectedProductId) opts.product_id = selectedProductId;
      if (selectedDatasetId) opts.dataset_id = selectedDatasetId;
      const res = await intelligenceApi.getComparison(workspaceId, compTab, opts, activeRange);
      if (res) {
        setCompData(res);
      }
    } catch {
      // Fallback gracefully to workspace summary
    } finally {
      setIsLoadingComp(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, [workspaceId, compTab, activeRange, selectedDatasetId, selectedProductId]);

  const onToast = props.onToast || ((msg) => console.log(msg));

  const handleApplyComparison = () => {
    fetchComparison();
    onToast(`Applied ${compTab} for ${activeRange}${selectedDatasetId ? ` on dataset ${selectedDatasetId}` : ''}`);
  };

  // Derive display values from backend response or fallback to live summary
  const labelA = compData?.label_a || (compTab === 'Segment Comparison' ? 'Enterprise Segment' : compTab === 'Product Comparison' ? 'Mobile App v2.4' : compTab === 'Custom Comparison' ? 'Dataset Baseline A' : 'Jul 1 – Aug 31, 2025');
  const labelB = compData?.label_b || (compTab === 'Segment Comparison' ? 'SMB & Self-Serve' : compTab === 'Product Comparison' ? 'Web Dashboard' : compTab === 'Custom Comparison' ? 'Dataset Baseline B' : 'May 1 – Jun 30, 2025');

  const configA = compData?.config_a || (compTab === 'Segment Comparison' ? 'Primary Cohort' : compTab === 'Product Comparison' ? 'Product Module A' : compTab === 'Custom Comparison' ? 'Target Dataset A' : 'Current Period');
  const configB = compData?.config_b || (compTab === 'Segment Comparison' ? 'Comparison Cohort' : compTab === 'Product Comparison' ? 'Product Module B' : compTab === 'Custom Comparison' ? 'Target Dataset B' : 'Previous Period');

  const totalCurrent = compData?.metrics?.total_mentions ?? (liveData.summary?.summary?.total_feedback_analyzed || liveData.sentiment?.total_count || 30);
  const totalPrev = compData?.metrics?.total_mentions_prev ?? Math.round(totalCurrent * 0.843);
  const uniqueCustomers = compData?.metrics?.unique_customers ?? 9812;

  const posPctCurr = compData?.metrics?.positive_sentiment_pct ?? (liveData.sentiment?.percentages?.positive ?? 35);
  const neuPctCurr = compData?.metrics?.neutral_sentiment_pct ?? (liveData.sentiment?.percentages?.neutral ?? 24);
  const negPctCurr = compData?.metrics?.negative_sentiment_pct ?? (liveData.sentiment?.percentages?.negative ?? 41);

  const posCountCurr = compData?.metrics?.positive_mentions_count ?? Math.round(totalCurrent * (posPctCurr / 100));
  const neuCountCurr = compData?.metrics?.neutral_mentions_count ?? Math.round(totalCurrent * (neuPctCurr / 100));
  const negCountCurr = compData?.metrics?.negative_mentions_count ?? Math.round(totalCurrent * (negPctCurr / 100));

  const avgImpact = compData?.metrics?.avg_impact_score ?? 72;
  const newThemesCount = compData?.metrics?.new_themes_count ?? (liveData.features?.length || 14);

  const trendSeries = compData?.trend_series || {
    labels: ['Jul 1', 'Jul 8', 'Jul 15', 'Jul 22', 'Jul 29', 'Aug 5', 'Aug 12', 'Aug 19', 'Aug 26', 'Aug 31'],
    current_values: [850, 1100, 1500, 1300, 1450, 1550, 1100, 1400, 1750, 1900],
    previous_values: [650, 800, 1050, 950, 1100, 1200, 900, 1150, 1300, 1400],
  };

  const topThemes = compData?.top_themes || [
    { name: 'Checkout & Payments', current: Math.round(totalCurrent * 0.3), prev: Math.round(totalCurrent * 0.24), change: '↑ 28.6%' },
    { name: 'Order Tracking', current: Math.round(totalCurrent * 0.25), prev: Math.round(totalCurrent * 0.21), change: '↑ 17.5%' },
    { name: 'App Performance', current: Math.round(totalCurrent * 0.2), prev: Math.round(totalCurrent * 0.17), change: '↑ 19.3%' },
    { name: 'Product Features', current: Math.round(totalCurrent * 0.15), prev: Math.round(totalCurrent * 0.12), change: '↑ 26.7%' },
    { name: 'Returns & Refunds', current: Math.round(totalCurrent * 0.1), prev: Math.round(totalCurrent * 0.08), change: '↑ 18.4%' },
  ];

  const takeaways = compData?.key_takeaways || [
    { type: 'volume', icon: 'TrendingUp', tone: 'blue', text: `Mentions increased by 18.6% compared to previous period, reaching ${totalCurrent} records.` },
    { type: 'sentiment', icon: 'AlertTriangle', tone: 'red', text: `Negative sentiment stands at ${negPctCurr}%, requiring priority intervention.` },
    { type: 'segment', icon: 'Users', tone: 'green', text: 'New & active user segments showed highest growth (+16.4% unique customers).' },
    { type: 'theme', icon: 'Star', tone: 'amber', text: `${topThemes[0]?.name || 'Checkout'} and ${topThemes[1]?.name || 'Tracking'} are top feedback themes.` },
    { type: 'impact', icon: 'Target', tone: 'purple', text: `Average impact score reached ${avgImpact}, highlighting high priority business signals.` },
  ];

  return (
    <div className="space-y-4 font-sans select-none">
      {!props.liveData && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-[#263348] mb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Comparative Intelligence
            </h1>
            <p className="text-xs text-slate-400">Benchmark metrics across periods, product versions, customer cohorts, and datasets.</p>
          </div>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex items-center gap-4 border-b border-[#263348] pb-2 text-[11px] overflow-x-auto">
        {['Time Comparison', 'Segment Comparison', 'Product Comparison', 'Custom Comparison'].map((tab) => (
          <button
            key={tab}
            onClick={() => setCompTab(tab)}
            className={cn(
              "pb-2 transition-all font-medium whitespace-nowrap cursor-pointer",
              compTab === tab ? "text-violet-400 border-b-2 border-violet-500 font-bold" : "text-slate-400 hover:text-slate-200"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Top 5 KPI Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5 mt-2">
        <KpiCard icon={MessageSquare} title="Total Mentions" value={totalCurrent.toLocaleString()} trend={`↑ 18.6% vs ${labelB}`} tone="blue" />
        <KpiCard icon={Users} title="Unique Customers" value={uniqueCustomers.toLocaleString()} trend={`↑ 16.4% vs ${labelB}`} tone="purple" />
        <KpiCard icon={AlertTriangle} title="Negative Sentiment" value={`${negPctCurr}%`} trend={`↑ 2.2% vs ${labelB}`} trendType="down" tone="red" />
        <KpiCard icon={Target} title="Avg. Impact Score" value={String(avgImpact)} trend={`↑ 8.7% vs ${labelB}`} tone="amber" />
        <KpiCard icon={FileText} title="New Themes" value={String(newThemesCount)} trend={`↑ 27.3% vs ${labelB}`} tone="green" />
      </div>

      {/* Middle Grid: Dual Line Chart + Compare Config Box */}
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        {/* Mentions Trend Over Time Line Chart */}
        <Card title={`Mentions Trend Over Time – ${compTab}`} action={
          <div className="flex items-center gap-4 text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block"></span> {labelA}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block"></span> {labelB}</span>
          </div>
        }>
          <div className="relative">
            <LineChart
              labels={trendSeries.labels}
              max={2200}
              height={220}
              series={[
                { key: 'current', color: COLORS.purple, values: trendSeries.current_values, showDots: true, fillArea: false },
                { key: 'previous', color: COLORS.slate, values: trendSeries.previous_values, showDots: true, fillArea: false, dashed: true }
              ]}
            />
            {/* Inline Period Stat Badge */}
            <div className="absolute top-2 right-4 bg-[#182236]/90 border border-[#2c3b54] p-3 rounded-xl shadow-xl text-xs space-y-1">
              <span className="text-[10px] text-slate-400 font-medium block">Total Mentions ({labelA})</span>
              <p className="text-sm font-bold text-white flex items-center gap-1.5">
                {totalCurrent.toLocaleString()}
                <span className="text-[10px] text-green-400 font-medium">↑ 18.6%</span>
              </p>
              <span className="text-[10px] text-slate-400 block pt-0.5 border-t border-white/10">
                {labelB}: <strong className="text-slate-300">{totalPrev.toLocaleString()}</strong>
              </span>
            </div>
          </div>
        </Card>

        {/* Compare Configuration Box */}
        <Card title="Compare Configuration" className="border-t-2 border-t-violet-500">
          <div className="space-y-3 text-[11px] pt-1">
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Comparison Mode</label>
              <div className="bg-[#1e293b] p-2.5 rounded-lg text-white font-medium flex justify-between items-center border border-[#2a3850]">
                {compTab} <ChevronDown className="w-3.5 h-3.5 text-slate-400"/>
              </div>
            </div>


            <div>
              <label className="text-slate-400 block mb-1 font-medium">{configA}</label>
              <div className="bg-[#1e293b] p-2.5 rounded-lg text-white font-medium flex justify-between items-center border border-[#2a3850]">
                {labelA} <CalendarDays className="w-3.5 h-3.5 text-slate-400"/>
              </div>
            </div>
            <div>
              <label className="text-slate-400 block mb-1 font-medium">{configB}</label>
              <div className="bg-[#1e293b] p-2.5 rounded-lg text-white font-medium flex justify-between items-center border border-[#2a3850]">
                {labelB} <CalendarDays className="w-3.5 h-3.5 text-slate-400"/>
              </div>
            </div>
            <div>
              <label className="text-slate-400 block mb-1.5 font-medium">Quick Ranges</label>
              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                {['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'MTD', 'QTD', 'YTD'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setActiveRange(r)}
                    className={cn(
                      "py-1.5 rounded-lg font-medium transition-all duration-300 cursor-pointer",
                      activeRange === r
                        ? "bg-[#5b3df5] text-white shadow-lg shadow-[#5b3df5]/30"
                        : "bg-[#1e293b] text-slate-300 hover:bg-[#263348]"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleApplyComparison}
              disabled={isLoadingComp}
              className="w-full mt-3 bg-[#5b3df5] hover:bg-[#4f2ee8] text-white rounded-xl py-2.5 font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4"/> {isLoadingComp ? 'Updating...' : 'Apply Comparison'}
            </button>
          </div>
        </Card>
      </div>

      {/* Bottom Grid: 3 Columns matching UI layout */}
      <div className="grid gap-4 xl:grid-cols-12">
        {/* 1. Key Metrics Comparison Table (4 cols) */}
        <div className="xl:col-span-4 rounded-xl border border-[#263348] bg-[#111827] overflow-hidden shadow-lg p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-slate-100 flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-violet-500 rounded-full inline-block"></span>
              Key Metrics Comparison
            </h3>
          </div>
          <table className="w-full text-left text-[11px]">
            <thead className="bg-[#172033] text-slate-400 border-b border-[#263348]">
              <tr>
                <th className="py-2 px-2 font-semibold">Metric</th>
                <th className="py-2 px-2 font-semibold text-right truncate max-w-[90px]">{labelA}</th>
                <th className="py-2 px-2 font-semibold text-right truncate max-w-[90px]">{labelB}</th>
                <th className="py-2 px-2 font-semibold text-right">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263348]/60 text-slate-300">
              {[
                ['Total Mentions', totalCurrent.toLocaleString(), totalPrev.toLocaleString(), '↑ 18.6%'],
                ['Unique Customers', uniqueCustomers.toLocaleString(), '8,431', '↑ 16.4%'],
                ['Negative Mentions', `${negCountCurr.toLocaleString()} (${negPctCurr}%)`, '5,157 (47.6%)', '↑ 2.2%'],
                ['Positive Mentions', `${posCountCurr.toLocaleString()} (${posPctCurr}%)`, '3,401 (31.4%)', '↑ 4.3%'],
                ['Neutral Mentions', `${neuCountCurr.toLocaleString()} (${neuPctCurr}%)`, '2,270 (21.0%)', '↑ 2.1%'],
                ['Avg. Impact Score', String(avgImpact), '66', '↑ 8.7%'],
                ['Support Tickets', Math.round(totalCurrent * 0.17).toLocaleString(), '1,934', '↑ 11.5%'],
                ['Feature Requests', Math.round(totalCurrent * 0.15).toLocaleString(), '1,642', '↑ 20.7%'],
              ].map((r, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02]">
                  <td className="py-2 px-2 font-medium text-slate-200">{r[0]}</td>
                  <td className="py-2 px-2 text-right text-slate-300 font-mono text-[10px]">{r[1]}</td>
                  <td className="py-2 px-2 text-right text-slate-400 font-mono text-[10px]">{r[2]}</td>
                  <td className="py-2 px-2 text-right text-emerald-400 font-bold text-[10px]">{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[9px] text-slate-500 mt-3 pt-2 border-t border-[#1e293b]">Percentages may not add up to 100% due to rounding.</p>
        </div>

        {/* 2. Top Themes - Comparison & Sentiment Distribution Dual Donuts (5 cols) */}
        <div className="xl:col-span-5 space-y-4">
          {/* Top Themes Dual Bars */}
          <div className="rounded-xl border border-[#263348] bg-[#111827] overflow-hidden shadow-lg p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-slate-100 flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-violet-500 rounded-full inline-block"></span>
                Top Themes – {compTab}
              </h3>
              <span className="text-[10px] text-slate-400 font-medium cursor-pointer">By Mentions ▾</span>
            </div>
            <div className="space-y-2.5 text-[11px]">
              {topThemes.map((t, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-200 font-medium truncate max-w-[160px]">{t.name}</span>
                    <span className="text-emerald-400 font-bold">{t.change}</span>
                  </div>
                  <div className="flex items-center gap-1.5 h-3">
                    <div className="flex-1 bg-[#1a2336] h-full rounded flex overflow-hidden">
                      <div className="bg-[#8b5cf6] h-full rounded" style={{ width: `${Math.min(100, (t.current / (totalCurrent || 30)) * 100 * 2.5)}%` }} title={`${labelA}: ${t.current}`}></div>
                    </div>
                    <div className="flex-1 bg-[#1a2336] h-full rounded flex overflow-hidden">
                      <div className="bg-[#475569] h-full rounded" style={{ width: `${Math.min(100, (t.prev / (totalPrev || 25)) * 100 * 2.5)}%` }} title={`${labelB}: ${t.prev}`}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-[#1e293b] flex justify-end">
              <span onClick={() => onToast('Opening full themes comparison...')} className="text-[10px] text-[#a78bfa] hover:text-white font-medium cursor-pointer flex items-center gap-1">
                View all themes comparison →
              </span>
            </div>
          </div>

          {/* Sentiment Distribution Dual Donuts */}
          <div className="rounded-xl border border-[#263348] bg-[#111827] overflow-hidden shadow-lg p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-slate-100 flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-violet-500 rounded-full inline-block"></span>
                Sentiment Distribution – Comparison
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 items-center justify-center">
              {/* Current Donut */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-medium mb-1 truncate max-w-[120px]">{labelA}</span>
                <Donut
                  segments={[
                    { label: 'Positive', value: posPctCurr, color: COLORS.green },
                    { label: 'Neutral', value: neuPctCurr, color: COLORS.amber },
                    { label: 'Negative', value: negPctCurr, color: COLORS.red }
                  ]}
                  centerTop="Total"
                  centerBottom={totalCurrent.toLocaleString()}
                  size={105}
                />
                <div className="mt-2 space-y-0.5 text-[9px] w-full text-slate-300">
                  <div className="flex justify-between"><span className="text-emerald-400">Positive</span><span>{posCountCurr.toLocaleString()} ({posPctCurr}%)</span></div>
                  <div className="flex justify-between"><span className="text-amber-400">Neutral</span><span>{neuCountCurr.toLocaleString()} ({neuPctCurr}%)</span></div>
                  <div className="flex justify-between"><span className="text-rose-400">Negative</span><span>{negCountCurr.toLocaleString()} ({negPctCurr}%)</span></div>
                </div>
              </div>

              {/* Previous Donut */}
              <div className="flex flex-col items-center border-l border-[#1e293b] pl-4">
                <span className="text-[10px] text-slate-400 font-medium mb-1 truncate max-w-[120px]">{labelB}</span>
                <Donut
                  segments={[
                    { label: 'Positive', value: 31.4, color: COLORS.green },
                    { label: 'Neutral', value: 21.0, color: COLORS.amber },
                    { label: 'Negative', value: 47.6, color: COLORS.red }
                  ]}
                  centerTop="Total"
                  centerBottom={totalPrev.toLocaleString()}
                  size={105}
                />
                <div className="mt-2 space-y-0.5 text-[9px] w-full text-slate-300">
                  <div className="flex justify-between"><span className="text-emerald-400">Positive</span><span>{Math.round(totalPrev * 0.314).toLocaleString()} (31.4%)</span></div>
                  <div className="flex justify-between"><span className="text-amber-400">Neutral</span><span>{Math.round(totalPrev * 0.21).toLocaleString()} (21.0%)</span></div>
                  <div className="flex justify-between"><span className="text-rose-400">Negative</span><span>{Math.round(totalPrev * 0.476).toLocaleString()} (47.6%)</span></div>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[#1e293b] flex justify-end">
              <span onClick={() => onToast('Opening sentiment trend breakdown...')} className="text-[10px] text-[#a78bfa] hover:text-white font-medium cursor-pointer flex items-center gap-1">
                View sentiment trend →
              </span>
            </div>
          </div>
        </div>

        {/* 3. Key Takeaways AI Generated (3 cols) */}
        <div className="xl:col-span-3 rounded-xl border border-[#263348] bg-[#111827] overflow-hidden shadow-lg p-4 flex flex-col justify-between">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-slate-100 flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-violet-500 rounded-full inline-block"></span>
                Key Takeaways (AI Generated)
              </h3>
            </div>

            <div className="space-y-2.5 text-[11px]">
              {takeaways.map((item, idx) => {
                const toneBg = item.tone === 'red' ? 'bg-rose-500/15 text-rose-400' :
                             item.tone === 'green' ? 'bg-emerald-500/15 text-emerald-400' :
                             item.tone === 'amber' ? 'bg-amber-500/15 text-amber-400' :
                             item.tone === 'purple' ? 'bg-purple-500/15 text-purple-400' :
                             'bg-blue-500/15 text-blue-400';
                return (
                  <div key={idx} className="p-2.5 rounded-xl bg-[#172033] border border-[#232f48] flex items-start gap-2.5">
                    <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5", toneBg)}>
                      {item.tone === 'red' ? <AlertTriangle size={13}/> :
                       item.tone === 'green' ? <Users size={13}/> :
                       item.tone === 'amber' ? <Star size={13}/> :
                       item.tone === 'purple' ? <Target size={13}/> :
                       <TrendingUp size={13}/>}
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[10.5px]">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1e293b]">
            <span onClick={() => onToast('Opening detailed strategic analysis report...')} className="text-[11px] text-[#a78bfa] hover:text-white font-medium cursor-pointer flex items-center gap-1">
              View detailed analysis →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

