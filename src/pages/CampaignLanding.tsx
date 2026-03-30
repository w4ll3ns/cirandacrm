import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Users2, Loader2, AlertCircle, UserX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

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
      const res = await supabase.functions.invoke('community-join', {
        body: { slug },
      });

      if (res.error) {
        const msg = res.error.message || '';
        if (msg.includes('lotados') || msg.includes('409')) {
          setAllFull(true);
        } else {
          setError(msg || 'Erro ao buscar grupo disponível');
        }
        setJoining(false);
        return;
      }

      const data = res.data;
      if (data?.invitationLink) {
        window.location.href = data.invitationLink;
      } else if (data?.error) {
        if (data.error.includes('lotados')) {
          setAllFull(true);
        } else {
          setError(data.error);
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

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ backgroundColor: campaign.cor_fundo }}
    >
      <div className="w-full max-w-md space-y-6 text-center">
        {campaign.imagem_url ? (
          <img
            src={campaign.imagem_url}
            alt={campaign.nome}
            className="w-full max-h-64 object-cover rounded-2xl shadow-lg mx-auto"
          />
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
