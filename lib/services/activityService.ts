import { SupabaseClient } from '@supabase/supabase-js';
import { calculateCarbonEmissions, Activity } from '../carbon/emissionFactors';

export interface ActivityRecord {
  id: string;
  user_id: string;
  activity_type: 'transport' | 'energy' | 'diet';
  activity_name: string;
  value: number;
  unit: string;
  carbon_emissions: number;
  date: string;
  created_at: string;
}

export const createActivity = async (
  supabase: SupabaseClient,
  activity: Activity & { date: string }
) => {
  const carbonEmissions = calculateCarbonEmissions(activity);

  const { data, error } = await supabase
    .from('activities')
    .insert({
      activity_type: activity.activityType,
      activity_name: activity.activityName,
      value: activity.value,
      unit: activity.unit,
      carbon_emissions: carbonEmissions,
      date: activity.date,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getActivitiesByDate = async (
  supabase: SupabaseClient,
  date: string
): Promise<ActivityRecord[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('date', date)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getActivitiesByDateRange = async (
  supabase: SupabaseClient,
  startDate: string,
  endDate: string
): Promise<ActivityRecord[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const deleteActivity = async (
  supabase: SupabaseClient,
  activityId: string
) => {
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', activityId);

  if (error) throw error;
};
