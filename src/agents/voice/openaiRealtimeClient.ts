import { supabase } from "@/integrations/supabase/client";

export interface CallConfig {
  systemPrompt?: string;
  tools?: any[];
  voice?: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse';
  temperature?: number;
}

export interface RealtimeEvents {
  onPartial?: (text: string) => void;
  onFinal?: (text: string) => void;
  onToolCall?: (toolName: string, args: any) => Promise<any>;
}

class OpenAIRealtimeClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioRecorder: MediaRecorder | null = null;
  private events: RealtimeEvents = {};
  private isRealtimeAvailable: boolean = false;
  private callConfig: CallConfig = {};
  private conversationId: string | null = null;
  
  // Fallback components
  private speechSynthesis: SpeechSynthesis | null = null;
  private speechRecognition: any = null;

  constructor() {
    this.checkRealtimeAvailability();
  }

  private async checkRealtimeAvailability() {
    // Check if OpenAI Realtime API credentials are configured
    const realtimeUrl = import.meta.env.VITE_OPENAI_REALTIME_URL;
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    this.isRealtimeAvailable = !!(realtimeUrl && apiKey);
    console.log('Realtime availability:', this.isRealtimeAvailable);
  }

  async start(config: CallConfig, events: RealtimeEvents) {
    this.callConfig = config;
    this.events = events;

    if (this.isRealtimeAvailable) {
      await this.startRealtimeSession();
    } else {
      await this.startFallbackSession();
    }
  }

  private async startRealtimeSession() {
    try {
      console.log('Starting OpenAI Realtime session...');
      
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Connect to OpenAI Realtime API via WebSocket
      const realtimeUrl = import.meta.env.VITE_OPENAI_REALTIME_URL || 
        'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

      this.ws = new WebSocket(realtimeUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'realtime=v1'
        }
      } as any);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.setupRealtimeSession();
      };

      this.ws.onmessage = (event) => {
        this.handleRealtimeMessage(JSON.parse(event.data));
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
      };

      // Set up audio streaming
      this.setupAudioStreaming();

    } catch (error) {
      console.error('Failed to start Realtime session:', error);
      // Fallback to alternative method
      await this.startFallbackSession();
    }
  }

  private setupRealtimeSession() {
    if (!this.ws) return;

    const sessionConfig = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: this.callConfig.systemPrompt || 'You are a helpful AI assistant.',
        voice: this.callConfig.voice || 'alloy',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 1000
        },
        tools: this.callConfig.tools || [],
        tool_choice: 'auto',
        temperature: this.callConfig.temperature || 0.8,
        max_response_output_tokens: 'inf'
      }
    };

    console.log('Sending session config:', sessionConfig);
    this.ws.send(JSON.stringify(sessionConfig));
  }

  private setupAudioStreaming() {
    if (!this.mediaStream || !this.ws) return;

    this.audioContext = new AudioContext({ sampleRate: 24000 });
    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    const processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const audioData = this.encodeAudioForAPI(inputData);

      this.ws.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: audioData
      }));
    };

    source.connect(processor);
    processor.connect(this.audioContext.destination);
  }

  private encodeAudioForAPI(float32Array: Float32Array): string {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  }

  private handleRealtimeMessage(message: any) {
    console.log('Realtime message:', message.type);

    switch (message.type) {
      case 'session.created':
        console.log('Session created');
        break;

      case 'response.audio_transcript.delta':
        if (this.events.onPartial && message.delta) {
          this.events.onPartial(message.delta);
        }
        break;

      case 'response.audio_transcript.done':
        if (this.events.onFinal && message.transcript) {
          this.events.onFinal(message.transcript);
        }
        break;

      case 'response.function_call_arguments.done':
        this.handleToolCall(message);
        break;

      case 'error':
        console.error('Realtime API error:', message.error);
        break;
    }
  }

  private async handleToolCall(message: any) {
    if (!this.events.onToolCall) return;

    try {
      const args = JSON.parse(message.arguments);
      const toolName = message.name || 'unknown';
      
      console.log('Tool call:', toolName, args);
      const result = await this.events.onToolCall(toolName, args);

      // Send tool response back
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: message.call_id,
            output: JSON.stringify(result)
          }
        }));
      }
    } catch (error) {
      console.error('Tool call error:', error);
    }
  }

  private async startFallbackSession() {
    console.log('Starting fallback session (Web Speech API + Whisper)');

    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.continuous = true;
      this.speechRecognition.interimResults = true;
      this.speechRecognition.lang = 'en-US';

      this.speechRecognition.onresult = async (event: any) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript;

        if (event.results[last].isFinal) {
          if (this.events.onFinal) {
            this.events.onFinal(transcript);
          }
          // Process with chat API
          await this.processFallbackChat(transcript);
        } else if (this.events.onPartial) {
          this.events.onPartial(transcript);
        }
      };

      this.speechRecognition.start();
      console.log('Speech recognition started');
    } else {
      console.warn('Speech Recognition API not available');
      // Fall back to manual recording + Whisper
      await this.startManualRecording();
    }

    // Initialize speech synthesis for responses
    this.speechSynthesis = window.speechSynthesis;
  }

  private async startManualRecording() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioRecorder = new MediaRecorder(this.mediaStream);

      const audioChunks: Blob[] = [];

      this.audioRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      this.audioRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          const { data, error } = await supabase.functions.invoke('transcribe', {
            body: { audio: base64Audio }
          });

          if (error) {
            console.error('Transcription error:', error);
            return;
          }

          if (data?.text && this.events.onFinal) {
            this.events.onFinal(data.text);
            await this.processFallbackChat(data.text);
          }
        };

        reader.readAsDataURL(audioBlob);
        audioChunks.length = 0;
      };

      this.audioRecorder.start();
      console.log('Manual recording started');
    } catch (error) {
      console.error('Failed to start manual recording:', error);
    }
  }

  private async processFallbackChat(userMessage: string) {
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: userMessage,
          systemPrompt: this.callConfig.systemPrompt,
          tools: this.callConfig.tools,
          temperature: this.callConfig.temperature
        }
      });

      if (error) {
        console.error('Chat error:', error);
        return;
      }

      if (data?.response) {
        // Speak the response using Web Speech API
        if (this.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(data.response);
          utterance.voice = this.speechSynthesis.getVoices().find(v => v.name.includes('Google')) || null;
          this.speechSynthesis.speak(utterance);
        }
      }

      // Handle tool calls from chat response
      if (data?.toolCalls) {
        for (const toolCall of data.toolCalls) {
          if (this.events.onToolCall) {
            await this.events.onToolCall(toolCall.name, toolCall.arguments);
          }
        }
      }
    } catch (error) {
      console.error('Fallback chat error:', error);
    }
  }

  sendUserUtterance(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text }]
        }
      }));
      
      this.ws.send(JSON.stringify({ type: 'response.create' }));
    } else {
      // Fallback: process as text chat
      this.processFallbackChat(text);
    }
  }

  stop() {
    console.log('Stopping voice client...');

    // Clean up WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Clean up audio
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioRecorder && this.audioRecorder.state !== 'inactive') {
      this.audioRecorder.stop();
      this.audioRecorder = null;
    }

    // Clean up speech recognition
    if (this.speechRecognition) {
      this.speechRecognition.stop();
      this.speechRecognition = null;
    }

    // Cancel any ongoing speech
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }

    this.conversationId = null;
    console.log('Voice client stopped');
  }
}

export const createRealtimeClient = () => new OpenAIRealtimeClient();
