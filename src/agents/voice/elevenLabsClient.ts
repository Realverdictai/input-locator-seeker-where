/**
 * ElevenLabs Conversational AI Client
 * 
 * Manages voice conversation using ElevenLabs Conversational AI
 */

import { supabase } from '@/integrations/supabase/client';

export interface ElevenLabsConfig {
  agentId: string;
  onMessage?: (text: string, role: 'user' | 'assistant') => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export class ElevenLabsConversationalClient {
  private conversationId: string | null = null;
  private config: ElevenLabsConfig;

  constructor(config: ElevenLabsConfig) {
    this.config = config;
  }

  async start(): Promise<string> {
    try {
      console.log('[ElevenLabs] Starting conversation...');

      // Get signed URL from edge function
      const { data, error } = await supabase.functions.invoke('eleven-labs-session', {
        body: { agentId: this.config.agentId }
      });

      if (error) throw error;
      if (!data?.signedUrl) throw new Error('No signed URL returned');

      this.conversationId = data.conversationId;
      
      this.config.onConnect?.();
      
      return this.conversationId;
    } catch (error) {
      console.error('[ElevenLabs] Failed to start:', error);
      this.config.onError?.(error instanceof Error ? error : new Error('Failed to start'));
      throw error;
    }
  }

  async stop(): Promise<void> {
    console.log('[ElevenLabs] Stopping conversation...');
    this.conversationId = null;
    this.config.onDisconnect?.();
  }

  getConversationId(): string | null {
    return this.conversationId;
  }
}

export function createElevenLabsClient(config: ElevenLabsConfig): ElevenLabsConversationalClient {
  return new ElevenLabsConversationalClient(config);
}