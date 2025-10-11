import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Flag, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { getFeatureFlags, setFeatureFlags, type FeatureFlags } from "@/lib/featureFlags";

const FeatureFlagsPage = () => {
  const [flags, setLocalFlags] = useState<FeatureFlags>(getFeatureFlags());

  useEffect(() => {
    // Load flags on mount
    setLocalFlags(getFeatureFlags());
  }, []);

  const handleToggle = (key: keyof FeatureFlags) => {
    const updated = { ...flags, [key]: !flags[key] };
    setLocalFlags(updated);
    setFeatureFlags(updated);
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
            Developer tools for toggling experimental features
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
                  These flags are not yet connected to any features. They are stored in browser localStorage 
                  and will persist across sessions. No existing screens currently read these flags.
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
