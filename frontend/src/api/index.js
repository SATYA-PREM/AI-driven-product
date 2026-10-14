/**
 * index.js
 * --------
 * Barrel export aggregating all modular domain API clients and core helpers.
 */

export * from './core';
export * from './auth';
export * from './workspaces';
export * from './datasets';
export * from './dataAgent';
export * from './aiAnalysis';
export * from './intelligence';
export * from './features';
export * from './feedback';
export * from './prd';
export * from './prdAssignment';
export * from './reports';
export * from './workflow';
export * from './assistant';
export * from './designer';
export * from './developer';
export * from './qa';

import { apiRequest } from './core';
import { authApi, userApi } from './auth';
import { workspaceApi, productApi } from './workspaces';
import { datasetApi } from './datasets';
import { dataAgentApi } from './dataAgent';
import { aiAnalysisApi } from './aiAnalysis';
import { intelligenceApi } from './intelligence';
import { featureApi } from './features';
import { feedbackApi } from './feedback';
import { prdApi } from './prd';
import { prdAssignmentApi } from './prdAssignment';
import { reportApi } from './reports';
import { workflowStateApi } from './workflow';
import { assistantApi } from './assistant';
import { designerApi } from './designer';
import { developerApi } from './developer';
import { qaApi } from './qa';

const api = {
  auth: authApi,
  user: userApi,
  workspaces: workspaceApi,
  products: productApi,
  intelligence: intelligenceApi,
  features: featureApi,
  feedback: feedbackApi,
  reports: reportApi,
  datasets: datasetApi,
  dataAgent: dataAgentApi,
  aiAnalysis: aiAnalysisApi,
  workflowState: workflowStateApi,
  prd: prdApi,
  prdAssignment: prdAssignmentApi,
  assistant: assistantApi,
  designer: designerApi,
  developer: developerApi,
  qa: qaApi,
  request: apiRequest,
};

export default api;


