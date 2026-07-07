'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { compareRoutes, getGreenestOption, getSavingsVsCar, RouteComparison } from '@/lib/services/transportService';
import { MapPin, Leaf, Clock, DollarSign, Cloud, Trophy, Footprints, Bike, TramFront, TrainFront, Bus, Car } from 'lucide-react';
import { toast } from 'sonner';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Footprints,
  Bike,
  TramFront,
  TrainFront,
  Bus,
  Car,
};

export default function TransportPage() {
  const [distance, setDistance] = useState('10');

  const distanceNum = parseFloat(distance) || 0;
  const comparisons = useMemo(() => compareRoutes(distanceNum), [distanceNum]);
  const greenest = getGreenestOption(comparisons);
  const savings = getSavingsVsCar(greenest, distanceNum);

  const handleDistanceChange = (val: string) => {
    const num = parseFloat(val);
    if (num < 0) {
      toast.error('Distance must be positive');
      return;
    }
    if (num > 1000) {
      toast.error('Please enter a distance under 1000 km');
      return;
    }
    setDistance(val);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Green Transport Finder</h1>
        <p className="text-gray-600 mt-1">Compare transport options by emissions, time, and cost</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-green-600" />
            <span>Plan Your Route</span>
          </CardTitle>
          <CardDescription>Enter the distance to compare all transport modes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="distance">Distance (km)</Label>
            <Input
              id="distance"
              type="number"
              min="0"
              max="1000"
              step="0.5"
              value={distance}
              onChange={(e) => handleDistanceChange(e.target.value)}
              placeholder="10"
            />
          </div>
        </CardContent>
      </Card>

      {distanceNum > 0 && (
        <>
          <Card className="shadow-lg border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-green-700 font-medium">Greenest Option</div>
                  <div className="text-2xl font-bold text-gray-900">{greenest.label}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {greenest.emissionsKg} kg CO₂ · {greenest.durationMin} min · ${greenest.cost}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">{savings.percent}%</div>
                  <div className="text-xs text-gray-600">less CO₂ vs car</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {comparisons.map((opt, i) => {
              const Icon = ICON_MAP[opt.icon] || Car;
              const isGreenest = i === 0;
              return (
                <Card
                  key={opt.mode}
                  className={`shadow-md transition-all hover:shadow-lg ${isGreenest ? 'border-green-400 ring-1 ring-green-300' : ''}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${opt.green ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <Icon className={`w-5 h-5 ${opt.green ? 'text-green-600' : 'text-gray-500'}`} />
                      </div>
                      {isGreenest && (
                        <Badge className="bg-green-600 hover:bg-green-600">Greenest</Badge>
                      )}
                    </div>
                    <CardTitle className="text-base mt-2">{opt.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-gray-500">
                        <Cloud className="w-4 h-4 mr-1" />
                        CO₂
                      </span>
                      <span className={`font-semibold ${opt.emissionsKg === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                        {opt.emissionsKg} kg
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        Time
                      </span>
                      <span className="font-semibold text-gray-900">{opt.durationMin} min</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-gray-500">
                        <DollarSign className="w-4 h-4 mr-1" />
                        Cost
                      </span>
                      <span className="font-semibold text-gray-900">${opt.cost}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Leaf className="w-5 h-5 text-green-600" />
                <span>Emissions Comparison</span>
              </CardTitle>
              <CardDescription>Visual breakdown of CO₂ per mode for {distanceNum} km</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {comparisons.map((opt) => {
                  const maxEmissions = Math.max(...comparisons.map((c) => c.emissionsKg), 0.001);
                  const widthPct = (opt.emissionsKg / maxEmissions) * 100;
                  return (
                    <div key={opt.mode} className="flex items-center space-x-3">
                      <div className="w-24 text-sm text-gray-600 truncate">{opt.label}</div>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${opt.green ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-orange-400 to-red-500'}`}
                          style={{ width: `${Math.max(widthPct, opt.emissionsKg === 0 ? 2 : 0)}%` }}
                        />
                      </div>
                      <div className="w-20 text-sm font-medium text-right text-gray-900">
                        {opt.emissionsKg} kg
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
