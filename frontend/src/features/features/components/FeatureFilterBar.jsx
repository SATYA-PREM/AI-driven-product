import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

export default function FeatureFilterBar({
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  categoryFilter,
  setCategoryFilter,
  sourceFilter,
  setSourceFilter,
  searchQuery,
  setSearchQuery,
  onOpenAdvancedFilters,
}) {
  return (
    <div className="bg-[#0e1422] border border-[#1a2338] rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#151d30] border border-[#232f48] px-2.5 py-1.5 rounded-lg text-[10.5px] text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="All">All Statuses</option>
          <option value="Implemented">Implemented</option>
          <option value="In Progress">In Progress</option>
          <option value="Planned">Planned</option>
          <option value="Not Started">Not Started</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-[#151d30] border border-[#232f48] px-2.5 py-1.5 rounded-lg text-[10.5px] text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="All">All Priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-[#151d30] border border-[#232f48] px-2.5 py-1.5 rounded-lg text-[10.5px] text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="All">All Categories</option>
          <option value="Checkout & Payments">Checkout & Payments</option>
          <option value="Payments">Payments</option>
          <option value="Order Management">Order Management</option>
          <option value="UI / UX">UI / UX</option>
          <option value="Product Discovery">Product Discovery</option>
          <option value="Notifications">Notifications</option>
          <option value="Product Info">Product Info</option>
          <option value="AI / ML">AI / ML</option>
          <option value="Account Management">Account Management</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="bg-[#151d30] border border-[#232f48] px-2.5 py-1.5 rounded-lg text-[10.5px] text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="All">All Sources</option>
          <option value="Customer Support">Customer Support</option>
          <option value="In-App Feedback">In-App Feedback</option>
          <option value="App Reviews">App Reviews</option>
          <option value="Surveys">Surveys</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#151d30] border border-[#232f48] rounded-lg pl-8 pr-3 py-1.5 text-[10.5px] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
          />
        </div>

        <button
          onClick={onOpenAdvancedFilters}
          className="flex items-center gap-1.5 bg-[#151d30] border border-[#232f48] px-3 py-1.5 rounded-lg text-[10.5px] text-slate-300 hover:border-slate-500 transition-colors shrink-0 cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span>Filters</span>
        </button>
      </div>
    </div>
  );
}

