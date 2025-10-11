import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlayCircle } from "lucide-react";
import MediatorOverlay from "./MediatorOverlay";
import type { ModelChoice } from "@/lib/modelRouter";

const PI_MediatorDemo = () => {
  const [purpose, setPurpose] = useState<ModelChoice['purpose']>('pi_reasoning');
  const [prompt, setPrompt] = useState(
    "You are evaluating a PI case. Facts: rear-end; low damage photos; CT negative; PT 12 visits; policy limits 15/30; venue LA; prior 2019 strain. Produce a 3-bullet risk summary and a settlement bracket with rationale."
  );
  const [showOverlay, setShowOverlay] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);

  const handleRun = () => {
    setTriggerMessage(prompt);
    setShowOverlay(true);
  };

  const handleClose = () => {
    setShowOverlay(false);
    setTriggerMessage(null);
  };

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-green-600" />
            PI Mediator Demo
          </CardTitle>
          <CardDescription>
            Test model routing with different purposes. Uses MediatorOverlay with route='pi'.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Purpose</Label>
            <Select
              value={purpose}
              onValueChange={(value) => setPurpose(value as ModelChoice['purpose'])}
            >
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="pi_reasoning">PI Reasoning</SelectItem>
                <SelectItem value="pi_docs">PI Docs</SelectItem>
                <SelectItem value="quick_qa">Quick QA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Test Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] bg-white font-mono text-sm"
              placeholder="Enter test prompt..."
            />
          </div>

          <Button
            onClick={handleRun}
            className="w-full"
            disabled={!prompt.trim()}
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Run Demo
          </Button>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <strong>Note:</strong> This will open MediatorOverlay with route='pi' and your selected purpose.
            Model selection is controlled by feature flags above.
          </div>
        </CardContent>
      </Card>

      {showOverlay && (
        <MediatorOverlay
          open={showOverlay}
          onOpenChange={(open) => {
            setShowOverlay(open);
            if (!open) setTriggerMessage(null);
          }}
          purpose={purpose}
          route="pi"
          initialMessage={triggerMessage || undefined}
          hideTrigger={true}
        />
      )}
    </>
  );
};

export default PI_MediatorDemo;
