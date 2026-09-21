import React from 'react';
import {
  Smartphone,
  Globe,
  Headphones,
  FileQuestion,
  Share2,
  Edit,
  Smile,
  Meh,
  Frown,
} from 'lucide-react';

export function SentimentBadge({ sentiment, score }) {
  const norm = (sentiment || '').toLowerCase();
  if (norm === 'positive') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <Smile className="w-3 h-3" />
        <span>Positive</span>
      </span>
    );
  }
  if (norm === 'negative') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
        <Frown className="w-3 h-3" />
        <span>Negative</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
      <Meh className="w-3 h-3" />
      <span>Neutral</span>
    </span>
  );
}

export function StatusBadge({ status }) {
  const norm = (status || '').toLowerCase();
  if (norm === 'resolved') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        Resolved
      </span>
    );
  }
  if (norm === 'in review') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
        In Review
      </span>
    );
  }
  if (norm === 'snoozed') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-700/50 text-slate-300 border border-slate-600/40">
        Snoozed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
      New
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const norm = (priority || '').toLowerCase();
  if (norm === 'critical') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
        Critical
      </span>
    );
  }
  if (norm === 'high') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30">
        High
      </span>
    );
  }
  if (norm === 'low') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-700/40 text-slate-400 border border-slate-700">
        Low
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
      Medium
    </span>
  );
}

export function SourceBadge({ source }) {
  const norm = (source || '').toLowerCase();
  let Icon = Globe;
  let color = 'text-indigo-400';

  if (norm.includes('app store')) {
    Icon = Smartphone;
    color = 'text-sky-400';
  } else if (norm.includes('play store')) {
    Icon = Smartphone;
    color = 'text-emerald-400';
  } else if (norm.includes('support')) {
    Icon = Headphones;
    color = 'text-purple-400';
  } else if (norm.includes('survey')) {
    Icon = FileQuestion;
    color = 'text-amber-400';
  } else if (norm.includes('social')) {
    Icon = Share2;
    color = 'text-pink-400';
  } else if (norm.includes('manual')) {
    Icon = Edit;
    color = 'text-cyan-400';
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-slate-300 text-[11px] font-medium">
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <span>{source}</span>
    </span>
  );
}

