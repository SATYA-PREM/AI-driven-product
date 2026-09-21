import React from 'react';
import {
  CreditCard,
  Wallet,
  Truck,
  Moon,
  Heart,
  UserCheck,
  Bell,
  Ruler,
  ShoppingCart,
  Sparkles,
  MapPin,
  Tag,
} from 'lucide-react';

export function PriorityBadge({ value }) {
  const map = {
    Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
    High: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    None: 'bg-slate-700/30 text-slate-400 border-slate-600/30',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
        map[value] || 'bg-slate-800 text-slate-300 border-slate-700'
      }`}
    >
      {value}
    </span>
  );
}

export function StatusBadge({ value }) {
  const map = {
    'Implemented': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'In Progress': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'Planned': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    'Not Started': 'bg-slate-700/30 text-slate-400 border-slate-600/30',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
        map[value] || 'bg-slate-800 text-slate-300 border-slate-700'
      }`}
    >
      {value}
    </span>
  );
}

export function FeatureIcon({ type, className = 'w-4 h-4' }) {
  switch (type) {
    case 'cart':
    case 'checkout':
      return (
        <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
          <ShoppingCart className={className} />
        </div>
      );
    case 'wallet':
      return (
        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <Wallet className={className} />
        </div>
      );
    case 'truck':
      return (
        <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
          <Truck className={className} />
        </div>
      );
    case 'moon':
      return (
        <div className="w-8 h-8 rounded-lg bg-slate-700/40 border border-slate-600/40 flex items-center justify-center text-slate-300 shrink-0">
          <Moon className={className} />
        </div>
      );
    case 'heart':
      return (
        <div className="w-8 h-8 rounded-lg bg-slate-700/40 border border-slate-600/40 flex items-center justify-center text-slate-300 shrink-0">
          <Heart className={className} />
        </div>
      );
    case 'user':
      return (
        <div className="w-8 h-8 rounded-lg bg-slate-700/40 border border-slate-600/40 flex items-center justify-center text-slate-300 shrink-0">
          <UserCheck className={className} />
        </div>
      );
    case 'bell':
      return (
        <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
          <Bell className={className} />
        </div>
      );
    case 'sparkles':
    case 'ai':
      return (
        <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
          <Sparkles className={className} />
        </div>
      );
    case 'address':
      return (
        <div className="w-8 h-8 rounded-lg bg-slate-700/40 border border-slate-600/40 flex items-center justify-center text-slate-300 shrink-0">
          <MapPin className={className} />
        </div>
      );
    case 'ruler':
    default:
      return (
        <div className="w-8 h-8 rounded-lg bg-slate-700/40 border border-slate-600/40 flex items-center justify-center text-slate-300 shrink-0">
          <Ruler className={className} />
        </div>
      );
  }
}

