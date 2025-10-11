import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getFeatureFlags } from "@/lib/featureFlags";
import { resolveModel, type ModelChoice } from "@/lib/modelRouter";
import { queryCasesToolSchema } from "../../supabase/functions/tools/db_read/schema";

const DEFAULT_SYSTEM_PROMPT = `You are Verdict AI, a neutral virtual mediator. You clarify facts, identify disputes, summarize competing narratives, assess risk, and generate bracketed settlement strategies. You do not give legal advice; you facilitate resolution. Always (1) ask for missing facts, (2) cite evidence sources when possible, (3) surface uncertainty, (4) explain tradeoffs, (5) keep tone calm, fair, and reality-testing.`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MediatorOverlayProps {
  systemPrompt?: string;
  tools?: any[];
  model?: string;
  purpose?: ModelChoice['purpose'];
  route?: 'pi' | 'wc' | 'divorce';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialMessage?: string;
  hideTrigger?: boolean;
}

const MediatorOverlay = ({ 
  systemPrompt = DEFAULT_SYSTEM_PROMPT, 
  tools,
  model: modelProp,
  purpose = 'pi_reasoning',
  route,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  initialMessage,
  hideTrigger = false
}: MediatorOverlayProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasAutoSent, setHasAutoSent] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Use external control if provided, otherwise internal state
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = externalOnOpenChange || setInternalOpen;

  // Resolve model based on feature flags and router
  const flags = getFeatureFlags();
  const resolvedModel = resolveModel(purpose, flags, route);
  const { provider, model } = modelProp 
    ? { provider: 'lovable' as const, model: modelProp }
    : resolvedModel;

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  // Auto-send initial message when opened
  useEffect(() => {
    if (isOpen && initialMessage && !hasAutoSent && messages.length === 0 && !isLoading) {
      setHasAutoSent(true);
      const userMessage: Message = { role: "user", content: initialMessage };
      setMessages([userMessage]);
      setIsLoading(true);
      streamChat([userMessage])
        .catch((error) => {
          console.error("Auto-send error:", error);
          toast({
            title: "Error",
            description: "Failed to send initial message. Please try again.",
            variant: "destructive",
          });
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, initialMessage, hasAutoSent, messages.length, isLoading]);

  // Reset auto-send flag when overlay closes
  useEffect(() => {
    if (!isOpen) {
      setHasAutoSent(false);
      setMessages([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const streamChat = async (userMessages: Message[], toolResults?: any[]) => {
    // Route to appropriate edge function based on provider
    let chatUrl: string;
    let requestBody: any;

    if (provider === 'lovable') {
      chatUrl = `${SUPABASE_URL}/functions/v1/mediator-chat`;
      requestBody = {
        messages: userMessages,
        systemPrompt,
        model
      };
    } else if (provider === 'openai-direct') {
      chatUrl = `${SUPABASE_URL}/functions/v1/mediator-openai-direct`;
      requestBody = {
        messages: userMessages,
        systemPrompt,
        model,
        tools: tools || undefined,
        toolResults: toolResults || undefined
      };
    } else if (provider === 'anthropic' || provider === 'replicate') {
      toast({
        title: "Provider Not Configured",
        description: `The ${provider} provider is not yet configured. Please use Lovable or OpenAI Direct.`,
        variant: "destructive",
      });
      throw new Error(`Provider ${provider} not configured`);
    } else {
      toast({
        title: "Unknown Provider",
        description: "The selected provider is not supported.",
        variant: "destructive",
      });
      throw new Error(`Unknown provider: ${provider}`);
    }

    const resp = await fetch(chatUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        toast({
          title: "Rate Limit Exceeded",
          description: "Please try again in a moment.",
          variant: "destructive",
        });
        throw new Error("Rate limit exceeded");
      }
      if (resp.status === 402) {
        toast({
          title: "Payment Required",
          description: "Please add credits to your Lovable AI workspace.",
          variant: "destructive",
        });
        throw new Error("Payment required");
      }
      throw new Error("Failed to start stream");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;
    let assistantContent = "";
    let toolCallsAccumulator: any = {};

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta;
          
          // Handle text content
          const content = delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => 
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantContent }];
            });
          }

          // Handle tool calls
          if (delta?.tool_calls) {
            for (const toolCallDelta of delta.tool_calls) {
              const index = toolCallDelta.index;
              if (!toolCallsAccumulator[index]) {
                toolCallsAccumulator[index] = {
                  id: toolCallDelta.id || "",
                  type: "function",
                  function: {
                    name: toolCallDelta.function?.name || "",
                    arguments: ""
                  }
                };
              }
              if (toolCallDelta.function?.arguments) {
                toolCallsAccumulator[index].function.arguments += toolCallDelta.function.arguments;
              }
            }
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => 
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantContent }];
            });
          }
        } catch { /* ignore */ }
      }
    }

    // Handle tool calls if any were accumulated
    const toolCalls = Object.values(toolCallsAccumulator);
    if (toolCalls.length > 0 && provider === 'openai-direct') {
      const toolResults = [];
      for (const toolCall of toolCalls as any[]) {
        if (toolCall.function.name === 'query_cases') {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            const toolResp = await fetch(`${SUPABASE_URL}/functions/v1/tools/db_read`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${PUBLISHABLE_KEY}`,
              },
              body: JSON.stringify(args),
            });
            const toolData = await toolResp.json();
            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "query_cases",
              content: JSON.stringify(toolData)
            });
          } catch (err) {
            console.error("Tool execution error:", err);
            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "query_cases",
              content: JSON.stringify({ ok: false, error: "Tool execution failed" })
            });
          }
        }
      }

      // Continue streaming with tool results
      if (toolResults.length > 0) {
        await streamChat(userMessages, toolResults);
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      await streamChat([...messages, userMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        {!hideTrigger && (
          <SheetTrigger asChild>
            <Button
              size="lg"
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 z-50"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </SheetTrigger>
        )}
        <SheetContent side="right" className="w-full sm:w-[500px] flex flex-col p-0">
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              Verdict AI Mediator
            </SheetTitle>
          </SheetHeader>

          <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="p-4 bg-blue-50 rounded-full">
                  <MessageCircle className="h-12 w-12 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Virtual Mediator</h3>
                  <p className="text-sm text-gray-600 max-w-sm">
                    I'm here to help clarify facts, assess risk, and explore settlement strategies.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-3 ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about the case, request risk analysis..."
                className="min-h-[80px] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-[80px] w-12 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MediatorOverlay;
