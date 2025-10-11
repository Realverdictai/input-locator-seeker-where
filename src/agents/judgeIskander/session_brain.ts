/**
 * Judge Iskander Session Brain
 * 
 * Orchestrates voice-based PI mediation sessions by:
 * - Managing current PI step context
 * - Generating targeted questions
 * - Handling tool calls (query_cases, ingest_docs, summarize_doc, update_field)
 * - Streaming conversation to UI
 */

import { PI_SYSTEM_PROMPT } from "@/mediator/pi_brain";
import { 
  getCurrentPiStepId, 
  getContextForStep, 
  applyAgentAction,
  type PiStepId 
} from "@/mediator/pi_step_adapters";
import { getQuestionsForStep, getFlattenedQuestions } from "@/mediator/pi_question_plans";
import { 
  allAgentTools, 
  executeAgentTool,
  validateToolArgs 
} from "@/agents/tools";
import { createRealtimeClient, type RealtimeEvents } from "@/agents/voice/openaiRealtimeClient";
import { dbg, dbe } from "@/debug/mediatorDebugStore";

interface SessionConfig {
  stepHint?: PiStepId;
  echoMode?: boolean;
  onPartial?: (text: string, speaker: 'user' | 'assistant') => void;
  onFinal?: (text: string, speaker: 'user' | 'assistant') => void;
  onToolCall?: (toolName: string, args: any, result: any) => void;
  onStepChange?: (oldStep: PiStepId, newStep: PiStepId) => void;
  onError?: (error: Error) => void;
}

interface SessionState {
  sessionId: string;
  currentStep: PiStepId;
  transcript: Array<{ speaker: 'user' | 'assistant'; text: string; timestamp: Date }>;
  toolCalls: Array<{ tool: string; args: any; result: any; timestamp: Date }>;
  isActive: boolean;
}

/**
 * Judge Iskander Session Brain
 * Manages the entire voice-based mediation session
 */
export class JudgeIskanderSessionBrain {
  private state: SessionState;
  private config: SessionConfig;
  private voiceClient: any; // OpenAI Realtime client or fallback
  private currentPartialText: string = '';

  constructor(config: SessionConfig = {}) {
    this.config = config;
    
    const currentStep = config.stepHint || getCurrentPiStepId();
    
    this.state = {
      sessionId: this.generateSessionId(),
      currentStep,
      transcript: [],
      toolCalls: [],
      isActive: false
    };

    console.log('[Judge Iskander] Session initialized:', this.state.sessionId, 'Step:', currentStep);
  }

  /**
   * Start the PI mediation session
   */
  async start(): Promise<void> {
    if (this.state.isActive) {
      console.warn('[Judge Iskander] Session already active');
      return;
    }

    try {
      console.log('[Judge Iskander] Starting session...');
      
      // Get current step context
      const context = getContextForStep(this.state.currentStep);
      const questionPlans = getQuestionsForStep(this.state.currentStep, context);
      const questions = getFlattenedQuestions(questionPlans);

      dbg('session', 'start', { 
        step: this.state.currentStep, 
        unknowns: context.unknowns?.length || 0 
      });

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(
        this.state.currentStep,
        context,
        questions
      );

      console.log('[Judge Iskander] System prompt built, starting voice client...');

      // Initialize voice client
      this.voiceClient = createRealtimeClient();

      // Set up event handlers
      const events: RealtimeEvents = {
        onPartial: (text) => this.handlePartialTranscript(text, 'assistant'),
        onFinal: (text) => this.handleFinalTranscript(text, 'assistant'),
        onToolCall: async (toolName, args) => this.handleToolCall(toolName, args)
      };

      // Log tool registration
      dbg('session', 'tools_registered', ['query_cases', 'ingest_docs', 'summarize_doc', 'update_field']);

      // Start voice session
      await this.voiceClient.start(
        {
          systemPrompt,
          tools: allAgentTools,
          voice: 'onyx', // Deep, authoritative male voice
          temperature: 0.8,
          echoMode: this.config.echoMode || false
        },
        events
      );

      this.state.isActive = true;
      console.log('[Judge Iskander] Session started successfully');

      // Send initial greeting
      this.sendInitialGreeting();

    } catch (error) {
      console.error('[Judge Iskander] Failed to start session:', error);
      dbe('session', 'error', error instanceof Error ? error.message : String(error));
      if (this.config.onError) {
        this.config.onError(error as Error);
      }
      throw error;
    }
  }

  /**
   * Stop the session
   */
  stop(): void {
    if (!this.state.isActive) {
      console.warn('[Judge Iskander] Session not active');
      return;
    }

    console.log('[Judge Iskander] Stopping session...');
    
    if (this.voiceClient) {
      this.voiceClient.stop();
    }

    this.state.isActive = false;
    console.log('[Judge Iskander] Session stopped');
  }

