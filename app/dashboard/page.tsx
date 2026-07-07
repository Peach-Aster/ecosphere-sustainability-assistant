'use client';

import React from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import AuthForm from '@/components/auth/AuthForm';
import DashboardView from '@/components/dashboard/DashboardView';

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return <DashboardView />;
}
