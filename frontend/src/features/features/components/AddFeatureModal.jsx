import React from 'react';
import { PlusCircle, X } from 'lucide-react';

export default function AddFeatureModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onCreate,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0e1422] border border-[#1a2338] rounded-2xl w-full max-w-lg p-5 shadow-2xl animate-in fade-in duration-200">
        <div className="flex items-center justify-between border-b border-[#1a2338] pb-3 mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-indigo-400" />
            <span>Create New Feature</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onCreate} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-medium">Feature Name</label>
            <input
              type="text"
              placeholder="e.g. One-Click Instant Checkout"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full bg-[#151d30] border border-[#232f48] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-medium">Short Subtitle / Summary</label>
            <input
              type="text"
              placeholder="e.g. Reduce friction at the final payment step"
              value={formData.desc || ''}
              onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
              required
              className="w-full bg-[#151d30] border border-[#232f48] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-medium">Category</label>
              <select
                value={formData.category || 'Checkout & Payments'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-[#151d30] border border-[#232f48] rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option>Checkout & Payments</option>
                <option>Payments</option>
                <option>Order Management</option>
                <option>UI / UX</option>
                <option>Product Discovery</option>
                <option>Notifications</option>
                <option>Product Info</option>
                <option>AI / ML</option>
                <option>Account Management</option>
                <option>General</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-medium">Priority</label>
              <select
                value={formData.priority || 'High'}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-[#151d30] border border-[#232f48] rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-medium">Initial Status</label>
              <select
                value={formData.status || 'Not Started'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-[#151d30] border border-[#232f48] rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option>Not Started</option>
                <option>Planned</option>
                <option>In Progress</option>
                <option>Implemented</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-medium">Feature Owner</label>
              <input
                type="text"
                placeholder="e.g. Sarah Connor"
                value={formData.owner || ''}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="w-full bg-[#151d30] border border-[#232f48] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-medium">Full Description</label>
            <textarea
              rows={3}
              placeholder="Describe the feature purpose, user journey, and technical requirements..."
              value={formData.long_desc || ''}
              onChange={(e) => setFormData({ ...formData, long_desc: e.target.value })}
              className="w-full bg-[#151d30] border border-[#232f48] rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-indigo-500 leading-relaxed placeholder:text-slate-600"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1a2338]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg font-medium shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              Create Feature
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