  /**
   * Send a user utterance (text input when voice not available)
   */
  sendUserMessage(text: string): void {
    if (!this.state.isActive) {
      console.warn('[Judge Iskander] Session not active');
      return;
    }

    console.log('[Judge Iskander] User message:', text);
    dbg('session', 'user_utterance', { text });
    this.handleFinalTranscript(text, 'user');
    
    if (this.voiceClient) {
      this.voiceClient.sendUserUtterance(text);
    }
  }

  /**
   * Build the complete system prompt for Judge Iskander
   */
  private buildSystemPrompt(
    step: PiStepId,
    context: any,
    questions: string[]
  ): string {
    const stepNames: Record<PiStepId, string> = {
      'upload_intake': 'Upload & Intake',
      'issues_coverage': 'Issues & Coverage',
      'liability_causation': 'Liability & Causation',
      'damages_treatment': 'Damages & Treatment',
      'strategy': 'Settlement Strategy',
      'proposal_brackets': 'Proposal & Brackets'
    };

    const judgeIskanderPrompt = `

# Judge Iskander - Virtual Mediator Persona

You are **Judge Iskander**, a neutral, experienced virtual mediator specializing in Personal Injury cases. You are calm, professional, thorough, and focused on guiding parties toward fair resolution.

## Current Session Context

**Step**: ${stepNames[step]}
**Known Facts**: ${Object.keys(context.facts).length} items recorded
**Missing Information**: ${context.unknowns.length} critical fields

## Your Objectives

1. **Gather Missing Information**: Ask up to 3 targeted questions from the list below. Be conversational, not robotic.
2. **Update Records**: When the user provides information, immediately use the \`update_field\` tool to record it.
3. **Process Documents**: When the user mentions uploading a document:
   - Call \`ingest_docs\` to register it
   - Then call \`summarize_doc\` to extract key information
   - Cite specific findings from the summary in your response
4. **Guide Progress**: When the user indicates they're ready to move forward, use \`advance_step\` action.
5. **Query Comparables**: Use \`query_cases\` when the user asks about similar cases or you need to provide valuation context.

## Priority Questions for This Step

${questions.slice(0, 6).map((q, i) => `${i + 1}. ${q}`).join('\n')}

## Missing Fields

${context.unknowns.length > 0 ? context.unknowns.map(u => `- ${u}`).join('\n') : 'All critical fields captured for this step.'}

## Communication Style

- **Conversational**: Speak naturally, as if in a real mediation room
- **Empathetic**: Acknowledge the difficulty of these situations
- **Concise**: Ask 1-2 questions at a time, don't overwhelm
- **Professional**: Maintain neutrality and objectivity
- **Actionable**: Always be working toward next steps

## Tool Usage Guidelines

- **update_field**: Use immediately when user provides a fact (e.g., "The policy limits are 100/300" → update_field(path: "policyLimits", value: 100000))
- **ingest_docs**: Call when user says "I uploaded..." or "Here's the report..."
- **summarize_doc**: Always follow ingest_docs with this to understand contents
- **query_cases**: Use when user asks "What are similar cases worth?" or for valuation guidance
- **Never guess**: If uncertain, ask for clarification rather than assuming

## Example Interactions

**User**: "The plaintiff is John Smith, the accident was on March 15th."
**You**: "Thank you. I've recorded John Smith as the plaintiff and March 15th as the date of loss. What type of accident occurred?"
*[Call update_field twice]*

**User**: "I just uploaded the police report."
**You**: "Got it, let me review that report."
*[Call ingest_docs, then summarize_doc]*
**You**: "I've reviewed the police report. It shows the defendant was cited for following too closely. The report indicates rear-end collision at Main St intersection. Does this align with your understanding?"

**User**: "What are cases like this typically worth?"
**You**: "Let me search for comparable cases."
*[Call query_cases]*
**You**: "Based on similar cases in this venue with comparable injuries, settlements typically range from $75,000 to $150,000. Would you like me to explain the factors driving this range?"

## Remember

You are guiding a legal professional through case evaluation. They trust your process. Be helpful, thorough, and neutral.
`;

    return PI_SYSTEM_PROMPT + judgeIskanderPrompt;
  }

  /**
   * Send initial greeting based on current step
   */
  private sendInitialGreeting(): void {
    const greetings: Record<PiStepId, string> = {
      'upload_intake': "Hello, I'm Judge Iskander. Let's start by gathering the basic information about this case. What can you tell me about the plaintiff and the incident?",
      'issues_coverage': "Now let's discuss the insurance coverage and policy limits. What do you know about the defendant's coverage?",
      'liability_causation': "Let's evaluate liability. In your view, what percentage of fault does the defendant bear?",
      'damages_treatment': "Let's review the injuries and treatment. What are the primary injuries sustained by the plaintiff?",
      'strategy': "Now let's discuss settlement strategy. What is the plaintiff's current demand, and where is the defense positioned?",
      'proposal_brackets': "We're ready to discuss settlement proposals. Based on everything we've covered, what settlement range seems realistic to you?"
    };

    const greeting = greetings[this.state.currentStep];
    this.handleFinalTranscript(greeting, 'assistant');
  }

