import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Flag, ToggleLeft, ToggleRight, PlayCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getFeatureFlags, setFeatureFlags, getRouteConfig, setRouteConfig, type FeatureFlags, type RouteConfig } from "@/lib/featureFlags";
import type { ModelChoice, Provider } from "@/lib/modelRouter";
import PI_MediatorDemo from "@/components/PI_MediatorDemo";
import MediatorOverlay from "@/components/MediatorOverlay";
import { PI_SYSTEM_PROMPT } from "@/mediator/pi_brain";
import { queryCasesToolSchema } from "../../supabase/functions/tools/db_read/schema";
import { startPiSession, type JudgeIskanderSessionBrain } from "@/agents/judgeIskander/session_brain";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

const FeatureFlagsPage = () => {
  const [flags, setLocalFlags] = useState<FeatureFlags>(getFeatureFlags());
  const [routeConfig, setLocalRouteConfig] = useState<RouteConfig>(getRouteConfig());
  const [globalOverrideEnabled, setGlobalOverrideEnabled] = useState(false);
  const [showSmokeTest, setShowSmokeTest] = useState(false);
  const [showJudgeIskanderTest, setShowJudgeIskanderTest] = useState(false);
  const [sessionBrain, setSessionBrain] = useState<JudgeIskanderSessionBrain | null>(null);
  const [sessionLog, setSessionLog] = useState<Array<{
    type: 'user' | 'assistant' | 'tool';
    content: string;
    timestamp: Date;
  }>>([]);
  const { toast } = useToast();

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

  const handleJudgeIskanderTest = async () => {
    setSessionLog([]);
    setShowJudgeIskanderTest(true);

    try {
      // Seed the initial user message
      const seedMessage = "Rear-end, LA, CT negative, PT 12… demand 35k, offer 8k; limits unknown";
      
      setSessionLog(prev => [...prev, {
        type: 'user',
        content: seedMessage,
        timestamp: new Date()
      }]);

      let responsesReceived = 0;
      
      const brain = await startPiSession({
        stepHint: 'upload_intake',
        onPartial: () => {}, // Ignore partials for this test
        onFinal: (text, speaker) => {
          if (speaker === 'assistant') {
            responsesReceived++;
            if (responsesReceived <= 2) {
              setSessionLog(prev => [...prev, {
                type: 'assistant',
                content: text,
                timestamp: new Date()
              }]);
            }
          }
        },
        onToolCall: (toolName, args, result) => {
          if (toolName === 'update_field' && result.ok) {
            setSessionLog(prev => [...prev, {
              type: 'tool',
              content: `update_field: ${args.path} = ${JSON.stringify(args.value)}`,
              timestamp: new Date()
            }]);
          }
        },
        onError: (error) => {
          toast({
            title: 'Session Error',
            description: error.message,
            variant: 'destructive'
          });
        }
      });

      setSessionBrain(brain);

      // Send the seed message
      brain.sendUserMessage(seedMessage);

      toast({
        title: 'Test Started',
        description: 'Judge Iskander session initiated',
        duration: 2000
      });

    } catch (error) {
      console.error('Failed to start test:', error);
      toast({
        title: 'Test Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  const handleStopJudgeIskanderTest = () => {
    if (sessionBrain) {
      sessionBrain.stop();
      setSessionBrain(null);
    }
    setShowJudgeIskanderTest(false);
    toast({
      title: 'Test Stopped',
      description: 'Judge Iskander session ended',
      duration: 2000
    });
  };

  const flagDescriptions: Record<string, { title: string; description: string; status: string }> = {
    mediatorOverlay: {
      title: "Enable Judge Iskander Session",
      description: "Enable voice-enabled Judge Iskander mediation sessions on PI screens",
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

        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full mb-4">
              <PlayCircle className="w-4 h-4 mr-2" />
              PI Mediator Demo (Dev Only)
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mb-6">
            <PI_MediatorDemo />
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={showSmokeTest} onOpenChange={setShowSmokeTest}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full mb-4">
              <PlayCircle className="w-4 h-4 mr-2" />
              PI Brain Smoke Test (Dev Only)
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mb-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">
                  Tests the PI mediator with the query_cases tool registered. Uses OpenAI model based on global override settings.
                  The overlay will open automatically with a test case.
                </p>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={showJudgeIskanderTest} onOpenChange={setShowJudgeIskanderTest}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full mb-4">
              <PlayCircle className="w-4 h-4 mr-2" />
              PI Session Smoke Test (Judge Iskander)
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Judge Iskander Session Test</CardTitle>
                <CardDescription>
                  Seeds: "Rear-end, LA, CT negative, PT 12… demand 35k, offer 8k; limits unknown"
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!sessionBrain ? (
                  <Button onClick={handleJudgeIskanderTest} className="w-full">
                    Start Test Session
                  </Button>
                ) : (
                  <Button onClick={handleStopJudgeIskanderTest} variant="destructive" className="w-full">
                    Stop Session
                  </Button>
                )}

                {sessionLog.length > 0 && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <Label className="text-sm font-semibold mb-2 block">Session Log</Label>
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {sessionLog.map((entry, i) => (
                          <div key={i} className="text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={
                                entry.type === 'user' ? 'default' :
                                entry.type === 'assistant' ? 'secondary' :
                                'outline'
                              } className="text-xs">
                                {entry.type === 'user' ? 'User' :
                                 entry.type === 'assistant' ? 'Judge Iskander' :
                                 'Tool'}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {entry.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-gray-700 pl-2 border-l-2 border-gray-300">
                              {entry.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                <div className="text-xs text-gray-600 space-y-1">
                  <p>• Shows first 2 agent responses</p>
                  <p>• Logs all update_field actions</p>
                  <p>• Uses upload_intake step context</p>
                  <p>• Non-blocking tool execution</p>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <MediatorOverlay
          systemPrompt={PI_SYSTEM_PROMPT}
          tools={[queryCasesToolSchema]}
          purpose="pi_reasoning"
          route="pi"
          open={showSmokeTest}
          onOpenChange={setShowSmokeTest}
          initialMessage="Case 22-104. Rear-end MVA; venue LA. I have policy 15/30 with alleged neck strain, CT negative, PT x12, prior 2019 cervical strain. Offers: 8k; Demand: 35k."
          hideTrigger={true}
        />

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
