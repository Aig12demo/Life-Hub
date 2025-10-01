import { supabase } from './supabase';
import { 
  Conversation, 
  ConversationInsert, 
  ConversationUpdate,
  Message, 
  MessageInsert,
  ConversationWithMessages,
  ConversationSummary 
} from '../types/database';

export class ConversationService {
  /**
   * Create a new conversation
   */
  static async createConversation(
    userId: string, 
    title: string = 'New Conversation'
  ): Promise<{ data: Conversation | null; error: any }> {
    const conversationData: ConversationInsert = {
      user_id: userId,
      title,
    };

    const { data, error } = await supabase
      .from('conversations')
      .insert(conversationData)
      .select()
      .single();

    return { data, error };
  }

  /**
   * Add a message to a conversation
   */
  static async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    isVoice: boolean = false,
    embedding?: number[]
  ): Promise<{ data: Message | null; error: any }> {
    const messageData: MessageInsert = {
      conversation_id: conversationId,
      role,
      content,
      is_voice: isVoice,
      ...(embedding && { embedding: `[${embedding.join(',')}]` }),
    };

    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    return { data, error };
  }

  /**
   * Get conversation history with messages
   */
  static async getConversationHistory(
    conversationId: string
  ): Promise<{ data: ConversationWithMessages | null; error: any }> {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages (
          id,
          role,
          content,
          is_voice,
          created_at
        )
      `)
      .eq('id', conversationId)
      .single();

    if (error) {
      return { data: null, error };
    }

    // Sort messages by created_at
    if (data?.messages) {
      data.messages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }

    return { data: data as ConversationWithMessages, error: null };
  }

  /**
   * Get all conversations for a user (summary view)
   */
  static async getUserConversations(
    userId: string,
    limit: number = 50
  ): Promise<{ data: ConversationSummary[] | null; error: any }> {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages (
          content,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error };
    }

    // Transform data to include message count and last message content
    const conversationSummaries: ConversationSummary[] = data.map(conv => ({
      id: conv.id,
      user_id: conv.user_id,
      title: conv.title,
      created_at: conv.created_at,
      last_message_at: conv.last_message_at,
      message_count: conv.messages?.length || 0,
      last_message_content: conv.messages?.[0]?.content || undefined,
    }));

    return { data: conversationSummaries, error: null };
  }

  /**
   * Update conversation title
   */
  static async updateConversationTitle(
    conversationId: string,
    title: string
  ): Promise<{ data: Conversation | null; error: any }> {
    const updateData: ConversationUpdate = {
      title,
    };

    const { data, error } = await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', conversationId)
      .select()
      .single();

    return { data, error };
  }

  /**
   * Delete a conversation (messages will be cascade deleted)
   */
  static async deleteConversation(
    conversationId: string
  ): Promise<{ error: any }> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    return { error };
  }

  /**
   * Get messages for a conversation with pagination
   */
  static async getMessages(
    conversationId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ data: Message[] | null; error: any }> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    return { data, error };
  }

  /**
   * Generate a smart title for a conversation based on first few messages
   */
  static async generateConversationTitle(
    conversationId: string
  ): Promise<string> {
    const { data, error } = await supabase
      .from('messages')
      .select('content, role')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(3);

    if (error || !data || data.length === 0) {
      return 'New Conversation';
    }

    // Find the first user message
    const firstUserMessage = data.find(msg => msg.role === 'user');
    if (!firstUserMessage) {
      return 'New Conversation';
    }

    // Create a title from the first user message (max 50 chars)
    const title = firstUserMessage.content
      .trim()
      .substring(0, 50)
      .replace(/\s+/g, ' ');

    return title.length < firstUserMessage.content.length 
      ? `${title}...` 
      : title;
  }

  /**
   * Search conversations by content
   */
  static async searchConversations(
    userId: string,
    query: string,
    limit: number = 20
  ): Promise<{ data: ConversationSummary[] | null; error: any }> {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages!inner (
          content
        )
      `)
      .eq('user_id', userId)
      .or(`title.ilike.%${query}%,messages.content.ilike.%${query}%`)
      .order('last_message_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error };
    }

    const conversationSummaries: ConversationSummary[] = data.map(conv => ({
      id: conv.id,
      user_id: conv.user_id,
      title: conv.title,
      created_at: conv.created_at,
      last_message_at: conv.last_message_at,
      message_count: conv.messages?.length || 0,
      last_message_content: conv.messages?.[0]?.content || undefined,
    }));

    return { data: conversationSummaries, error: null };
  }
}