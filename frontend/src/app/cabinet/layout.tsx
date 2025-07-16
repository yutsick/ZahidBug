import ProtectedRoute from '@/components/layout/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';

export default function CabinetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="user">
      <AppLayout>
        {children}
      </AppLayout>
    </ProtectedRoute>
  );
}