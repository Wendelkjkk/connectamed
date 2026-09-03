import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { checkIsAdmin } from '@/lib/admin.functions';
import { Loader2, ShieldAlert, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        // Force refresh session to ensure it's valid
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          if (mounted) {
            setAuthenticated(false);
            setLoading(false);
            navigate({ to: '/admink/login', replace: true });
          }
          return;
        }

        if (mounted) setAuthenticated(true);

        // Verify admin role strictly on every mount/check
        try {
          const { isAdmin: adminStatus } = await checkIsAdmin();
          if (mounted) {
            setIsAdmin(!!adminStatus);
            setLoading(false);
          }
        } catch (adminError) {
          console.error('Admin verification failed:', adminError);
          if (mounted) {
            setIsAdmin(false);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error in AdminGuard:', error);
        if (mounted) setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        if (mounted) {
          setAuthenticated(false);
          setIsAdmin(false);
          navigate({ to: '/admink/login', replace: true });
        }
      } else {
        if (mounted) setAuthenticated(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: '/admink/login', replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-white/60 animate-pulse">Verificando credenciais...</p>
      </div>
    );
  }

  if (!authenticated) {
    return null; // Will redirect via useEffect
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#141417] border border-white/5 rounded-2xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-2">
            <ShieldAlert className="h-8 w-8 text-red-500" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Acesso Não Autorizado</h2>
            <p className="text-white/60">
              Você não possui permissões de administrador para acessar esta área.
            </p>
          </div>

          <div className="flex flex-col space-y-3 pt-4">
            <Button 
              variant="outline" 
              className="border-white/10 hover:bg-white/5 text-white"
              onClick={() => navigate({ to: '/' })}
            >
              Voltar para o Início
            </Button>
            
            <Button 
              variant="ghost" 
              className="text-white/40 hover:text-white hover:bg-white/5"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair da Conta
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
