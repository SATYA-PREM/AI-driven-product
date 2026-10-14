import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  XCircle,
  UserCheck,
  RotateCcw,
  Clock,
  AlertTriangle,
  Search,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { prdAssignmentApi } from '../../api/prdAssignment';
import { prdApi } from '../../api/prd';
import { useTheme } from '../../context/ThemeContext';
import {
  getActiveDatasetId,
  subscribeToActiveDataset,
  getActiveSourceType,
  subscribeToActiveSourceType,
} from '../../utils/workspaceAccess';

export default function TeamResponsesPage() {
  const { workspaceId } = useParams();
  const { isDark } = useTheme();

  // State
  const [activeDatasetId, setActiveDatasetId] = useState(getActiveDatasetId());
  const [activeSourceType, setActiveSourceType] = useState(getActiveSourceType());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [prds, setPrds] = useState([]);

  // Filters
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    assignment: null,
    action: 'ACCEPT', // 'ACCEPT' | 'REJECT'
    notes: '',
  });

  const [reassignModal, setReassignModal] = useState({
    isOpen: false,
    assignment: null,
    targetUserId: '',
    reason: '',
  });

  const [notification, setNotification] = useState(null);

  // Subscribe to scope updates
  useEffect(() => {
    const unsubDs = subscribeToActiveDataset((dsId) => {
      setActiveDatasetId(dsId || '');
    });
    const unsubSrc = subscribeToActiveSourceType((src) => {
      setActiveSourceType(src || 'all');
    });
    return () => {
      unsubDs();
      unsubSrc();
    };
  }, []);

  // Fetch data
  const fetchData = async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);

      // Fetch PRDs, Assignments, and Team Members concurrently
      const [prdsRes, membersRes] = await Promise.all([
        prdApi.listProjects(workspaceId, {
          datasetId: activeDatasetId && activeDatasetId !== 'ALL' && activeDatasetId !== 'all' ? activeDatasetId : undefined,
          sourceType: activeSourceType && activeSourceType !== 'ALL' && activeSourceType !== 'all' ? activeSourceType : undefined,
        }).catch(() => []),
        prdAssignmentApi.getWorkspaceTeamMembers(workspaceId).catch(() => []),
      ]);

      const prdList = Array.isArray(prdsRes) ? prdsRes : [];
      setPrds(prdList);
      setTeamMembers(membersRes || []);

      const prdIds = prdList.map((p) => p.prd_id || p.id).filter(Boolean);

      // Fetch assignments scoped to the matched PRDs, or all workspace assignments if prdIds empty
      let assignmentsRes = await prdAssignmentApi.listAssignments(workspaceId, {
        prd_ids: prdIds.length > 0 ? prdIds : undefined,
      }).catch(() => []);

      // If scoped fetch returned empty, try fetching all workspace assignments so numbers are populated
      if ((!assignmentsRes || assignmentsRes.length === 0) && prdIds.length > 0) {
        const fallbackAssignments = await prdAssignmentApi.listAssignments(workspaceId).catch(() => []);
        if (fallbackAssignments && fallbackAssignments.length > 0) {
          assignmentsRes = fallbackAssignments;
        }
      }

      setAssignments(assignmentsRes || []);
    } catch (err) {
      console.error('Error fetching team responses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [workspaceId, activeDatasetId, activeSourceType]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // PM Review Handler (Accept / Reject)
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewModal.assignment) return;
    try {
      setActionLoading(true);
      await prdAssignmentApi.reviewMemberResponse(workspaceId, reviewModal.assignment.assignment_id, {
        action: reviewModal.action,
        notes: reviewModal.notes,
      });

      showNotification(
        `Successfully ${reviewModal.action === 'ACCEPT' ? 'accepted' : 'rejected'} submission for ${reviewModal.assignment.requirement_title || reviewModal.assignment.requirement_id}`,
        'success'
      );
      setReviewModal({ isOpen: false, assignment: null, action: 'ACCEPT', notes: '' });
      await fetchData();
    } catch (err) {
      console.error('Error submitting review:', err);
      showNotification(err.message || 'Failed to submit review action', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // PM Reassign Handler
  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!reassignModal.assignment || !reassignModal.targetUserId) return;
    try {
      setActionLoading(true);
      await prdAssignmentApi.reassignMemberTask(workspaceId, reassignModal.assignment.assignment_id, {
        new_user_id: reassignModal.targetUserId,
        reason: reassignModal.reason || 'Reassigned by PM from Team Responses overview',
      });

      showNotification('Task successfully reassigned to team member.', 'success');
      setReassignModal({ isOpen: false, assignment: null, targetUserId: '', reason: '' });
      await fetchData();
    } catch (err) {
      console.error('Error reassigning task:', err);
      showNotification(err.message || 'Failed to reassign task', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics summary
  const summary = useMemo(() => {
    const total = assignments.length;
    const withResponse = assignments.filter((a) => a.response || a.submitted_at);
    const accepted = assignments.filter(
      (a) => a.review_status === 'ACCEPTED' || ['COMPLETED', 'APPROVED'].includes(a.status)
    );
    const rejected = assignments.filter(
      (a) => a.review_status === 'REJECTED' || a.status === 'REJECTED'
    );
    const pendingReview = assignments.filter(
      (a) => (a.response || a.submitted_at) && !['ACCEPTED', 'REJECTED'].includes(a.review_status)
    );
    const inProgress = assignments.filter((a) => ['IN_PROGRESS', 'ASSIGNED'].includes(a.status));
    const blocked = assignments.filter((a) => a.status === 'BLOCKED');

    return {
      total,
      withResponse: withResponse.length,
      accepted: accepted.length,
      rejected: rejected.length,
      pendingReview: pendingReview.length,
      inProgress: inProgress.length,
      blocked: blocked.length,
    };
  }, [assignments]);

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      // Role filter
      if (selectedRole !== 'ALL' && a.team_role !== selectedRole) {
        return false;
      }
      // Status filter
      if (selectedStatus === 'ACCEPTED' && a.review_status !== 'ACCEPTED') return false;
      if (selectedStatus === 'REJECTED' && a.review_status !== 'REJECTED' && a.status !== 'REJECTED') return false;
      if (selectedStatus === 'PENDING_REVIEW' && (!a.response || a.review_status === 'ACCEPTED' || a.review_status === 'REJECTED')) return false;
      if (selectedStatus === 'IN_PROGRESS' && a.status !== 'IN_PROGRESS') return false;
      if (selectedStatus === 'BLOCKED' && a.status !== 'BLOCKED') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = (a.requirement_title || '').toLowerCase();
        const reqId = (a.requirement_id || '').toLowerCase();
        const user = (a.user_name || '').toLowerCase();
        const resp = (a.response || '').toLowerCase();
        const prd = (a.prd_title || '').toLowerCase();
        return title.includes(q) || reqId.includes(q) || user.includes(q) || resp.includes(q) || prd.includes(q);
      }
      return true;
    });
  }, [assignments, selectedRole, selectedStatus, searchQuery]);

  return (
    <div className={`min-h-screen p-6 space-y-6 transition-colors duration-200 ${isDark ? 'bg-[#070910] text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl border shadow-xl flex items-center space-x-3 transition-all ${
            notification.type === 'error'
              ? isDark ? 'bg-rose-950/90 border-rose-600/50 text-rose-200' : 'bg-rose-50 border-rose-300 text-rose-700'
              : isDark ? 'bg-emerald-950/90 border-emerald-600/50 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-700'
          }`}
        >
          {notification.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
        <div>
          <div className="flex items-center space-x-3">
            <span className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-md border ${
              isDark ? 'bg-[#5b3df5]/10 border-[#5b3df5]/30 text-[#a594fd]' : 'bg-[#5b3df5]/10 border-[#5b3df5]/30 text-[#5b3df5]'
            }`}>
              Product Manager Hub
            </span>
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Scope: {activeDatasetId ? `Dataset (${activeDatasetId.slice(-6)})` : 'All Batches'} • Source: {activeSourceType}
            </span>
          </div>
          <h1 className={`text-2xl font-bold tracking-tight mt-1.5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Users className="w-6 h-6 text-[#7257ff]" />
            Team Member Responses & Review
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Review deliverables submitted by Designers, Developers, and QA Leads. Accept, reject with feedback, or reassign tasks across the roster.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to={`/workspace/${workspaceId}/resolution-audit`}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border flex items-center space-x-2 transition-all shadow-sm ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/80'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Problem Resolution & Tasks Queue</span>
          </Link>
          <button
            onClick={fetchData}
            disabled={loading}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border flex items-center space-x-2 transition-all shadow-sm ${
              isDark
                ? 'bg-[#5b3df5]/20 hover:bg-[#5b3df5]/30 text-[#9f8bff] border-[#5b3df5]/40'
                : 'bg-[#5b3df5]/10 hover:bg-[#5b3df5]/20 text-[#5b3df5] border-[#5b3df5]/30'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className={`rounded-xl p-4 shadow-sm border transition-all ${
          isDark ? 'bg-[#0e1220]/70 border-slate-800/80 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Assignments</div>
          <div className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{summary.total}</div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Across active scope</div>
        </div>

        <div className={`rounded-xl p-4 shadow-sm border transition-all ${
          isDark ? 'bg-[#0e1220]/70 border-amber-500/30 text-amber-200' : 'bg-amber-50/50 border-amber-200 text-amber-900'
        }`}>
          <div className={`text-xs font-medium flex items-center gap-1.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
            <Clock className="w-3.5 h-3.5" /> Pending PM Review
          </div>
          <div className={`text-2xl font-bold mt-1 ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>{summary.pendingReview}</div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-amber-400/70' : 'text-amber-600'}`}>Submissions awaiting sign-off</div>
        </div>

        <div className={`rounded-xl p-4 shadow-sm border transition-all ${
          isDark ? 'bg-[#0e1220]/70 border-emerald-500/30 text-emerald-200' : 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
        }`}>
          <div className={`text-xs font-medium flex items-center gap-1.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Accepted / Verified
          </div>
          <div className={`text-2xl font-bold mt-1 ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>{summary.accepted}</div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-emerald-400/70' : 'text-emerald-600'}`}>Approved by PM</div>
        </div>

        <div className={`rounded-xl p-4 shadow-sm border transition-all ${
          isDark ? 'bg-[#0e1220]/70 border-rose-500/30 text-rose-200' : 'bg-rose-50/50 border-rose-200 text-rose-900'
        }`}>
          <div className={`text-xs font-medium flex items-center gap-1.5 ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
            <XCircle className="w-3.5 h-3.5" /> Rejected / Needs Work
          </div>
          <div className={`text-2xl font-bold mt-1 ${isDark ? 'text-rose-300' : 'text-rose-800'}`}>{summary.rejected}</div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-rose-400/70' : 'text-rose-600'}`}>Changes requested</div>
        </div>

        <div className={`rounded-xl p-4 shadow-sm border transition-all ${
          isDark ? 'bg-[#0e1220]/70 border-blue-500/30 text-blue-200' : 'bg-blue-50/50 border-blue-200 text-blue-900'
        }`}>
          <div className={`text-xs font-medium flex items-center gap-1.5 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
            <RotateCcw className="w-3.5 h-3.5" /> In Progress
          </div>
          <div className={`text-2xl font-bold mt-1 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>{summary.inProgress}</div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-blue-400/70' : 'text-blue-600'}`}>Being executed</div>
        </div>

        <div className={`rounded-xl p-4 shadow-sm border transition-all ${
          isDark ? 'bg-[#0e1220]/70 border-orange-500/30 text-orange-200' : 'bg-orange-50/50 border-orange-200 text-orange-900'
        }`}>
          <div className={`text-xs font-medium flex items-center gap-1.5 ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>
            <AlertTriangle className="w-3.5 h-3.5" /> Blocked Tasks
          </div>
          <div className={`text-2xl font-bold mt-1 ${isDark ? 'text-orange-300' : 'text-orange-800'}`}>{summary.blocked}</div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-orange-400/70' : 'text-orange-600'}`}>Has impediments</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`border rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm transition-all ${
        isDark ? 'bg-[#0d111d] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Role Filter */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs ${
            isDark ? 'bg-[#121727] border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className={`bg-transparent outline-none cursor-pointer font-medium ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}
            >
              <option value="ALL" className={isDark ? 'bg-[#121727] text-white' : 'bg-white text-slate-800'}>All Roles</option>
              <option value="PRODUCT_DESIGNER" className={isDark ? 'bg-[#121727] text-white' : 'bg-white text-slate-800'}>Product Designer</option>
              <option value="DEVELOPER" className={isDark ? 'bg-[#121727] text-white' : 'bg-white text-slate-800'}>Lead Developer</option>
              <option value="QA" className={isDark ? 'bg-[#121727] text-white' : 'bg-white text-slate-800'}>QA Lead / Tester</option>
              <option value="STAKEHOLDER" className={isDark ? 'bg-[#121727] text-white' : 'bg-white text-slate-800'}>Stakeholder</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs ${
            isDark ? 'bg-[#121727] border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`bg-transparent outline-none cursor-pointer font-medium ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}
            >
              <option value="ALL" className={isDark ? 'bg-[#121727] text-white' : 'bg-white text-slate-800'}>All Statuses</option>
              <option value="PENDING_REVIEW" className={isDark ? 'bg-[#121727] text-white' : 'bg-white text-slate-800'}>Awaiting PM Review</option>
              <option value="ACCEPTED" className={isDark ? 'bg-[#121727] text-white' : 'bg-white text-slate-800'}>Accepted / Approved</option>
              <option value="REJECTED" className={isDark ? 'bg-[#121727] text-white' : 'bg-white text-slate-800'}>Rejected / Changes Needed</option>
              <option value="IN_PROGRESS" className={isDark ? 'bg-[#121727] text-white' : 'bg-white text-slate-800'}>In Progress</option>
              <option value="BLOCKED" className={isDark ? 'bg-[#121727] text-white' : 'bg-white text-slate-800'}>Blocked</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search by title, requirement, member, response..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 rounded-lg text-xs outline-none transition-colors border ${
              isDark
                ? 'bg-[#121727] border-slate-800 text-slate-200 placeholder-slate-500 focus:border-[#5b3df5]/60'
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-[#5b3df5]'
            }`}
          />
        </div>
      </div>

      {/* Main Table / Response Cards */}
      {loading ? (
        <div className={`h-64 flex flex-col items-center justify-center space-y-3 rounded-xl border ${
          isDark ? 'bg-[#0d111d] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5b3df5]"></div>
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading team responses for selected scope...</span>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className={`h-64 flex flex-col items-center justify-center space-y-2 rounded-xl border text-center p-6 ${
          isDark ? 'bg-[#0d111d] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <Users className={`w-10 h-10 mb-1 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
          <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>No Assignments Found</h3>
          <p className={`text-xs max-w-md ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            No team member responses match the selected filters for workspace scope{' '}
            <span className={isDark ? 'text-slate-400 font-medium' : 'text-slate-700 font-medium'}>
              {activeDatasetId ? `dataset: ${activeDatasetId}` : 'all datasets'}
            </span>.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((asn) => {
            const hasResponse = Boolean(asn.response || asn.submitted_at);
            const isAccepted = asn.review_status === 'ACCEPTED' || ['COMPLETED', 'APPROVED'].includes(asn.status);
            const isRejected = asn.review_status === 'REJECTED' || asn.status === 'REJECTED';
            const isBlocked = asn.status === 'BLOCKED';

            return (
              <div
                key={asn.assignment_id}
                className={`border rounded-xl p-5 transition-all shadow-sm space-y-4 ${
                  isDark
                    ? 'bg-[#0e1220] border-slate-800/90 hover:border-slate-700/80 text-slate-100'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                }`}
              >
                {/* Header Row */}
                <div className={`flex flex-col md:flex-row md:items-start justify-between gap-3 border-b pb-3 ${
                  isDark ? 'border-slate-800/70' : 'border-slate-100'
                }`}>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                        isDark ? 'text-[#a594fd] bg-[#5b3df5]/10 border-[#5b3df5]/30' : 'text-[#5b3df5] bg-[#5b3df5]/10 border-[#5b3df5]/30'
                      }`}>
                        {asn.requirement_id || 'REQ'}
                      </span>
                      <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {asn.prd_title || 'PRD Document'}
                      </span>
                      <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>•</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded border ${
                        isDark ? 'text-slate-400 bg-slate-800/80 border-slate-700/60' : 'text-slate-600 bg-slate-100 border-slate-200'
                      }`}>
                        {asn.team_role || 'MEMBER'}
                      </span>
                    </div>
                    <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {asn.requirement_title || 'Requirement Deliverable'}
                    </h3>
                  </div>

                  {/* Badges & Status */}
                  <div className="flex items-center space-x-2">
                    {isAccepted && (
                      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border ${
                        isDark ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      }`}>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Accepted by PM</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border ${
                        isDark ? 'bg-rose-950/80 border-rose-500/40 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-700'
                      }`}>
                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        <span>Changes Requested</span>
                      </span>
                    )}
                    {isBlocked && (
                      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border ${
                        isDark ? 'bg-orange-950/80 border-orange-500/40 text-orange-300' : 'bg-orange-50 border-orange-300 text-orange-700'
                      }`}>
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                        <span>Blocked</span>
                      </span>
                    )}
                    {!isAccepted && !isRejected && !isBlocked && (
                      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border ${
                        isDark ? 'bg-blue-950/80 border-blue-500/40 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'
                      }`}>
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span>{asn.status || 'IN_PROGRESS'}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Member & Response Section */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Left Column: Assigned Member details */}
                  <div className={`md:col-span-4 rounded-lg p-3.5 space-y-2.5 border ${
                    isDark ? 'bg-[#090d18] border-slate-800/80' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Assigned Member
                    </div>
                    <div className="flex items-center space-x-3">
                      {asn.user_avatar ? (
                        <img
                          src={asn.user_avatar}
                          alt={asn.user_name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-slate-700"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border ${
                          isDark ? 'bg-[#1b2238] text-slate-300 border-slate-700' : 'bg-slate-200 text-slate-700 border-slate-300'
                        }`}>
                          {(asn.user_name || 'U')[0]}
                        </div>
                      )}
                      <div>
                        <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{asn.user_name || 'Assigned Lead'}</div>
                        <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{asn.role_title || asn.team_role}</div>
                        <div className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{asn.user_email}</div>
                      </div>
                    </div>
                    <div className={`pt-2 border-t flex items-center justify-between text-xs ${
                      isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
                    }`}>
                      <span>Method: <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{asn.assignment_method || 'MANUAL'}</strong></span>
                      {asn.submitted_at && (
                        <span>Submitted: <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{new Date(asn.submitted_at).toLocaleDateString()}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Member Response & Blockers */}
                  <div className={`md:col-span-8 rounded-lg p-3.5 space-y-3 border ${
                    isDark ? 'bg-[#090d18] border-slate-800/80' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        <MessageSquare className="w-3.5 h-3.5 text-[#8b72ff]" />
                        Member Work Submission & Findings
                      </div>
                      {asn.submitted_by && (
                        <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          Submitted by {asn.submitted_by}
                        </span>
                      )}
                    </div>

                    {asn.response ? (
                      <div className={`text-xs whitespace-pre-wrap leading-relaxed p-3 rounded border font-mono ${
                        isDark ? 'bg-[#101526] text-slate-300 border-slate-800/80' : 'bg-white text-slate-800 border-slate-200 shadow-sm'
                      }`}>
                        {asn.response}
                      </div>
                    ) : (
                      <div className={`text-xs italic p-3 rounded border border-dashed ${
                        isDark ? 'bg-[#101526]/50 text-slate-500 border-slate-800' : 'bg-white/80 text-slate-400 border-slate-200'
                      }`}>
                        No work response notes submitted yet. The member is currently progressing on this deliverable.
                      </div>
                    )}

                    {asn.blocker_comment && (
                      <div className={`rounded p-2.5 text-xs flex items-start space-x-2 border ${
                        isDark ? 'bg-orange-950/30 border-orange-500/30 text-orange-300' : 'bg-orange-50 border-orange-200 text-orange-800'
                      }`}>
                        <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong>Reported Blocker:</strong> {asn.blocker_comment}
                        </div>
                      </div>
                    )}

                    {asn.review_notes && (
                      <div className={`rounded p-2.5 text-xs border ${
                        isDark ? 'bg-slate-900 border-slate-700/60 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}>
                        <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>PM Review Notes ({asn.reviewed_by || 'PM'}):</strong>{' '}
                        {asn.review_notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* PM Action Bar */}
                <div className={`flex flex-wrap items-center justify-between gap-3 pt-2 border-t ${
                  isDark ? 'border-slate-800/50' : 'border-slate-100'
                }`}>
                  <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Assignment ID: <span className={`font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{asn.assignment_id}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Reassign Button */}
                    <button
                      onClick={() => setReassignModal({ isOpen: true, assignment: asn, targetUserId: '', reason: '' })}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center space-x-1.5 transition-colors ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-sm'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Reassign</span>
                    </button>

                    {/* Reject Button */}
                    <button
                      onClick={() => setReviewModal({ isOpen: true, assignment: asn, action: 'REJECT', notes: '' })}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center space-x-1.5 transition-colors ${
                        isDark
                          ? 'bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border-rose-800/60'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-500" />
                      <span>Reject & Request Changes</span>
                    </button>

                    {/* Accept Button */}
                    <button
                      onClick={() => setReviewModal({ isOpen: true, assignment: asn, action: 'ACCEPT', notes: '' })}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 transition-colors shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accept Submission</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal (Accept / Reject) */}
      {reviewModal.isOpen && reviewModal.assignment && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl ${
            isDark ? 'bg-[#0e1220] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {reviewModal.action === 'ACCEPT' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Accept Member Deliverable
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-500" /> Reject Deliverable & Request Changes
                  </>
                )}
              </h3>
              <button
                onClick={() => setReviewModal({ isOpen: false, assignment: null, action: 'ACCEPT', notes: '' })}
                className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
              >
                ✕
              </button>
            </div>

            <div className={`text-xs space-y-1 p-3 rounded-lg border ${
              isDark ? 'bg-[#121727] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div><strong>Requirement:</strong> {reviewModal.assignment.requirement_title || reviewModal.assignment.requirement_id}</div>
              <div><strong>Assignee:</strong> {reviewModal.assignment.user_name} ({reviewModal.assignment.team_role})</div>
              {reviewModal.assignment.response && (
                <div className={`mt-2 pt-2 border-t ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                  <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>Submitted Response:</span>
                  <div className="mt-1 line-clamp-3 italic font-mono">{reviewModal.assignment.response}</div>
                </div>
              )}
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {reviewModal.action === 'ACCEPT' ? 'Acceptance / Approval Notes' : 'Rejection Reason & Required Fixes *'}
                </label>
                <textarea
                  rows={4}
                  required={reviewModal.action === 'REJECT'}
                  placeholder={
                    reviewModal.action === 'ACCEPT'
                      ? 'e.g., Deliverable verified against acceptance criteria and approved for release testing.'
                      : 'e.g., Please address missing error recovery boundary test cases and update the UI feedback state.'
                  }
                  value={reviewModal.notes}
                  onChange={(e) => setReviewModal((prev) => ({ ...prev, notes: e.target.value }))}
                  className={`w-full rounded-lg p-2.5 text-xs outline-none border transition-colors ${
                    isDark
                      ? 'bg-[#121727] border-slate-700 text-slate-100 placeholder-slate-500 focus:border-[#5b3df5]'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#5b3df5]'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModal({ isOpen: false, assignment: null, action: 'ACCEPT', notes: '' })}
                  className={`px-4 py-2 text-xs font-medium ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg text-white shadow flex items-center space-x-2 ${
                    reviewModal.action === 'ACCEPT'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {actionLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : reviewModal.action === 'ACCEPT' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span>{reviewModal.action === 'ACCEPT' ? 'Confirm Acceptance' : 'Confirm Rejection'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {reassignModal.isOpen && reassignModal.assignment && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl ${
            isDark ? 'bg-[#0e1220] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <UserCheck className="w-5 h-5 text-[#8b72ff]" /> Reassign Requirement Task
              </h3>
              <button
                onClick={() => setReassignModal({ isOpen: false, assignment: null, targetUserId: '', reason: '' })}
                className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
              >
                ✕
              </button>
            </div>

            <div className={`text-xs space-y-1 p-3 rounded-lg border ${
              isDark ? 'bg-[#121727] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div><strong>Task:</strong> {reassignModal.assignment.requirement_title || reassignModal.assignment.requirement_id}</div>
              <div><strong>Current Assignee:</strong> {reassignModal.assignment.user_name} ({reassignModal.assignment.team_role})</div>
            </div>

            <form onSubmit={handleReassignSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Select New Team Member *
                </label>
                <select
                  required
                  value={reassignModal.targetUserId}
                  onChange={(e) => setReassignModal((prev) => ({ ...prev, targetUserId: e.target.value }))}
                  className={`w-full border rounded-lg p-2.5 text-xs outline-none ${
                    isDark
                      ? 'bg-[#121727] border-slate-700 text-slate-100 focus:border-[#5b3df5]'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-[#5b3df5]'
                  }`}
                >
                  <option value="" className={isDark ? 'bg-[#121727] text-white' : 'bg-white text-slate-800'}>-- Choose Member from Roster --</option>
                  {teamMembers.map((m) => (
                    <option key={m.user_id} value={m.user_id} className={isDark ? 'bg-[#121727] text-white' : 'bg-white text-slate-800'}>
                      {m.name} ({m.role_title || m.team_role}) — {m.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Reason for Transfer / Reassignment
                </label>
                <input
                  type="text"
                  placeholder="e.g. Workload rebalancing or specialized domain expertise"
                  value={reassignModal.reason}
                  onChange={(e) => setReassignModal((prev) => ({ ...prev, reason: e.target.value }))}
                  className={`w-full border rounded-lg p-2.5 text-xs outline-none ${
                    isDark
                      ? 'bg-[#121727] border-slate-700 text-slate-100 placeholder-slate-500 focus:border-[#5b3df5]'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#5b3df5]'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReassignModal({ isOpen: false, assignment: null, targetUserId: '', reason: '' })}
                  className={`px-4 py-2 text-xs font-medium ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !reassignModal.targetUserId}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#5b3df5] hover:bg-[#4f32e6] text-white shadow flex items-center space-x-2"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  <span>Transfer Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
