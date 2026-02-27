import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usuarios } from '@/data/mock';
import { Shield, Headphones, TrendingUp } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const PERFIL_CONFIG = {
  admin: { icon: Shield, label: 'Admin / Direção', desc: 'Acesso total ao sistema' },
  secretaria: { icon: Headphones, label: 'Secretaria', desc: 'Atendimento e cadastros' },
  comercial: { icon: TrendingUp, label: 'Comercial', desc: 'Captação e pipeline' },
} as const;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleLogin = (id: string) => {
    login(id);
    navigate('/app');
  };

  const profileSelector = (
    <div className="w-full max-w-sm space-y-3">
      <p className={`text-center text-sm mb-4 ${isMobile ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
        Selecione seu perfil para entrar
      </p>
      {usuarios.map(u => {
        const config = PERFIL_CONFIG[u.perfil];
        const Icon = config.icon;
        return (
          <button
            key={u.id}
            onClick={() => handleLogin(u.id)}
            className="w-full bg-card rounded-xl p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform shadow-md hover:shadow-lg hover:border-primary border border-border"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{u.nome}</p>
              <p className="text-sm text-muted-foreground">{config.label}</p>
              <p className="text-xs text-muted-foreground/70">{config.desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );

  if (!isMobile) {
    return (
      <div className="min-h-screen flex">
        {/* Left branding panel */}
         <div className="hidden md:flex flex-1 bg-primary flex-col items-center justify-center p-12">
          <img src="/logo.png" alt="Ciranda ABC" className="w-[120px] h-[120px] object-contain mb-6 drop-shadow-xl" />
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">Ciranda ABC</h1>
          <p className="text-primary-foreground/70 text-center max-w-xs">
            CRM Escolar para gerenciar matrículas, leads e comunicação com famílias.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            {[
              { n: '120+', l: 'Leads ativos' },
              { n: '85%', l: 'Taxa de contato' },
              { n: '40+', l: 'Matrículas/mês' },
            ].map(s => (
              <div key={s.l}>
                <p className="text-2xl font-bold text-primary-foreground">{s.n}</p>
                <p className="text-xs text-primary-foreground/60">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold">Bem-vindo de volta</h2>
            <p className="text-muted-foreground text-sm mt-1">Acesse sua conta do CRM</p>
          </div>
          {profileSelector}
          <p className="text-muted-foreground/40 text-xs mt-8">Versão demo · Dados simulados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6">
      <div className="mb-10 text-center">
        <img src="/logo.png" alt="Ciranda ABC" className="w-24 h-24 object-contain mx-auto mb-4 drop-shadow-lg" />
        <h1 className="text-2xl font-bold text-primary-foreground">Ciranda ABC</h1>
        <p className="text-primary-foreground/70 text-sm mt-1">CRM Escolar</p>
      </div>
      {profileSelector}
      <p className="text-primary-foreground/40 text-xs mt-8">Versão demo · Dados simulados</p>
    </div>
  );
}
