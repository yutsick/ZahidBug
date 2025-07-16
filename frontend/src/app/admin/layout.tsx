import ProtectedRoute from '@/components/layout/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="admin">
      <AppLayout>
        {children}
      </AppLayout>
    </ProtectedRoute>
  );
}
