import React from 'react';
import { Edit3, X } from 'lucide-react';

export default function EditFeatureModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSave,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0e1422] border border-[#1a2338] rounded-2xl w-full max-w-lg p-5 shadow-2xl animate-in fade-in duration-200">
        <div className="flex items-center justify-between border-b border-[#1a2338] pb-3 mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-indigo-400" />
            <span>Edit Feature</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-medium">Feature Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full bg-[#151d30] border border-[#232f48] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-medium">Short Subtitle</label>
            <input
              type="text"
              value={formData.desc}
              onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
              required
              className="w-full bg-[#151d30] border border-[#232f48] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-medium">Category</label>
              <select
                value={formData.category}
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
                value={formData.priority}
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
              <label className="block text-slate-400 text-[11px] mb-1 font-medium">Status</label>
              <select
                value={formData.status}
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
              <label className="block text-slate-400 text-[11px] mb-1 font-medium">Owner</label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="w-full bg-[#151d30] border border-[#232f48] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-medium">Full Description</label>
            <textarea
              rows={3}
              value={formData.long_desc}
              onChange={(e) => setFormData({ ...formData, long_desc: e.target.value })}
              className="w-full bg-[#151d30] border border-[#232f48] rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-indigo-500 leading-relaxed"
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

