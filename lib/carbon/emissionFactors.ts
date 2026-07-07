export const EMISSION_FACTORS = {
  transport: {
    car: 0.192,
    bus: 0.089,
    train: 0.041,
    bike: 0,
    walk: 0,
    motorcycle: 0.113,
    electricCar: 0.053,
    subway: 0.028,
  },
  energy: {
    electricity: 0.475,
    naturalGas: 0.185,
    heating: 0.210,
    cooling: 0.395,
  },
  diet: {
    beef: 27.0,
    pork: 12.1,
    chicken: 6.9,
    fish: 5.1,
    vegetarian: 3.8,
    vegan: 1.5,
  },
} as const;

export type TransportMode = keyof typeof EMISSION_FACTORS.transport;
export type EnergyType = keyof typeof EMISSION_FACTORS.energy;
export type DietType = keyof typeof EMISSION_FACTORS.diet;

export interface Activity {
  activityType: 'transport' | 'energy' | 'diet';
  activityName: string;
  value: number;
  unit: string;
}

export const calculateCarbonEmissions = (activity: Activity): number => {
  const { activityType, activityName, value } = activity;

  let emissionFactor = 0;

  if (activityType === 'transport') {
    emissionFactor = EMISSION_FACTORS.transport[activityName as TransportMode] || 0;
  } else if (activityType === 'energy') {
    emissionFactor = EMISSION_FACTORS.energy[activityName as EnergyType] || 0;
  } else if (activityType === 'diet') {
    emissionFactor = EMISSION_FACTORS.diet[activityName as DietType] || 0;
  }

  return value * emissionFactor;
};

export const calculateDailyScore = (emissions: {
  transport: number;
  energy: number;
  diet: number;
}): number => {
  const totalEmissions = emissions.transport + emissions.energy + emissions.diet;

  const averageDailyEmissions = 13.0;

  const ratio = totalEmissions / averageDailyEmissions;

  let score = 100 - (ratio * 50);

  score = Math.max(0, Math.min(100, Math.round(score)));

  return score;
};

export const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
};

export const getScoreLabel = (score: number): string => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Improvement';
};
