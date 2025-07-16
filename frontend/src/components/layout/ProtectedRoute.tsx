'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Spin } from 'antd';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin' | 'superadmin';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && requiredRole) {
      if (requiredRole === 'superadmin' && user.role !== 'superadmin') {
        router.push('/cabinet');
        return;
      }
      if (requiredRole === 'admin' && !['admin', 'superadmin'].includes(user.role)) {
        router.push('/cabinet');
        return;
      }
    }
  }, [user, isLoading, router, requiredRole]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}