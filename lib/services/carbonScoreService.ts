import { SupabaseClient } from '@supabase/supabase-js';
import { calculateDailyScore } from '../carbon/emissionFactors';

export interface CarbonScore {
  id: string;
  user_id: string;
  date: string;
  total_emissions: number;
  transport_emissions: number;
  energy_emissions: number;
  diet_emissions: number;
  score: number;
  created_at: string;
  updated_at: string;
}

export const updateCarbonScore = async (
  supabase: SupabaseClient,
  date: string
) => {
  const { data: activities, error: activitiesError } = await supabase
    .from('activities')
    .select('*')
    .eq('date', date);

  if (activitiesError) throw activitiesError;

  const emissions = {
    transport: 0,
    energy: 0,
    diet: 0,
  };

  activities?.forEach((activity) => {
    emissions[activity.activity_type as keyof typeof emissions] += activity.carbon_emissions;
  });

  const totalEmissions = emissions.transport + emissions.energy + emissions.diet;
  const score = calculateDailyScore(emissions);

  const { data, error } = await supabase
    .from('carbon_scores')
    .upsert({
      date,
      total_emissions: totalEmissions,
      transport_emissions: emissions.transport,
      energy_emissions: emissions.energy,
      diet_emissions: emissions.diet,
      score,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,date',
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getCarbonScoreByDate = async (
  supabase: SupabaseClient,
  date: string
): Promise<CarbonScore | null> => {
  const { data, error } = await supabase
    .from('carbon_scores')
    .select('*')
    .eq('date', date)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getCarbonScoresByDateRange = async (
  supabase: SupabaseClient,
  startDate: string,
  endDate: string
): Promise<CarbonScore[]> => {
  const { data, error } = await supabase
    .from('carbon_scores')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw error;
  return data || [];
};
