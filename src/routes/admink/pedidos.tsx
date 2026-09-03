import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getAllOrders } from '@/lib/admin-dashboard.functions';
import { 
  ShoppingCart, 
  Search,
  Filter,
  Loader2,
  Calendar,
  User,
  CreditCard,
  FileText,
  ShieldAlert,
  Phone,
  Mail,
  Fingerprint,
  Baby,
  Activity,
  MapPin,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/admink/pedidos')({
  ssr: false,
  component: PedidosPage,
});

function PedidosPage() {
  const [hasSession, setHasSession] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setSessionChecked(true);
    });
  }, []);

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => getAllOrders(),
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

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mb-2">
          <ShieldAlert className="h-6 w-6 text-red-500" />
        </div>
        <p className="text-white/60 text-center max-w-md">
          Não foi possível carregar os pedidos. Verifique suas permissões de administrador.
        </p>
      </div>
    );
  }

  const filteredOrders = orders?.filter((order: any) => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesSearch = 
      !searchTerm || 
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_cpf?.includes(searchTerm) ||
      order.short_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Pedidos</h1>
          <p className="text-white/40 mt-1">Gerenciamento completo de solicitações do ConectaMed.</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-white/5 p-1 rounded-xl border border-white/5">
          {(['all', 'paid', 'pending', 'cancelled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                filter === f 
                  ? "bg-blue-600 text-white shadow-lg" 
                  : "text-white/40 hover:text-white/60"
              )}
            >
              {f === 'all' ? 'Todos' : f === 'paid' ? 'Pagos' : f === 'pending' ? 'Pendentes' : 'Cancelados'}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-blue-500 transition-colors" />
        <input 
          type="text"
          placeholder="Buscar por nome, e-mail, CPF ou ID do pedido..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#141417] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-all shadow-xl"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-[#141417] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.02] text-white/40 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Dados Médicos</th>
                <th className="px-6 py-4">Pagamento</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              ) : filteredOrders && filteredOrders.length > 0 ? (
                filteredOrders.map((order: any) => (
                  <OrderRow key={order.id} order={order} />
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

function OrderRow({ order }: { order: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr 
        className={cn(
          "group hover:bg-white/[0.02] transition-colors cursor-pointer border-l-2",
          expanded ? "border-blue-500 bg-white/[0.01]" : "border-transparent"
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-6 py-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
              {order.customer_name || 'N/A'}
            </span>
            <span className="text-xs text-white/40">{order.customer_email || 'N/A'}</span>
            <span className="text-[10px] font-mono text-white/20 mt-1 uppercase">
              ID: {order.short_code || order.id.substring(0, 8)}
            </span>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center text-xs text-white/60">
              <FileText className="h-3 w-3 mr-1.5 text-blue-500/50" />
              <span>CID: {order.order_details?.cid || 'Não informado'}</span>
            </div>
            <div className="flex items-center text-xs text-white/60">
              <Calendar className="h-3 w-3 mr-1.5 text-blue-500/50" />
              <span>{order.order_details?.consultationDate || 'N/A'}</span>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white/80">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.amount)}
            </span>
            <span className="text-[10px] text-white/30 uppercase tracking-tighter">PIX PushinPay</span>
          </div>
        </td>
        <td className="px-6 py-4">
          <StatusBadge status={order.status as any} />
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-col">
            <span className="text-sm text-white/60">
              {order.created_at ? new Date(order.created_at).toLocaleDateString('pt-BR') : 'N/A'}
            </span>
            <span className="text-[10px] text-white/20">
              {order.created_at ? new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg bg-white/5 hover:bg-blue-500/10 text-white/40 hover:text-blue-400 transition-all">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-white/[0.01]">
          <td colSpan={6} className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-top-2 duration-300">
              {/* Coluna 1: Pessoal */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Dados Pessoais</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Fingerprint className="h-4 w-4 text-white/20" />
                    <div>
                      <p className="text-[10px] text-white/40 uppercase">CPF</p>
                      <p className="text-sm text-white/80">{order.customer_cpf || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-white/20" />
                    <div>
                      <p className="text-[10px] text-white/40 uppercase">Nascimento</p>
                      <p className="text-sm text-white/80">
                        {order.customer_birth_date ? new Date(order.customer_birth_date).toLocaleDateString('pt-BR') : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Baby className="h-4 w-4 text-white/20" />
                    <div>
                      <p className="text-[10px] text-white/40 uppercase">Nome da Mãe</p>
                      <p className="text-sm text-white/80">{order.customer_mother_name || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna 2: Contato & Local */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Contato & Local</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-white/20" />
                    <div>
                      <p className="text-[10px] text-white/40 uppercase">WhatsApp</p>
                      <p className="text-sm text-white/80">{order.customer_whatsapp || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-white/20" />
                    <div>
                      <p className="text-[10px] text-white/40 uppercase">Local da Consulta</p>
                      <p className="text-sm text-white/80">
                        {order.order_details?.upa || 'N/A'}
                        {order.order_details?.teleconsulta && <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">Teleconsulta</span>}
                      </p>
                      <p className="text-xs text-white/40">
                        {order.order_details?.bairro}, {order.order_details?.cidade}/{order.order_details?.estado}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna 3: Pedido & Pagamento */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Detalhes do Pedido</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-white/20" />
                    <div>
                      <p className="text-[10px] text-white/40 uppercase">Produto / Dias</p>
                      <p className="text-sm text-white/80">{order.product_name || 'Atestado Médico'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-white/20" />
                    <div>
                      <p className="text-[10px] text-white/40 uppercase">Transação ID (PushinPay)</p>
                      <p className="text-xs font-mono text-white/60">{order.pushinpay_transaction_id || 'N/A'}</p>
                    </div>
                  </div>
                  {order.status === 'paid' && (
                    <div className="pt-2">
                      <a 
                        href={`https://api.pushinpay.com.br/api/transactions/${order.pushinpay_transaction_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-[10px] text-blue-400 hover:text-blue-300 transition-colors uppercase font-bold tracking-wider"
                      >
                        Ver na PushinPay <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
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
