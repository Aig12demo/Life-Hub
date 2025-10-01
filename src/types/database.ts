export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string | null;
          age: number | null;
          gender: string | null;
          height: number | null;
          height_unit: string | null;
          weight: number | null;
          weight_unit: string | null;
          bio: string | null;
          avatar_url: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname?: string | null;
          age?: number | null;
          gender?: string | null;
          height?: number | null;
          height_unit?: string | null;
          weight?: number | null;
          weight_unit?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string | null;
          age?: number | null;
          gender?: string | null;
          height?: number | null;
          height_unit?: string | null;
          weight?: number | null;
          weight_unit?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          last_message_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          created_at?: string;
          last_message_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
          last_message_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant';
          content: string;
          is_voice: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: 'user' | 'assistant';
          content: string;
          is_voice?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          is_voice?: boolean;
          created_at?: string;
        };
      };
    };
  };
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update'];

export type Message = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type MessageUpdate = Database['public']['Tables']['messages']['Update'];

// Extended types for UI
export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface ConversationSummary extends Conversation {
  message_count: number;
  last_message_content?: string;
}

// Profile form data type
export interface ProfileFormData {
  nickname: string;
  age: number | null;
  gender: string;
  height: number | null;
  height_unit: string;
  weight: number | null;
  weight_unit: string;
  bio: string;
}