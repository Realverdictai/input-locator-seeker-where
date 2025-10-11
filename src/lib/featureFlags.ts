export interface FeatureFlags {
  mediatorOverlay: boolean;
  modelAuditTools: boolean;
  pi_v2_preview: boolean;
  mediatorModelOverride?: {
    provider: string;
    model: string;
    purpose: string;
  } | null;
}

const DEFAULT_FLAGS: FeatureFlags = {
  mediatorOverlay: false,
  modelAuditTools: false,
  pi_v2_preview: false,
  mediatorModelOverride: null,
};

const STORAGE_KEY = 'verdict_ai_feature_flags';

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
