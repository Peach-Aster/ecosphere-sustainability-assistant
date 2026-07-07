import { SupabaseClient } from '@supabase/supabase-js';

export interface Product {
  id: string;
  name: string;
  category: string;
  sustainability_score: number;
  carbon_footprint: number;
  eco_certifications: string[];
  alternatives: Array<{
    name: string;
    score: number;
    savings: string;
  }>;
  description: string;
  created_at: string;
}

export const searchProducts = async (
  supabase: SupabaseClient,
  query: string
): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('sustainability_score', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data || [];
};

export const getProductsByCategory = async (
  supabase: SupabaseClient,
  category: string
): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .order('sustainability_score', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getAllProducts = async (
  supabase: SupabaseClient
): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sustainability_score', { ascending: false });

  if (error) throw error;
  return data || [];
};
