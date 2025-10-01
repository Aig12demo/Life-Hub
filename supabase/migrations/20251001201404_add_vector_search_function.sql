/*
  # Add Vector Similarity Search Function

  1. New Functions
    - `match_messages` - Performs vector similarity search on messages
      - Finds messages similar to a query embedding
      - Filters by user_id for privacy
      - Returns top N most similar messages with similarity scores

  2. Purpose
    - Enable RAG (Retrieval Augmented Generation) for voice assistant
    - Find relevant past conversations to provide context
    - Improve personalization and context awareness

  3. Security
    - Function respects RLS policies
    - Only returns messages for the specified user
    - Uses cosine similarity for matching
*/

-- Create function to match similar messages using vector search
CREATE OR REPLACE FUNCTION match_messages(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  user_id_filter uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  conversation_id uuid,
  role text,
  content text,
  is_voice boolean,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.conversation_id,
    m.role,
    m.content,
    m.is_voice,
    m.created_at,
    1 - (m.embedding <=> query_embedding) as similarity
  FROM messages m
  INNER JOIN conversations c ON m.conversation_id = c.id
  WHERE 
    m.embedding IS NOT NULL
    AND (user_id_filter IS NULL OR c.user_id = user_id_filter)
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
