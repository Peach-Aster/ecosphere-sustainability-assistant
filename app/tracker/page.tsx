'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { createActivity, getActivitiesByDate, deleteActivity, ActivityRecord } from '@/lib/services/activityService';
import { updateCarbonScore } from '@/lib/services/carbonScoreService';
import { EMISSION_FACTORS, calculateCarbonEmissions } from '@/lib/carbon/emissionFactors';
import { format } from 'date-fns';
import { Trash2, Plus, Activity as ActivityIcon, Car, Zap, Utensils } from 'lucide-react';
import { toast } from 'sonner';

const TRANSPORT_OPTIONS = [
  { value: 'car', label: 'Car (gasoline)', unit: 'km' },
  { value: 'electricCar', label: 'Electric Car', unit: 'km' },
  { value: 'bus', label: 'Bus', unit: 'km' },
  { value: 'train', label: 'Train', unit: 'km' },
  { value: 'subway', label: 'Subway', unit: 'km' },
  { value: 'motorcycle', label: 'Motorcycle', unit: 'km' },
  { value: 'bike', label: 'Bicycle', unit: 'km' },
  { value: 'walk', label: 'Walking', unit: 'km' },
];

const ENERGY_OPTIONS = [
  { value: 'electricity', label: 'Electricity', unit: 'kWh' },
  { value: 'naturalGas', label: 'Natural Gas', unit: 'm³' },
  { value: 'heating', label: 'Heating', unit: 'kWh' },
  { value: 'cooling', label: 'Cooling', unit: 'kWh' },
];

const DIET_OPTIONS = [
  { value: 'beef', label: 'Beef meal', unit: 'meals' },
  { value: 'pork', label: 'Pork meal', unit: 'meals' },
  { value: 'chicken', label: 'Chicken meal', unit: 'meals' },
  { value: 'fish', label: 'Fish meal', unit: 'meals' },
  { value: 'vegetarian', label: 'Vegetarian meal', unit: 'meals' },
  { value: 'vegan', label: 'Vegan meal', unit: 'meals' },
];

const CATEGORY_CONFIG = {
  transport: { options: TRANSPORT_OPTIONS, icon: Car, color: 'text-green-600', bg: 'bg-green-50' },
  energy: { options: ENERGY_OPTIONS, icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50' },
  diet: { options: DIET_OPTIONS, icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-50' },
};

type Category = keyof typeof CATEGORY_CONFIG;

export default function TrackerPage() {
  const supabase = createClient();
  const [category, setCategory] = useState<Category>('transport');
  const [activityName, setActivityName] = useState('car');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentOptions = CATEGORY_CONFIG[category].options;
  const currentOption = currentOptions.find((o) => o.value === activityName) || currentOptions[0];
  const previewEmissions = value ? calculateCarbonEmissions({
    activityType: category,
    activityName,
    value: parseFloat(value) || 0,
    unit: currentOption.unit,
  }) : 0;

  useEffect(() => {
    loadActivities();
  }, [date]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await getActivitiesByDate(supabase, date);
      setActivities(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat as Category);
    setActivityName(CATEGORY_CONFIG[cat as Category].options[0].value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(value);
    if (!numValue || numValue <= 0) {
      toast.error('Please enter a valid value');
      return;
    }

    setSubmitting(true);
    try {
      await createActivity(supabase, {
        activityType: category,
        activityName,
        value: numValue,
        unit: currentOption.unit,
        date,
      });
      await updateCarbonScore(supabase, date);
      setValue('');
      await loadActivities();
      toast.success('Activity logged successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to log activity');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteActivity(supabase, id);
      await updateCarbonScore(supabase, date);
      await loadActivities();
      toast.success('Activity removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete activity');
    }
  };

  const totalEmissions = activities.reduce((sum, a) => sum + Number(a.carbon_emissions), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Carbon Tracker</h1>
        <p className="text-gray-600 mt-1">Log your daily activities to measure your carbon footprint</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-green-600" />
              <span>Log New Activity</span>
            </CardTitle>
            <CardDescription>Choose a category and enter the details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(CATEGORY_CONFIG) as Category[]).map((cat) => {
                    const Icon = CATEGORY_CONFIG[cat].icon;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategoryChange(cat)}
                        className={`flex flex-col items-center justify-center py-3 rounded-lg border-2 transition-all ${
                          category === cat
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-5 h-5 mb-1" />
                        <span className="text-xs font-medium capitalize">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity">Activity Type</Label>
                <Select value={activityName} onValueChange={setActivityName}>
                  <SelectTrigger id="activity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currentOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Value ({currentOption.unit})</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    max={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
              </div>

              {value && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                  <div className="text-sm text-gray-600">Estimated emissions</div>
                  <div className="text-2xl font-bold text-green-700">
                    {previewEmissions.toFixed(3)} <span className="text-sm font-normal">kg CO₂</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Log Activity'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ActivityIcon className="w-5 h-5 text-green-600" />
              <span>Today's Activities</span>
            </CardTitle>
            <CardDescription>
              {format(new Date(date), 'MMMM d, yyyy')} — Total: {totalEmissions.toFixed(2)} kg CO₂
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-gray-500">Loading...</div>
            ) : activities.length === 0 ? (
              <div className="py-12 text-center">
                <ActivityIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No activities logged for this day yet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {activities.map((act) => {
                  const Icon = CATEGORY_CONFIG[act.activity_type as Category].icon;
                  return (
                    <div
                      key={act.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${CATEGORY_CONFIG[act.activity_type as Category].bg}`}>
                          <Icon className={`w-5 h-5 ${CATEGORY_CONFIG[act.activity_type as Category].color}`} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {act.activity_name.replace(/([A-Z])/g, ' $1')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {act.value} {act.unit} · {Number(act.carbon_emissions).toFixed(3)} kg CO₂
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(act.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
