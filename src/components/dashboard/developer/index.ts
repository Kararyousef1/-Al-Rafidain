/**
 * ════════════════════════════════════════════════════════════════
 *  Developer Module Index - تصدير مكونات المطور
 * ════════════════════════════════════════════════════════════════
 *
 *  All developer-specific components live in this folder.
 *  Previously, some were scattered in src/pages/developer/ which
 *  violated the principle of "components = UI, pages = routes".
 *  After the refactor (July 2026), everything is centralized here.
 */

export { default as StatCard } from './StatCard';
export { default as ServiceCard } from './ServiceCard';
export { default as PinGate } from './PinGate';
export { default as StructureManager } from './StructureManager';
export { default as AppErrorBoundary, ErrorTrackerPanel, ErrorDetailsModal, errorStore } from './ErrorBoundary';
export { default as SystemMonitor } from './SystemMonitor';
export { default as SmartDashboard } from './SmartDashboard';
export { default as BiometricSettings } from './BiometricSettings';
export type { CapturedError } from './ErrorBoundary';