  /**
   * Handle partial transcript (streaming)
   */
  private handlePartialTranscript(text: string, speaker: 'user' | 'assistant'): void {
    this.currentPartialText = text;
    dbg('session', 'partial', { speaker, chunk: text.substring(0, 50) });
    
    if (this.config.onPartial) {
      this.config.onPartial(text, speaker);
    }
  }

  /**
   * Handle final transcript (complete utterance)
   */
  private handleFinalTranscript(text: string, speaker: 'user' | 'assistant'): void {
    console.log(`[Judge Iskander] ${speaker}:`, text.substring(0, 100));
    dbg('session', 'final', { speaker, msg: text });

    const entry = {
      speaker,
      text,
      timestamp: new Date()
    };

    this.state.transcript.push(entry);
    this.currentPartialText = '';

    if (this.config.onFinal) {
      this.config.onFinal(text, speaker);
    }
  }

  /**
   * Handle tool calls from the agent
   */
  private async handleToolCall(toolName: string, args: any): Promise<any> {
    console.log('[Judge Iskander] Tool call:', toolName, args);

    try {
      // Validate tool arguments
      const validation = validateToolArgs(toolName, args);
      if (!validation.valid) {
        console.error('[Judge Iskander] Invalid tool args:', validation.error);
        return {
          ok: false,
          error: validation.error
        };
      }

      // Handle advance_step specially (not a server tool)
      if (toolName === 'advance_step') {
        return this.handleAdvanceStep();
      }

      // Execute the tool
      const result = await executeAgentTool(toolName, args);

      // Record the tool call
      this.state.toolCalls.push({
        tool: toolName,
        args,
        result,
        timestamp: new Date()
      });

      // Notify callback
      if (this.config.onToolCall) {
        this.config.onToolCall(toolName, args, result);
      }

      console.log('[Judge Iskander] Tool result:', result.ok ? 'success' : 'failed');
      return result;

    } catch (error) {
      console.error('[Judge Iskander] Tool execution error:', error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Tool execution failed'
      };
    }
  }

  /**
   * Handle advancing to next step
   */
  private handleAdvanceStep(): any {
    const oldStep = this.state.currentStep;
    
    const result = applyAgentAction({ type: 'advance_step' });
    
    if (result.ok) {
      const newStep = getCurrentPiStepId();
      this.state.currentStep = newStep;
      
      console.log('[Judge Iskander] Advanced step:', oldStep, '→', newStep);
      
      if (this.config.onStepChange) {
        this.config.onStepChange(oldStep, newStep);
      }

      // Update system prompt for new step
      this.updateSystemPromptForStep(newStep);
    }

    return result;
  }

  /**
   * Update system prompt when step changes
   */
  private updateSystemPromptForStep(step: PiStepId): void {
    console.log('[Judge Iskander] Updating system prompt for step:', step);
    
    const context = getContextForStep(step);
    const questionPlans = getQuestionsForStep(step, context);
    const questions = getFlattenedQuestions(questionPlans);

    const newSystemPrompt = this.buildSystemPrompt(step, context, questions);

    // Note: Realtime API doesn't support updating system prompt mid-session
    // This would require restarting the session or using a different approach
    // For now, we log it and continue with the original prompt
    console.log('[Judge Iskander] Note: System prompt update logged, but Realtime API session continues with original prompt');
  }

  /**
   * Get current session state
   */
  getState(): SessionState {
    return { ...this.state };
  }

  /**
   * Get transcript
   */
  getTranscript(): Array<{ speaker: 'user' | 'assistant'; text: string; timestamp: Date }> {
    return [...this.state.transcript];
  }

  /**
   * Get tool call history
   */
  getToolCalls(): Array<{ tool: string; args: any; result: any; timestamp: Date }> {
    return [...this.state.toolCalls];
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `pi-session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Start a new PI mediation session with Judge Iskander
 */
export async function startPiSession(config: SessionConfig = {}): Promise<JudgeIskanderSessionBrain> {
  console.log('[Judge Iskander] Creating new session...');
  
  const brain = new JudgeIskanderSessionBrain(config);
  await brain.start();
  
  return brain;
}

/**
 * Create a session brain without starting it
 */
export function createPiSessionBrain(config: SessionConfig = {}): JudgeIskanderSessionBrain {
  return new JudgeIskanderSessionBrain(config);
}
