/**
 * client.js
 * ---------
 * Modular entry point & backward-compatibility layer.
 * Re-exports all domain API clients and core helpers from their respective modules.
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
export * from './preloader';

export { default } from './index';
