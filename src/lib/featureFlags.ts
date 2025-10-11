import type { ModelChoice } from './modelRouter';

export interface FeatureFlags {
  mediatorOverlay: boolean;
  modelAuditTools: boolean;
  pi_v2_preview: boolean;
  mediatorModelOverride?: ModelChoice | null;
}

export interface RouteConfig {
  pi?: Partial<Record<ModelChoice['purpose'], ModelChoice>>;
  wc?: Partial<Record<ModelChoice['purpose'], ModelChoice>>;
  divorce?: Partial<Record<ModelChoice['purpose'], ModelChoice>>;
}

const DEFAULT_FLAGS: FeatureFlags = {
  mediatorOverlay: false,
  modelAuditTools: false,
  pi_v2_preview: false,
  mediatorModelOverride: null,
};

const STORAGE_KEY = 'verdict_ai_feature_flags';
const ROUTE_CONFIG_KEY = 'verdict_ai_route_config';

export const getFeatureFlags = (): FeatureFlags => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_FLAGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load feature flags:', error);
  }
  return DEFAULT_FLAGS;
};

export const setFeatureFlags = (flags: FeatureFlags): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
  } catch (error) {
    console.error('Failed to save feature flags:', error);
  }
};

export const toggleFeatureFlag = (key: keyof FeatureFlags): FeatureFlags => {
  const flags = getFeatureFlags();
  const updated = { ...flags, [key]: !flags[key] };
  setFeatureFlags(updated);
  return updated;
};

export const getRouteConfig = (): RouteConfig => {
  try {
    const stored = localStorage.getItem(ROUTE_CONFIG_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load route config:', error);
  }
  return {};
};

export const setRouteConfig = (config: RouteConfig): void => {
  try {
    localStorage.setItem(ROUTE_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save route config:', error);
  }
};
