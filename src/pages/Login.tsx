import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error('Credenciais inválidas. Verifique e tente novamente.');
    } else {
      navigate('/app');
    }
  };

  const loginForm = (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <p className={`text-center text-sm mb-4 ${isMobile ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
        Entre com seu e-mail e senha
      </p>
      <div className="space-y-3">
        <Input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="bg-card border-border"
        />
        <Input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="bg-card border-border"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Entrar
      </Button>
    </form>
  );

  if (!isMobile) {
    return (
      <div className="min-h-screen flex">
        <div className="hidden md:flex flex-1 bg-primary flex-col items-center justify-center p-12">
          <img src="/logo.png" alt="Hora de Aprender" className="w-[120px] h-[120px] object-contain mb-6 drop-shadow-xl" />
          <h1 className="text-3xl font-bold text-primary-foreground mb-2 text-center">Centro Educacional Hora de Aprender</h1>
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

        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold">Bem-vindo de volta</h2>
            <p className="text-muted-foreground text-sm mt-1">Acesse sua conta do CRM</p>
          </div>
          {loginForm}
          <p className="text-muted-foreground/40 text-xs mt-8">Desenvolvido por WS Soluções Digitais</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6">
      <div className="mb-10 text-center">
        <img src="/logo.png" alt="Hora de Aprender" className="w-24 h-24 object-contain mx-auto mb-4 drop-shadow-lg" />
        <h1 className="text-2xl font-bold text-primary-foreground">Hora de Aprender</h1>
        <p className="text-primary-foreground/70 text-sm mt-1">CRM Escolar</p>
      </div>
      {loginForm}
      <p className="text-primary-foreground/40 text-xs mt-8">Desenvolvido por WS Soluções Digitais</p>
    </div>
  );
}
