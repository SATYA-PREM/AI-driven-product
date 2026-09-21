import React from 'react';
import { PlusCircle, X } from 'lucide-react';

export default function AddFeedbackModal({
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
            <span>Add Feedback (Manual Entry)</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onCreate} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-400 text-[11px] mb-1 font-medium">
              Feedback Text <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Enter customer feedback quote or message..."
              value={formData.text || ''}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              required
              className="w-full bg-[#151d30] border border-[#232f48] rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-medium">
                Source <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.source || 'Play Store'}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full bg-[#151d30] border border-[#232f48] rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option>Play Store</option>
                <option>App Store</option>
                <option>Support</option>
                <option>Survey</option>
                <option>Social Media</option>
                <option>Manual</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-medium">Sentiment</label>
              <select
                value={formData.sentiment || 'Neutral'}
                onChange={(e) => setFormData({ ...formData, sentiment: e.target.value })}
                className="w-full bg-[#151d30] border border-[#232f48] rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option>Neutral</option>
                <option>Positive</option>
                <option>Negative</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-medium">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.category || 'Checkout & Payments'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-[#151d30] border border-[#232f48] rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option>Checkout & Payments</option>
                <option>Performance & Speed</option>
                <option>UI/UX</option>
                <option>Product Features</option>
                <option>Pricing</option>
                <option>Account & Login</option>
                <option>Others</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-medium">Priority</label>
              <select
                value={formData.priority || 'Medium'}
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

          <div className="pt-2 border-t border-[#1a2338] space-y-2">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Additional Details (Optional)
            </span>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-slate-500 text-[10px] mb-1">User ID</label>
                <input
                  type="text"
                  placeholder="user_12345"
                  value={formData.user_id || ''}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="w-full bg-[#151d30] border border-[#232f48] rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] mb-1">Device Platform</label>
                <input
                  type="text"
                  placeholder="Android / iOS / Web"
                  value={formData.device || ''}
                  onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                  className="w-full bg-[#151d30] border border-[#232f48] rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] mb-1">App Version</label>
                <input
                  type="text"
                  placeholder="v2.3.1"
                  value={formData.app_version || ''}
                  onChange={(e) => setFormData({ ...formData, app_version: e.target.value })}
                  className="w-full bg-[#151d30] border border-[#232f48] rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1a2338]">
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
              Save Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

