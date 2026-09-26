import React, { useState } from 'react';
import {
  Users,
  FileCode,
  Compass,
  Layers,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

export default function PRDMultiAgentPipelineViewer({ aiRun = null }) {
  const [expandedStage, setExpandedStage] = useState(null);

  const toggleStage = (stageKey) => {
    setExpandedStage(expandedStage === stageKey ? null : stageKey);
  };

  const stages = [
    {
      key: 'stage_1_product_analyst',
      stageNum: 'Stage 1',
      title: 'Product Analyst Agent',
      icon: Users,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/30',
      badgeColor: 'bg-violet-500/20 text-violet-300',
      description: 'Synthesizes customer friction & root causes from PM-approved context.',
      outputKey: 'problem_definition',
    },
    {
      key: 'stage_2_requirements_analyst',
      stageNum: 'Stage 2A',
      title: 'Requirements Analyst Agent',
      icon: FileCode,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      badgeColor: 'bg-blue-500/20 text-blue-300',
      description: 'Formulates functional/non-functional requirements & constraints.',
      outputKey: 'requirements_analysis',
    },
    {
      key: 'stage_2_product_manager',
      stageNum: 'Stage 2B',
      title: 'Product Manager Agent',
      icon: Compass,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
      description: 'Defines objectives, in/out scope, priorities, and success metrics.',
      outputKey: 'product_plan',
    },
    {
      key: 'stage_3_prd_architect',
      stageNum: 'Stage 3',
      title: 'PRD Architect Agent',
      icon: Layers,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      badgeColor: 'bg-amber-500/20 text-amber-300',
      description: 'Synthesizes PRD hierarchy, validates completeness, and resolves conflicts.',
      outputKey: 'prd',
    },
  ];

  return (
    <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xl select-none">
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 rounded-xl text-violet-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              CrewAI 4-Agent Architecture Pipeline
              {aiRun?.status === 'SUCCESS' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  EXECUTED
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Operates over ONE unified PM-approved package with structured stage-to-stage reasoning
            </p>
          </div>
        </div>

        {aiRun && (
          <span className="text-xs font-mono bg-[#111827] text-slate-300 px-3 py-1 rounded-lg border border-[#223048]">
            Duration: {aiRun.total_duration_seconds}s | Run: {aiRun.run_id}
          </span>
        )}
      </div>

      {/* 4 Agent Pipeline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const stageData = aiRun?.stages?.[stage.key];
          const isExpanded = expandedStage === stage.key;

          return (
            <div
              key={stage.key}
              className={`p-4 rounded-xl border transition-all ${stage.bgColor} ${stage.borderColor} flex flex-col justify-between space-y-3 relative`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${stage.badgeColor}`}>
                    {stage.stageNum}
                  </span>
                  <div className={`p-1.5 rounded-lg ${stage.bgColor} ${stage.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="text-xs font-bold text-white">{stage.title}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                  {stage.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[#1e293b]/60 flex items-center justify-between text-[11px]">
                {stageData ? (
                  <>
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready ({stageData.duration_seconds}s)
                    </span>
                    <button
                      onClick={() => toggleStage(stage.key)}
                      className="text-slate-400 hover:text-white flex items-center gap-0.5 cursor-pointer font-semibold"
                    >
                      <span>Inspect</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </>
                ) : (
                  <span className="text-slate-500">Awaiting Run</span>
                )}
              </div>

              {/* Collapsible Inspector */}
              {isExpanded && stageData?.output && (
                <div className="absolute top-full left-0 right-0 z-20 mt-2 bg-[#0d1527] border border-violet-500/40 rounded-xl p-3.5 shadow-2xl space-y-2 text-xs text-slate-300 max-h-60 overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-[#223048] pb-1.5 font-bold text-white">
                    <span>{stage.title} Output</span>
                    <button onClick={() => setExpandedStage(null)} className="text-slate-400 hover:text-white">✕</button>
                  </div>
                  <pre className="text-[10px] font-mono bg-[#070b14] p-2 rounded overflow-x-auto text-emerald-300">
                    {JSON.stringify(stageData.output, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

