import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for echo mode query parameter
    const url = new URL(req.url);
    const mode = url.searchParams.get('mode');
    
    if (mode === 'echo') {
      console.log('Echo mode activated - returning canned response');
      return new Response(
        JSON.stringify({
          role: 'assistant',
          content: '[ECHO MODE] I received your message. Next, please provide policy limits and billed vs paid specials.',
          tool_calls: []
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Chat service not configured',
          message: 'OPENAI_API_KEY environment variable is not set'
        }),
        { 
          status: 501,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { message, systemPrompt, tools, temperature } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'No message provided' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Processing chat message...');

    const messages = [
      {
        role: 'system',
        content: systemPrompt || 'You are a helpful AI assistant.'
      },
      {
        role: 'user',
        content: message
      }
    ];

    const requestBody: any = {
      model: 'gpt-4o-mini',
      messages,
      temperature: temperature || 0.8,
      max_tokens: 1000
    };

    // Add tools if provided - tools are already in OpenAI format
    if (tools && tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = 'auto';
      console.log('Tools registered:', tools.length, 'tools');
    }

    console.log('Calling OpenAI Chat Completions API...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      // Try to parse error details
      try {
        const errorJson = JSON.parse(errorText);
        console.error('OpenAI error details:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        // Not JSON, log raw text
      }
      
      return new Response(
        JSON.stringify({ 
          error: `OpenAI API error: ${response.status}`,
          details: errorText.substring(0, 500) // First 500 chars for debugging
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const result = await response.json();
    const choice = result.choices[0];

    const responseData: any = {
      response: choice.message.content,
    };

    // Handle tool calls if present
    if (choice.message.tool_calls) {
      responseData.toolCalls = choice.message.tool_calls.map((tc: any) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments)
      }));
      console.log('Tool calls detected:', responseData.toolCalls.length);
    }

    console.log('Chat response generated successfully');

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate chat response'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
