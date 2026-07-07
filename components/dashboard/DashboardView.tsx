'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { getCarbonScoreByDate, getCarbonScoresByDateRange, updateCarbonScore } from '@/lib/services/carbonScoreService';
import { getScoreColor, getScoreLabel } from '@/lib/carbon/emissionFactors';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Leaf, TrendingDown, TrendingUp, Award, Lightbulb } from 'lucide-react';
import { format, subDays } from 'date-fns';

const DashboardView = () => {
  const [todayScore, setTodayScore] = useState<number | null>(null);
  const [todayEmissions, setTodayEmissions] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const sevenDaysAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd');

      await updateCarbonScore(supabase, today);
      const todayData = await getCarbonScoreByDate(supabase, today);

      if (todayData) {
        setTodayScore(todayData.score);
        setTodayEmissions({
          transport: todayData.transport_emissions,
          energy: todayData.energy_emissions,
          diet: todayData.diet_emissions,
          total: todayData.total_emissions,
        });
      }

      const scores = await getCarbonScoresByDateRange(supabase, sevenDaysAgo, today);

      const formattedData = scores.map(score => ({
        date: format(new Date(score.date), 'MMM dd'),
        score: score.score,
        emissions: parseFloat(score.total_emissions.toFixed(2)),
      }));

      const allDates = [];
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'MMM dd');
        const existingData = formattedData.find(d => d.date === date);
        allDates.push(existingData || { date, score: null, emissions: null });
      }

      setChartData(allDates);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = todayEmissions ? [
    { name: 'Transport', value: parseFloat(todayEmissions.transport.toFixed(2)), color: '#10b981' },
    { name: 'Energy', value: parseFloat(todayEmissions.energy.toFixed(2)), color: '#3b82f6' },
    { name: 'Diet', value: parseFloat(todayEmissions.diet.toFixed(2)), color: '#f59e0b' },
  ].filter(item => item.value > 0) : [];

  const ecoInsights = [
    {
      icon: Leaf,
      title: 'Switch to Public Transit',
      description: 'Using public transport instead of driving can reduce your carbon footprint by up to 45%.',
      impact: 'High Impact',
    },
    {
      icon: Lightbulb,
      title: 'LED Lighting',
      description: 'Replace incandescent bulbs with LEDs to save 80% on lighting energy.',
      impact: 'Medium Impact',
    },
    {
      icon: TrendingDown,
      title: 'Plant-Based Meals',
      description: 'Eating one plant-based meal per day can save 0.45kg CO2 daily.',
      impact: 'High Impact',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Track your environmental impact</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-50 border-b border-green-100">
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-green-600" />
              <span>Today's Score</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className={`text-6xl font-bold ${getScoreColor(todayScore || 0)}`}>
                {todayScore !== null ? todayScore : '--'}
              </div>
              <div className="text-xl text-gray-600 mt-2">
                {todayScore !== null ? getScoreLabel(todayScore) : 'No data'}
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500 mb-2">Total Emissions</div>
                <div className="text-3xl font-bold text-gray-900">
                  {todayEmissions?.total.toFixed(2) || '0.00'}
                  <span className="text-base font-normal text-gray-500 ml-1">kg CO₂</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>7-Day Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Score"
                  dot={{ fill: '#10b981', r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingDown className="w-5 h-5 text-green-600" />
              <span>Emissions Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No emissions data for today. Start tracking your activities!
              </div>
            )}
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-500">Transport</div>
                <div className="text-lg font-bold text-green-600">
                  {todayEmissions?.transport.toFixed(2) || '0.00'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Energy</div>
                <div className="text-lg font-bold text-blue-600">
                  {todayEmissions?.energy.toFixed(2) || '0.00'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Diet</div>
                <div className="text-lg font-bold text-orange-600">
                  {todayEmissions?.diet.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-green-600" />
              <span>Eco-Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ecoInsights.map((insight, index) => (
              <div key={index} className="flex space-x-3 p-3 rounded-lg bg-green-50 border border-green-100">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <insight.icon className="w-5 h-5 text-green-700" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">{insight.title}</h4>
                    <span className="text-xs px-2 py-1 bg-green-200 text-green-800 rounded-full">
                      {insight.impact}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardView;
