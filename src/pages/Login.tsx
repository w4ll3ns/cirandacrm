import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usuarios } from '@/data/mock';
import { Shield, Headphones, TrendingUp } from 'lucide-react';

const PERFIL_CONFIG = {
  admin: { icon: Shield, label: 'Admin / Direção', desc: 'Acesso total ao sistema' },
  secretaria: { icon: Headphones, label: 'Secretaria', desc: 'Atendimento e cadastros' },
  comercial: { icon: TrendingUp, label: 'Comercial', desc: 'Captação e pipeline' },
} as const;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (id: string) => {
    login(id);
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6">
      {/* Logo area */}
      <div className="mb-10 text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary-foreground flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-primary font-black text-2xl">C</span>
        </div>
        <h1 className="text-2xl font-bold text-primary-foreground">Ciranda ABC</h1>
        <p className="text-primary-foreground/70 text-sm mt-1">CRM Escolar</p>
      </div>

      {/* Profile selector */}
      <div className="w-full max-w-sm space-y-3">
        <p className="text-primary-foreground/80 text-center text-sm mb-4">
          Selecione seu perfil para entrar
        </p>
        {usuarios.map(u => {
          const config = PERFIL_CONFIG[u.perfil];
          const Icon = config.icon;
          return (
            <button
              key={u.id}
              onClick={() => handleLogin(u.id)}
              className="w-full bg-primary-foreground rounded-xl p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform shadow-md"
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

      <p className="text-primary-foreground/40 text-xs mt-8">
        Versão demo · Dados simulados
      </p>
    </div>
  );
}
