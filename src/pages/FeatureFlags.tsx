import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Flag, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getFeatureFlags, setFeatureFlags, getRouteConfig, setRouteConfig, type FeatureFlags, type RouteConfig } from "@/lib/featureFlags";
import type { ModelChoice, Provider } from "@/lib/modelRouter";

const FeatureFlagsPage = () => {
  const [flags, setLocalFlags] = useState<FeatureFlags>(getFeatureFlags());
  const [routeConfig, setLocalRouteConfig] = useState<RouteConfig>(getRouteConfig());
  const [globalOverrideEnabled, setGlobalOverrideEnabled] = useState(false);

  const modelsByProvider: Record<Provider, string[]> = {
    lovable: [
      'google/gemini-2.5-pro',
      'google/gemini-2.5-flash',
      'google/gemini-2.5-flash-lite'
    ],
    'openai-direct': [
      'o3-2025-04-16',
      'gpt-5-2025-08-07',
      'gpt-5-mini-2025-08-07'
    ],
    anthropic: [],
    replicate: []
  };

  useEffect(() => {
    setLocalFlags(getFeatureFlags());
    setLocalRouteConfig(getRouteConfig());
    setGlobalOverrideEnabled(!!getFeatureFlags().mediatorModelOverride);
  }, []);

  const handleToggle = (key: keyof FeatureFlags) => {
    const updated = { ...flags, [key]: !flags[key] };
    setLocalFlags(updated);
    setFeatureFlags(updated);
  };

  const handleGlobalOverrideToggle = (enabled: boolean) => {
    setGlobalOverrideEnabled(enabled);
    if (!enabled) {
      const updated = { ...flags, mediatorModelOverride: null };
      setLocalFlags(updated);
      setFeatureFlags(updated);
    }
  };

  const handleGlobalProviderChange = (provider: Provider) => {
    const models = modelsByProvider[provider];
    const updated = {
      ...flags,
      mediatorModelOverride: {
        provider,
        model: models[0] || '',
        purpose: 'pi_reasoning' as const
      }
    };
    setLocalFlags(updated);
    setFeatureFlags(updated);
  };

  const handleGlobalModelChange = (model: string) => {
    if (!flags.mediatorModelOverride) return;
    const updated = {
      ...flags,
      mediatorModelOverride: {
        ...flags.mediatorModelOverride,
        model
      }
    };
    setLocalFlags(updated);
    setFeatureFlags(updated);
  };

  const handleRouteModelChange = (
    route: 'pi' | 'wc' | 'divorce',
    purpose: ModelChoice['purpose'],
    provider: Provider,
    model: string
  ) => {
    const updated = {
      ...routeConfig,
      [route]: {
        ...routeConfig[route],
        [purpose]: { provider, model, purpose }
      }
    };
    setLocalRouteConfig(updated);
    setRouteConfig(updated);
  };

  const flagDescriptions: Record<string, { title: string; description: string; status: string }> = {
    mediatorOverlay: {
      title: "Mediator Overlay",
      description: "Enable AI mediator overlay on case evaluation screens",
      status: "Development",
    },
    modelAuditTools: {
      title: "Model Audit Tools",
      description: "Show internal model diagnostics and comparable case auditing",
      status: "Development",
    },
    pi_v2_preview: {
      title: "PI v2 Preview",
      description: "Enable next-generation Personal Injury evaluation interface",
      status: "Preview",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to="/hub">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Hub
            </Button>
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <Flag className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Feature Flags
            </h1>
          </div>
          <p className="text-gray-600">
            Developer tools for toggling experimental features and model overrides
          </p>
        </div>

        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ToggleRight className="w-5 h-5 text-blue-600" />
              Configuration
            </CardTitle>
            <CardDescription>
              Toggle features on or off. Changes are saved to browser storage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(Object.keys(flagDescriptions) as Array<keyof typeof flagDescriptions>).map((key) => {
              const info = flagDescriptions[key];
              const isEnabled = flags[key as keyof FeatureFlags] as boolean;

              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{info.title}</h3>
                      <Badge variant={isEnabled ? "default" : "secondary"}>
                        {isEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {info.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{info.description}</p>
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                      {key}: {isEnabled.toString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    {isEnabled ? (
                      <ToggleRight className="w-5 h-5 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                    )}
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => handleToggle(key as keyof FeatureFlags)}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ToggleRight className="w-5 h-5 text-purple-600" />
              Global Model Override
            </CardTitle>
            <CardDescription>
              Override the model for all routes and purposes. Takes highest priority.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="font-semibold">Enable Global Override</Label>
                <p className="text-sm text-gray-600 mt-1">
                  Force a specific provider/model across entire application
                </p>
              </div>
              <Switch
                checked={globalOverrideEnabled}
                onCheckedChange={handleGlobalOverrideToggle}
              />
            </div>

            {globalOverrideEnabled && (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select
                    value={flags.mediatorModelOverride?.provider || 'lovable'}
                    onValueChange={(value) => handleGlobalProviderChange(value as Provider)}
                  >
                    <SelectTrigger className="bg-white z-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-[100]">
                      <SelectItem value="lovable">Lovable AI</SelectItem>
                      <SelectItem value="openai-direct">OpenAI Direct</SelectItem>
                      <SelectItem value="anthropic" disabled>Anthropic (not configured)</SelectItem>
                      <SelectItem value="replicate" disabled>Replicate (not configured)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select
                    value={flags.mediatorModelOverride?.model || ''}
                    onValueChange={handleGlobalModelChange}
                  >
                    <SelectTrigger className="bg-white z-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-[100]">
                      {modelsByProvider[flags.mediatorModelOverride?.provider || 'lovable'].map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Badge variant="outline" className="w-full justify-center">
                  Currently: {flags.mediatorModelOverride?.provider} / {flags.mediatorModelOverride?.model}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle>Route-Specific Model Overrides</CardTitle>
            <CardDescription>
              Configure models per route and purpose. Only active when global override is OFF.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="pi">
                <AccordionTrigger>Personal Injury (PI)</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  {(['pi_reasoning', 'pi_docs'] as const).map((purpose) => {
                    const current = routeConfig.pi?.[purpose];
                    return (
                      <div key={purpose} className="p-4 border rounded-lg space-y-3">
                        <h4 className="font-semibold capitalize">{purpose.replace('_', ' ')}</h4>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Provider</Label>
                            <Select
                              value={current?.provider || 'lovable'}
                              onValueChange={(provider) => {
                                const models = modelsByProvider[provider as Provider];
                                handleRouteModelChange('pi', purpose, provider as Provider, models[0] || '');
                              }}
                            >
                              <SelectTrigger className="bg-white z-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white z-[90]">
                                <SelectItem value="lovable">Lovable AI</SelectItem>
                                <SelectItem value="openai-direct">OpenAI Direct</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Model</Label>
                            <Select
                              value={current?.model || ''}
                              onValueChange={(model) => {
                                const provider = current?.provider || 'lovable';
                                handleRouteModelChange('pi', purpose, provider, model);
                              }}
                            >
                              <SelectTrigger className="bg-white z-40">
                                <SelectValue placeholder="Select model" />
                              </SelectTrigger>
                              <SelectContent className="bg-white z-[90]">
                                {modelsByProvider[current?.provider || 'lovable'].map((model) => (
                                  <SelectItem key={model} value={model}>
                                    {model}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {current && (
                          <Badge variant="secondary" className="w-full justify-center text-xs">
                            {current.provider} / {current.model}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="wc">
                <AccordionTrigger>Workers' Comp (WC)</AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="p-4 border rounded-lg bg-gray-50 text-center text-gray-500">
                    Coming soon - route not yet implemented
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="divorce">
                <AccordionTrigger>Divorce</AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="p-4 border rounded-lg bg-gray-50 text-center text-gray-500">
                    Coming soon - route not yet implemented
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Flag className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">
                  Developer Notice
                </h3>
                <p className="text-sm text-amber-800">
                  Model overrides are stored in browser localStorage and only read by MediatorOverlay. 
                  Global override takes priority over route-specific configs. No existing PI screens are affected.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FeatureFlagsPage;
