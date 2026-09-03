import { Link, useNavigate } from '@tanstack/react-router';
import { LayoutDashboard, ShoppingCart, Users, LogOut, Menu, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: '/admink/login' });
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/admink' as any },
    { label: 'Pedidos', icon: ShoppingCart, to: '/admink/pedidos' as any },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#141417] border-b border-white/5 flex items-center justify-between px-4 z-50">
        <span className="font-bold text-blue-500 tracking-tight">ConectaMed ADM</span>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="text-white">
          {isOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-[#141417] border-r border-white/5 transform transition-transform duration-200 ease-in-out z-40 lg:translate-x-0 lg:static lg:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 hidden lg:block">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              ConectaMed
            </span>
            <div className="text-[10px] text-white/40 uppercase tracking-widest mt-1 font-medium">
              Painel Administrativo
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 mt-16 lg:mt-0">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                activeProps={{ className: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/10 hover:text-blue-400" }}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-white/5">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all group"
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
