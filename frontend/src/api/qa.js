/**
 * qa.js
 * -----
 * Frontend API client for QA Lead (Tester) Workspace:
 * - Dashboard KPI & testing queues
 * - Test assignments & acceptance criteria inspection
 * - Test plans & test suites management
 * - Test cases management with step definitions
 * - Manual test execution recorder & history
 * - Defect tracking, verification & reopening
 * - Retesting queue & regression test scope
 * - QA reporting & release readiness scorecard
 * - PM clarification requests
 */

import { apiRequest } from './core';

export const qaApi = {
  getDashboard: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/qa/dashboard`);
  },

  getAssignments: async (workspaceId, status = null) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiRequest(`/workspaces/${workspaceId}/qa/assignments${query}`);
  },

  getAssignmentDetail: async (workspaceId, assignmentId) => {
    return apiRequest(`/workspaces/${workspaceId}/qa/assignments/${assignmentId}`);
  },

  updateAssignmentStatus: async (workspaceId, assignmentId, { status, notes }) => {
    const params = new URLSearchParams();
    params.append('status', status);
    if (notes) params.append('notes', notes);
    return apiRequest(`/workspaces/${workspaceId}/qa/assignments/${assignmentId}/status?${params.toString()}`, {
      method: 'PATCH',
    });
  },

  getRequirements: async (workspaceId, prdId = null) => {
    const query = prdId ? `?prd_id=${encodeURIComponent(prdId)}` : '';
    return apiRequest(`/workspaces/${workspaceId}/qa/requirements${query}`);
  },

  getTestPlans: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/qa/test-plans`);
  },

  createTestPlan: async (workspaceId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/qa/test-plans`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateTestPlan: async (workspaceId, planId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/qa/test-plans/${planId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  getTestSuites: async (workspaceId, planId = null) => {
    const query = planId ? `?plan_id=${encodeURIComponent(planId)}` : '';
    return apiRequest(`/workspaces/${workspaceId}/qa/test-suites${query}`);
  },

  createTestSuite: async (workspaceId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/qa/test-suites`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getTestCases: async (workspaceId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.suite_id) params.append('suite_id', filters.suite_id);
    if (filters.requirement_id) params.append('requirement_id', filters.requirement_id);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.test_type) params.append('test_type', filters.test_type);
    if (filters.outcome) params.append('outcome', filters.outcome);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/workspaces/${workspaceId}/qa/test-cases${qs}`);
  },

  createTestCase: async (workspaceId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/qa/test-cases`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getTestCaseDetail: async (workspaceId, caseId) => {
    return apiRequest(`/workspaces/${workspaceId}/qa/test-cases/${caseId}`);
  },

  updateTestCase: async (workspaceId, caseId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/qa/test-cases/${caseId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  executeTestCase: async (workspaceId, caseId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/qa/test-cases/${caseId}/execute`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getExecutions: async (workspaceId, caseId = null) => {
    const query = caseId ? `?case_id=${encodeURIComponent(caseId)}` : '';
    return apiRequest(`/workspaces/${workspaceId}/qa/executions${query}`);
  },

  getDefects: async (workspaceId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.assignment_id) params.append('assignment_id', filters.assignment_id);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/workspaces/${workspaceId}/qa/defects${qs}`);
  },

  createDefect: async (workspaceId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/qa/defects`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateDefect: async (workspaceId, defectId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/qa/defects/${defectId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  verifyDefect: async (workspaceId, defectId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/qa/defects/${defectId}/verify`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  reopenDefect: async (workspaceId, defectId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/qa/defects/${defectId}/reopen`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getRetestingQueue: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/qa/retesting-queue`);
  },

  getRegressionTests: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/qa/regression-tests`);
  },

  getReports: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/qa/reports`);
  },

  createReport: async (workspaceId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/qa/reports`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getReportDetail: async (workspaceId, reportId) => {
    return apiRequest(`/workspaces/${workspaceId}/qa/reports/${reportId}`);
  },

  getReleaseReadiness: async (workspaceId) => {
    return apiRequest(`/workspaces/${workspaceId}/qa/release-readiness`);
  },

  requestClarification: async (workspaceId, payload) => {
    return apiRequest(`/workspaces/${workspaceId}/qa/clarifications`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

