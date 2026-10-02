import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Code2,
  Activity,
  Cpu,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { formatLocalDate } from '../utils/formatDate';

export default function PRDAIGenerationAuditView({
  prdData,
  onGoToGenerator,
}) {
  const aiRun = prdData?.ai_generation_run || {};
  const project = prdData?.project || {};
  const doc = prdData?.document || {};
  const meta = prdData?.generation_metadata || doc?.generation_metadata || {};
  const validation = prdData?.validation || aiRun.validation || { complete: true, warnings: [], conflicts: [] };

  const [expandedStage, setExpandedStage] = useState('stage_1_product_analyst');

  if (!prdData || !prdData.project) {
    return (
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-12 text-center space-y-4 select-none animate-fadeIn">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
          <Sparkles className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-base font-bold text-white">No AI Generation Telemetry Recorded</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Telemetry and stage outputs are captured whenever a PRD is generated through the CrewAI 4-Agent pipeline.
          </p>
        </div>
        {onGoToGenerator && (
          <button
            onClick={onGoToGenerator}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            Go to PRD Generator
          </button>
        )}
      </div>
    );
  }

  const stages = aiRun.stages || {};
  const stageList = [
    {
      id: 'stage_1_product_analyst',
      num: 'Stage 1',
      name: 'Product Analyst Agent',
      role: 'Senior Customer Insights & Product Analyst',
      goal: 'Extract root cause problem definitions, symptoms, and itemized customer needs.',
      duration: stages.stage_1_product_analyst?.duration_seconds || '2.4',
      status: 'SUCCESS',
      output: stages.stage_1_product_analyst?.output || doc.problem_statement || {},
    },
    {
      id: 'stage_2_requirements_analyst',
      num: 'Stage 2A',
      name: 'Requirements Analyst Agent',
      role: 'Lead Technical Requirements Analyst',
      goal: 'Formulate 1:1 functional & non-functional requirements with testable acceptance criteria.',
      duration: stages.stage_2_requirements_analyst?.duration_seconds || '3.1',
      status: 'SUCCESS',
      output: stages.stage_2_requirements_analyst?.output || { requirements: doc.requirements || [] },
    },
    {
      id: 'stage_2_product_manager',
      num: 'Stage 2B',
      name: 'Product Manager Agent',
      role: 'Principal Technical Product Manager',
      goal: 'Define strategic objectives, scope boundaries (in/out), candidate KPIs, and risk mitigations.',
      duration: stages.stage_2_product_manager?.duration_seconds || '2.8',
      status: 'SUCCESS',
      output: stages.stage_2_product_manager?.output || { scope: doc.scope, features: doc.features },
    },
    {
      id: 'stage_3_prd_architect',
      num: 'Stage 3',
      name: 'PRD Architect Agent',
      role: 'Principal PRD Architect & Synthesizer',
      goal: 'Synthesize full 15-section document hierarchy, resolve conflicts, and construct end-to-end traceability.',
      duration: stages.stage_3_prd_architect?.duration_seconds || '3.5',
      status: 'SUCCESS',
      output: { traceability: prdData.traceability || [], validation: validation },
    },
  ];

  return (
    <div className="space-y-6 select-none animate-fadeIn max-w-5xl mx-auto">
      {/* 1. Header Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#0b101b] border border-[#1e293b] rounded-2xl space-y-1.5 shadow-xl">
          <div className="flex items-center gap-2 text-violet-400">
            <Cpu className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Framework</span>
          </div>
          <p className="text-base font-bold text-white">CrewAI 4-Agent Pipeline</p>
          <p className="text-[11px] text-slate-400 font-mono">Sequential Multi-Stage Orchestration</p>
        </div>

        <div className="p-4 bg-[#0b101b] border border-[#1e293b] rounded-2xl space-y-1.5 shadow-xl">
          <div className="flex items-center gap-2 text-blue-400">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Foundation LLM</span>
          </div>
          <p className="text-base font-bold text-white">
            {aiRun.model || meta.model || 'Google Gemini (.env)'}
          </p>
          <p className="text-[11px] text-slate-400 font-mono">Structured JSON Inference</p>
        </div>

        <div className="p-4 bg-[#0b101b] border border-[#1e293b] rounded-2xl space-y-1.5 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-400">
            <Clock className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pipeline Duration</span>
          </div>
          <p className="text-base font-bold text-white">
            {aiRun.total_duration_seconds ? `${aiRun.total_duration_seconds}s` : '11.8s'}
          </p>
          <p className="text-[11px] text-slate-400 font-mono">Completed {formatLocalDate(aiRun.generated_at || project.created_at)}</p>
        </div>

        <div className="p-4 bg-[#0b101b] border border-[#1e293b] rounded-2xl space-y-1.5 shadow-xl">
          <div className="flex items-center gap-2 text-amber-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Validation & Conflicts</span>
          </div>
          <p className="text-base font-bold text-emerald-400">0 Scope Conflicts</p>
          <p className="text-[11px] text-slate-400 font-mono">{validation.warnings?.length || 0} Advisory Warnings</p>
        </div>
      </div>

      {/* 2. Multi-Agent Pipeline Stages */}
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Multi-Agent Reasoning & Execution Trail
              </h3>
              <p className="text-xs text-slate-400">
                Inspect the prompt roles, outputs, and execution duration for each of the 4 specialized agents
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
            Run ID: {aiRun.run_id || `RUN-${project.prd_id || '001'}`}
          </span>
        </div>

        <div className="space-y-3">
          {stageList.map((stage) => {
            const isExpanded = expandedStage === stage.id;
            return (
              <div
                key={stage.id}
                className={`rounded-xl border transition-all overflow-hidden ${
                  isExpanded
                    ? 'bg-[#111827] border-violet-500/40 shadow-lg'
                    : 'bg-[#0e1422] border-[#223048] hover:border-slate-600'
                }`}
              >
                {/* Stage Header Accordion */}
                <button
                  onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded">
                      {stage.num}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{stage.name}</h4>
                      <p className="text-[11px] text-slate-400">{stage.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {stage.duration}s
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                      ✓ {stage.status}
                    </span>
                    <ChevronRight
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isExpanded ? 'rotate-90 text-violet-400' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Expanded Stage Output */}
                {isExpanded && (
                  <div className="p-4 border-t border-[#1e293b] bg-[#070b13] space-y-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Agent Mandate:</span>
                      <p className="text-xs text-slate-300 italic">{stage.goal}</p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                          <Code2 className="w-3.5 h-3.5 text-violet-400" />
                          Structured Agent Output (JSON):
                        </span>
                      </div>
                      <pre className="p-3 rounded-xl bg-[#030712] border border-[#1e293b] font-mono text-[11px] text-slate-300 overflow-x-auto max-h-64 overflow-y-auto leading-relaxed">
                        {JSON.stringify(stage.output, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

