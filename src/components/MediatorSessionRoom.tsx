import { useState } from "react";
import { X, Mic, MicOff, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { dbg } from "@/debug/mediatorDebugStore";

interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp: string;
}

interface MediatorSessionRoomProps {
  route: 'pi' | 'wc' | 'divorce';
  stepId?: string;
  onClose?: () => void;
  modelPurpose?: 'pi_reasoning' | 'pi_docs' | 'quick_qa';
  transcript?: TranscriptEntry[];
  notes?: string[];
  isAgentSpeaking?: boolean;
}

export function MediatorSessionRoom({
  route,
  stepId,
  onClose,
  modelPurpose = 'pi_reasoning',
  transcript: externalTranscript,
  notes: externalNotes,
  isAgentSpeaking: externalIsAgentSpeaking
}: MediatorSessionRoomProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Use external data if provided, otherwise use mock data
  const transcript = externalTranscript || [
    { speaker: 'User', text: 'I need help evaluating this case.', timestamp: '10:23 AM' },
    { speaker: 'Mediator', text: 'I can help you with that. Let me review the details.', timestamp: '10:23 AM' }
  ];

  const notes = externalNotes || ['Case involves rear-end collision', 'Policy limits: 15/30', 'Venue: LA County'];
  const isAgentSpeaking = externalIsAgentSpeaking !== undefined ? externalIsAgentSpeaking : false;

  const piStepLabels: Record<string, string> = {
    basic: 'Basic Info',
    injury: 'Injury Details',
    medical: 'Medical Treatment',
    liability: 'Liability Factors',
    settlement: 'Settlement Strategy'
  };

  // Waveform animation component
  const Waveform = ({ isActive }: { isActive: boolean }) => (
    <div className="flex items-center gap-1 h-8">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 bg-primary rounded-full transition-all duration-300",
            isActive ? "animate-pulse" : "h-2"
          )}
          style={{
            height: isActive ? `${Math.random() * 24 + 8}px` : '8px',
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );

  // Minimized pill view
  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div
          className="bg-card border border-border rounded-full shadow-lg px-4 py-3 flex items-center gap-3 cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => setIsExpanded(true)}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              VA
            </AvatarFallback>
          </Avatar>
          <Waveform isActive={isAgentSpeaking} />
          <Badge variant="secondary" className="text-xs">
            {route.toUpperCase()}
          </Badge>
          <Maximize2 className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Expanded panel view
  return (
    <div className="fixed right-4 bottom-4 top-4 z-50 w-96 bg-card border border-border rounded-lg shadow-2xl flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              VA
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm">VERDICT AI Mediator</span>
            <span className="text-xs text-muted-foreground">
              {modelPurpose.replace('_', ' ')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(false)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Step Indicator */}
      {route === 'pi' && stepId && (
        <div className="border-b border-border px-4 py-2 bg-muted/50">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Step
            </Badge>
            <span className="text-xs font-medium">
              {piStepLabels[stepId] || stepId}
            </span>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="border-b border-border px-4 py-2 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <Waveform isActive={isAgentSpeaking} />
          <span className="text-xs text-muted-foreground">
            {isAgentSpeaking ? 'Agent speaking...' : 'Ready'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isMuted ? "destructive" : "ghost"}
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onClose}
          >
            End
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="transcript" className="h-full flex flex-col">
          <TabsList className="w-full rounded-none border-b border-border bg-transparent justify-start px-4">
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="transcript" className="flex-1 m-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {transcript.map((msg, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-primary">
                        {msg.speaker}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {msg.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{msg.text}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="notes" className="flex-1 m-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {notes.map((note, i) => (
                  <div
                    key={i}
                    className="p-3 bg-muted/50 rounded-md text-sm border border-border"
                  >
                    {note}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="actions" className="flex-1 m-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Generate Settlement Bracket
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Request Risk Analysis
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Export Session Summary
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
