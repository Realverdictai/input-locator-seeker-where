export type Provider = 'lovable' | 'openai-direct' | 'anthropic' | 'replicate';

export interface ModelChoice {
  provider: Provider;
  model: string;
  purpose: 'pi_reasoning' | 'pi_docs' | 'quick_qa';
}

export interface RouteConfig {
  // per-route overrides, all optional
  pi?: Partial<Record<ModelChoice['purpose'], ModelChoice>>;
  wc?: Partial<Record<ModelChoice['purpose'], ModelChoice>>;
  divorce?: Partial<Record<ModelChoice['purpose'], ModelChoice>>;
}

export interface FeatureFlags {
  mediatorOverlay: boolean;
  modelAuditTools: boolean;
  pi_v2_preview: boolean;
  mediatorModelOverride?: ModelChoice | null; // global override switch
}

export function getDefaultModels(): Record<ModelChoice['purpose'], ModelChoice> {
  return {
    pi_reasoning: { provider: 'lovable', model: 'google/gemini-2.5-pro', purpose: 'pi_reasoning' },
    pi_docs:      { provider: 'lovable', model: 'google/gemini-2.5-flash', purpose: 'pi_docs' },
    quick_qa:     { provider: 'openai-direct', model: 'gpt-5-mini-2025-08-07', purpose: 'quick_qa' },
  };
}

export function resolveModel(
  purpose: ModelChoice['purpose'], 
  flags: FeatureFlags, 
  route?: 'pi' | 'wc' | 'divorce', 
  routeConfig?: RouteConfig
): ModelChoice {
  // Global override takes highest priority
  if (flags?.mediatorModelOverride) {
    return flags.mediatorModelOverride;
  }
  
  // Get defaults
  const defaults = getDefaultModels();
  const base = defaults[purpose];
  
  // If no route or no route config, return base default
  if (!route || !routeConfig?.[route]) {
    return base;
  }
  
  // Check for route-specific override
  const routeOverrides = routeConfig[route];
  const override = routeOverrides?.[purpose];
  
  return override ?? base;
}
