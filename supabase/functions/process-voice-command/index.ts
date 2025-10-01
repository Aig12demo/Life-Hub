/*
# VoiceFlow Assistant™ - Voice Command Processing with RAG

1. New Edge Function
   - `process-voice-command` function for handling voice interactions
   - Integrates with OpenAI GPT-4 for intelligent responses
   - Implements RAG (Retrieval Augmented Generation) with vector search
   - Fetches user profile for personalized responses

2. Security
   - Uses OPENAI_API_KEY from Supabase environment variables
   - CORS headers for secure frontend communication
   - Comprehensive error handling and validation

3. Features
   - Context-aware responses using user profile data
   - Vector similarity search for relevant past conversations
   - Automatic embedding generation and storage
   - Support for schedule, tasks, reminders, and general queries
   - Maintains conversation context and personality
*/

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface VoiceCommandRequest {
  message: string;
  userId: string;
  conversationId?: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface Profile {
  nickname?: string;
  age?: number;
  gender?: string;
  height?: number;
  height_unit?: string;
  weight?: number;
  weight_unit?: string;
  bio?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { message, userId, conversationId, conversationHistory = [] }: VoiceCommandRequest = await req.json();

    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message provided');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname, age, gender, height, height_unit, weight, weight_unit, bio')
      .eq('id', userId)
      .maybeSingle();

    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: message,
      }),
    });

    if (!embeddingResponse.ok) {
      console.error('Embedding generation failed:', await embeddingResponse.text());
      throw new Error('Failed to generate embedding');
    }

    const embeddingData = await embeddingResponse.json();
    const messageEmbedding = embeddingData.data[0].embedding;

    const { data: similarMessages } = await supabase.rpc('match_messages', {
      query_embedding: messageEmbedding,
      match_threshold: 0.7,
      match_count: 5,
      user_id_filter: userId
    });

    let relevantContext = '';
    if (similarMessages && similarMessages.length > 0) {
      relevantContext = '\n\nRelevant past context:\n' +
        similarMessages.map((msg: any) => `- ${msg.content}`).join('\n');
    }

    let profileContext = '';
    if (profile) {
      profileContext = '\n\nUser Profile:';
      if (profile.nickname) profileContext += `\n- Nickname: ${profile.nickname}`;
      if (profile.age) profileContext += `\n- Age: ${profile.age}`;
      if (profile.gender) profileContext += `\n- Gender: ${profile.gender}`;
      if (profile.height) profileContext += `\n- Height: ${profile.height} ${profile.height_unit || 'cm'}`;
      if (profile.weight) profileContext += `\n- Weight: ${profile.weight} ${profile.weight_unit || 'kg'}`;
      if (profile.bio) profileContext += `\n- Bio: ${profile.bio}`;
    }

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
- ALWAYS address the user by their nickname when available

IMPORTANT: You have access to the user's profile information and past conversation context. Use this information to provide personalized responses.${profileContext}${relevantContext}

Keep responses conversational and under 100 words unless detailed information is specifically requested. Always aim to be helpful and actionable.`
    };

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

    const responseEmbeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: assistantResponse,
      }),
    });

    let responseEmbedding = null;
    if (responseEmbeddingResponse.ok) {
      const responseEmbeddingData = await responseEmbeddingResponse.json();
      responseEmbedding = responseEmbeddingData.data[0].embedding;
    }

    return new Response(
      JSON.stringify({
        success: true,
        response: assistantResponse.trim(),
        timestamp: new Date().toISOString(),
        embeddings: {
          userMessage: messageEmbedding,
          assistantResponse: responseEmbedding
        }
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
