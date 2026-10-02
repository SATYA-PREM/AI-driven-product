import React, { useState } from 'react';
import {
  Users,
  Code,
  Palette,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Layers,
  Sparkles,
  RefreshCw,
  Clock,
  CheckCircle2,
  FileText
} from 'lucide-react';

export default function TeamAssignmentView({
  teamMembers = [],
  assignments = [],
  onReassign,
}) {
  const [expandedMembers, setExpandedMembers] = useState({});

  const toggleMember = (userId) => {
    setExpandedMembers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const getRoleIcon = (role) => {
    const r = String(role || '').toUpperCase();
    if (r.includes('DESIGN')) return <Palette className="w-4 h-4 text-purple-400" />;
    if (r.includes('DEV') || r.includes('ENG')) return <Code className="w-4 h-4 text-blue-400" />;
    if (r.includes('QA') || r.includes('TEST')) return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    if (r.includes('STAKEHOLDER') || r.includes('BUSINESS')) return <UserCheck className="w-4 h-4 text-amber-400" />;
    return <Users className="w-4 h-4 text-violet-400" />;
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header Info */}
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Product Team Workload & Requirement Ownership
            </h3>
            <p className="text-[11px] text-slate-400">
              Granular view of requirements allocated per team member across all active PRD initiatives.
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-violet-300 bg-violet-500/10 px-3 py-1 rounded-xl border border-violet-500/20">
          {teamMembers.length} Product Team Members
        </span>
      </div>

      {/* Team Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teamMembers.map((member) => {
          const memberAssignments = assignments.filter((a) => a.user_id === member.user_id);
          const isExpanded = expandedMembers[member.user_id] ?? true;

          return (
            <div
              key={member.user_id}
              className="bg-[#0b101b] border border-[#1e293b] rounded-2xl overflow-hidden shadow-xl space-y-0"
            >
              {/* Member Card Header */}
              <div
                onClick={() => toggleMember(member.user_id)}
                className="p-4 bg-[#080c16] border-b border-[#1e293b] flex items-center justify-between cursor-pointer hover:bg-[#0c1220] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <img
                      src={member.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover border border-[#223048]"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-[#0b101b] border border-[#223048]">
                      {getRoleIcon(member.team_role)}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{member.name}</h4>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {member.role_title || member.team_role}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${
                      memberAssignments.length > 0
                        ? 'bg-violet-500/10 text-violet-300 border-violet-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {memberAssignments.length} Reqs
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Assigned Requirements Accordion */}
              {isExpanded && (
                <div className="p-4 space-y-2.5 max-h-72 overflow-y-auto">
                  {memberAssignments.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500 italic">
                      No active requirements assigned yet.
                    </div>
                  ) : (
                    memberAssignments.map((asn) => (
                      <div
                        key={asn.assignment_id}
                        className="bg-[#111827] border border-[#223048] rounded-xl p-3 space-y-2 hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[10px] font-bold text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">
                                {asn.requirement_id}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                {asn.prd_id}
                              </span>
                              <span className="text-[9px] bg-slate-800 text-slate-300 px-1 py-0.5 rounded font-mono">
                                {asn.assignment_method}
                              </span>
                            </div>
                            <h5 className="text-xs font-semibold text-slate-200 leading-snug line-clamp-2">
                              {asn.requirement_title || asn.requirement_id}
                            </h5>
                          </div>

                          <button
                            onClick={() => onReassign(asn)}
                            title="Reassign to another member"
                            className="p-1 text-slate-400 hover:text-violet-300 hover:bg-violet-500/20 rounded transition-colors shrink-0 cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {asn.ai_reason && (
                          <p className="text-[10px] text-slate-400 italic bg-[#0b101b] p-2 rounded-lg border border-[#1e293b]">
                            "{asn.ai_reason}"
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

