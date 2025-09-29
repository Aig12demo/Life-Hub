/*
# VoiceFlow Assistant™ - Voice Command Processing

1. New Edge Function
   - `process-voice-command` function for handling voice interactions
   - Integrates with OpenAI GPT-4 for intelligent responses
   - Processes user voice commands and generates contextual replies

2. Security
   - Uses OPENAI_API_KEY from Supabase environment variables
   - CORS headers for secure frontend communication
   - Comprehensive error handling and validation

3. Features
   - Context-aware responses for personal assistant tasks
   - Support for schedule, tasks, reminders, and general queries
   - Maintains conversation context and personality
*/

import { corsHeaders } from '../_shared/cors.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

interface VoiceCommandRequest {
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Validate API key
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Parse request body
    const { message, conversationHistory = [] }: VoiceCommandRequest = await req.json();

    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message provided');
    }

    // System prompt for VoiceFlow Assistant™
    const systemPrompt: OpenAIMessage = {
      role: 'system',
      content: `You are VoiceFlow Assistant™, an intelligent personal assistant integrated into the Unified Life Hub™ app. You help users manage their daily life with a warm, professional, and proactive approach.

Key capabilities:
- Schedule and calendar management
- Task prioritization and organization
- Proactive suggestions and reminders
- Quick note-taking and retrieval
- Productivity insights and coaching

Personality:
- Warm, encouraging, and supportive
- Concise but thorough responses
- Proactive in offering helpful suggestions
- Professional yet approachable tone

Keep responses conversational and under 100 words unless detailed information is specifically requested. Always aim to be helpful and actionable.`
    };

    // Build conversation messages
    const messages: OpenAIMessage[] = [
      systemPrompt,
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: messages,
        max_tokens: 150,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const openaiData = await openaiResponse.json();
    const assistantResponse = openaiData.choices?.[0]?.message?.content;

    if (!assistantResponse) {
      throw new Error('No response generated from OpenAI');
    }

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        response: assistantResponse.trim(),
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('VoiceFlow Assistant error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});