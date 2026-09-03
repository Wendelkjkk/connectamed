import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminGuard } from '@/components/admin/AdminGuard';

export const Route = createFileRoute('/admink')({
  component: AdminLayout,
});

function AdminLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/admink/login';

  if (isLoginPage) {
    return <Outlet />;
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col lg:flex-row">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="pt-20 lg:pt-0">
            <Outlet />
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
