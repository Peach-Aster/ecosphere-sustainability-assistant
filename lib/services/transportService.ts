import { EMISSION_FACTORS, TransportMode } from '../carbon/emissionFactors';

export interface TransportOption {
  mode: TransportMode;
  label: string;
  icon: string;
  emissionsPerKm: number;
  speedKmh: number;
  costPerKm: number;
  green: boolean;
}

export const TRANSPORT_OPTIONS: TransportOption[] = [
  { mode: 'walk', label: 'Walking', icon: 'Footprints', emissionsPerKm: EMISSION_FACTORS.transport.walk, speedKmh: 5, costPerKm: 0, green: true },
  { mode: 'bike', label: 'Bicycle', icon: 'Bike', emissionsPerKm: EMISSION_FACTORS.transport.bike, speedKmh: 15, costPerKm: 0, green: true },
  { mode: 'subway', label: 'Subway', icon: 'TramFront', emissionsPerKm: EMISSION_FACTORS.transport.subway, speedKmh: 32, costPerKm: 0.08, green: true },
  { mode: 'train', label: 'Train', icon: 'TrainFront', emissionsPerKm: EMISSION_FACTORS.transport.train, speedKmh: 80, costPerKm: 0.12, green: true },
  { mode: 'bus', label: 'Bus', icon: 'Bus', emissionsPerKm: EMISSION_FACTORS.transport.bus, speedKmh: 25, costPerKm: 0.06, green: true },
  { mode: 'electricCar', label: 'Electric Car', icon: 'Car', emissionsPerKm: EMISSION_FACTORS.transport.electricCar, speedKmh: 50, costPerKm: 0.09, green: true },
  { mode: 'motorcycle', label: 'Motorcycle', icon: 'Bike', emissionsPerKm: EMISSION_FACTORS.transport.motorcycle, speedKmh: 50, costPerKm: 0.11, green: false },
  { mode: 'car', label: 'Gasoline Car', icon: 'Car', emissionsPerKm: EMISSION_FACTORS.transport.car, speedKmh: 50, costPerKm: 0.15, green: false },
];

export interface RouteComparison {
  mode: TransportMode;
  label: string;
  icon: string;
  distanceKm: number;
  emissionsKg: number;
  durationMin: number;
  cost: number;
  green: boolean;
}

export const compareRoutes = (distanceKm: number): RouteComparison[] => {
  return TRANSPORT_OPTIONS.map((opt) => ({
    mode: opt.mode,
    label: opt.label,
    icon: opt.icon,
    distanceKm,
    emissionsKg: parseFloat((distanceKm * opt.emissionsPerKm).toFixed(3)),
    durationMin: Math.round((distanceKm / opt.speedKmh) * 60),
    cost: parseFloat((distanceKm * opt.costPerKm).toFixed(2)),
    green: opt.green,
  })).sort((a, b) => a.emissionsKg - b.emissionsKg);
};

export const getGreenestOption = (comparisons: RouteComparison[]): RouteComparison => {
  return comparisons[0];
};

export const getSavingsVsCar = (option: RouteComparison, distanceKm: number): { emissionsKg: number; percent: number } => {
  const carEmissions = distanceKm * EMISSION_FACTORS.transport.car;
  const savings = carEmissions - option.emissionsKg;
  const percent = carEmissions > 0 ? Math.round((savings / carEmissions) * 100) : 0;
  return { emissionsKg: parseFloat(savings.toFixed(3)), percent };
};
