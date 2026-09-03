import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getAdminDashboardStats, getRecentOrders } from '@/lib/admin-dashboard.functions';
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  TrendingUp,
  FileText,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/admink/')({
  ssr: false,
  component: AdminDashboard,
});

function AdminDashboard() {
  const [hasSession, setHasSession] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data.session) {
        setHasSession(false);
      } else {
        setHasSession(true);
      }
      setSessionChecked(true);
    });
  }, []);

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => getAdminDashboardStats(),
    enabled: hasSession,
    retry: false,
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => getRecentOrders(),
    enabled: hasSession,
    retry: false,
  });

  if (!sessionChecked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mb-2">
          <ShieldAlert className="h-6 w-6 text-red-500" />
        </div>
        <p className="text-white/60">Carregando dados do painel...</p>
        <Loader2 className="h-6 w-6 animate-spin text-blue-500/50" />
      </div>
    );
  }



  const statCards = [
    {
      label: 'TOTAL DE PEDIDOS',
      value: stats.totalOrders,
      icon: FileText,
      color: 'blue'
    },
    {
      label: 'PEDIDOS PENDENTES',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'yellow'
    },
    {
      label: 'PEDIDOS PAGOS',
      value: stats.paidOrders,
      icon: CheckCircle2,
      color: 'green'
    },
    {
      label: 'PEDIDOS CANCELADOS',
      value: stats.cancelledOrders,
      icon: XCircle,
      color: 'red'
    },
    {
      label: 'VALOR RECEBIDO',
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRevenue),
      icon: TrendingUp,
      color: 'indigo'
    }
  ];

  return (
    <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-white/40 mt-1">Bem-vindo de volta, Wendel. Aqui está um resumo do ConectaMed.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div 
            key={card.label}
            className="bg-[#141417] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-white/10 transition-all"
          >
            <div className={cn(
              "absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-[0.03] transition-transform group-hover:scale-110",
              card.color === 'blue' && "bg-blue-500",
              card.color === 'yellow' && "bg-yellow-500",
              card.color === 'green' && "bg-green-500",
              card.color === 'red' && "bg-red-500",
              card.color === 'indigo' && "bg-indigo-500",
            )} style={{ borderRadius: '50%' }} />
            
            <div className="flex flex-col space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{card.label}</span>
                <card.icon className={cn(
                  "h-4 w-4",
                  card.color === 'blue' && "text-blue-400",
                  card.color === 'yellow' && "text-yellow-400",
                  card.color === 'green' && "text-green-400",
                  card.color === 'red' && "text-red-400",
                  card.color === 'indigo' && "text-indigo-400",
                )} />
              </div>
              <span className="text-2xl font-bold text-white">{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders Section */}
      <div className="bg-[#141417] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Pedidos Recentes</h2>
          <span className="text-xs text-white/40 font-medium px-2 py-1 bg-white/5 rounded-full">
            Mostrando os últimos 10
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.02] text-white/40 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">ID do Pedido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentOrders && recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mr-3 text-blue-400 text-xs font-bold">
                          {order.customer_name?.substring(0, 2).toUpperCase() || 'NA'}
                        </div>
                        <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                          {order.customer_name || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-white/60">{order.product_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-white/80">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status as any} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-white/40">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-white/20 group-hover:text-white/40 transition-colors uppercase">
                        {order.short_code || order.id.substring(0, 8)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 opacity-20">
                      <ShoppingCart className="h-12 w-12" />
                      <p className="text-lg font-medium">Nenhum pedido encontrado.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'pending' | 'paid' | 'cancelled' | 'failed' | 'expired' }) {
  const configs = {
    pending: { label: 'Pendente', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    paid: { label: 'Pago', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
    cancelled: { label: 'Cancelado', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
    failed: { label: 'Falhou', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
    expired: { label: 'Expirado', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  };

  const config = configs[status] || configs.pending;

  return (
    <span className={cn(
      "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border",
      config.color
    )}>
      {config.label}
    </span>
  );
}
