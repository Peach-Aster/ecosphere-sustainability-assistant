import { SupabaseClient } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export const getChatHistory = async (
  supabase: SupabaseClient,
  limit: number = 50
): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

export const addChatMessage = async (
  supabase: SupabaseClient,
  role: 'user' | 'assistant',
  content: string
): Promise<ChatMessage> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      role,
      content,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data!;
};

export const clearChatHistory = async (
  supabase: SupabaseClient
) => {
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) throw error;
};
