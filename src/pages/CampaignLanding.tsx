import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Users2, Loader2, AlertCircle, UserX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

type Campaign = {
  id: string;
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  cor_primaria: string;
  cor_fundo: string;
  slug: string;
  ativa: boolean;
};

function CampaignImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative w-full max-h-64 overflow-hidden rounded-2xl shadow-lg mx-auto">
      {!loaded && <Skeleton className="w-full h-64 rounded-2xl" />}
      <img
        src={src}
        alt={alt}
        width={800}
        height={256}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className={`w-full max-h-64 object-cover ${loaded ? '' : 'absolute inset-0 opacity-0'}`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

export default function CampaignLanding() {
  const { slug } = useParams<{ slug: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [allFull, setAllFull] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error: err } = await supabase
        .from('community_campaigns')
        .select('*')
        .eq('slug', slug)
        .eq('ativa', true)
        .maybeSingle();

      if (err || !data) {
        setNotFound(true);
      } else {
        setCampaign(data as Campaign);
      }
      setLoading(false);
    })();
  }, [slug]);

  const handleJoin = async () => {
    if (!slug) return;
    setJoining(true);
    setError(null);
    setAllFull(false);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/community-join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ slug }),
      });

      const data = await response.json().catch(() => null);
      const responseError = typeof data?.error === 'string' ? data.error : '';

      if (!response.ok) {
        if (response.status === 409 || responseError.toLowerCase().includes('lotados')) {
          setAllFull(true);
        } else {
          setError(responseError || 'Erro ao buscar grupo disponível');
        }
        setJoining(false);
        return;
      }

      if (data?.invitationLink) {
        window.location.href = data.invitationLink;
      } else if (responseError) {
        if (responseError.toLowerCase().includes('lotados')) {
          setAllFull(true);
        } else {
          setError(responseError);
        }
        setJoining(false);
      } else {
        setError('Não foi possível encontrar um grupo disponível.');
        setJoining(false);
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-3">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-bold">Campanha não encontrada</h1>
          <p className="text-muted-foreground text-sm">Este link não é válido ou a campanha não está mais ativa.</p>
        </div>
      </div>
    );
  }

  if (!campaign) return null;

  if (allFull) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-8"
        style={{ backgroundColor: campaign.cor_fundo }}
      >
        <div className="w-full max-w-md space-y-6 text-center">
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto shadow-lg opacity-80"
            style={{ backgroundColor: campaign.cor_primaria }}
          >
            <UserX className="h-12 w-12 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold" style={{ color: campaign.cor_primaria }}>
              Comunidade Lotada
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Todos os grupos estão cheios no momento. Novas vagas podem abrir em breve!
            </p>
          </div>
          <Button
            onClick={() => { setAllFull(false); handleJoin(); }}
            variant="outline"
            className="w-full h-14 text-lg font-semibold rounded-xl shadow-md"
            style={{ borderColor: campaign.cor_primaria, color: campaign.cor_primaria }}
          >
            Tentar novamente
          </Button>
          <p className="text-xs text-muted-foreground/60">
            Tente novamente mais tarde — vagas podem abrir a qualquer momento
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ backgroundColor: campaign.cor_fundo }}
    >
      <div className="w-full max-w-md space-y-6 text-center">
        {campaign.imagem_url ? (
          <CampaignImage src={campaign.imagem_url} alt={campaign.nome} />
        ) : (
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto shadow-lg"
            style={{ backgroundColor: campaign.cor_primaria }}
          >
            <Users2 className="h-12 w-12 text-white" />
          </div>
        )}

        <div className="space-y-2">
          <h1 className="text-2xl font-bold" style={{ color: campaign.cor_primaria }}>
            {campaign.nome}
          </h1>
          {campaign.descricao && (
            <p className="text-sm text-muted-foreground leading-relaxed">{campaign.descricao}</p>
          )}
        </div>

        <Button
          onClick={handleJoin}
          disabled={joining}
          className="w-full h-14 text-lg font-semibold rounded-xl shadow-md text-white"
          style={{ backgroundColor: campaign.cor_primaria }}
        >
          {joining ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Buscando grupo disponível...
            </>
          ) : (
            'Entrar na Comunidade'
          )}
        </Button>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
            <p className="text-sm text-destructive font-medium">{error}</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground/60">
          Ao clicar, você será redirecionado para o WhatsApp
        </p>
      </div>
    </div>
  );
}
