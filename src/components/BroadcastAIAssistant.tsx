import { useState } from 'react';
import { Sparkles, Wand2, RefreshCw, Scissors, Flame, AlertTriangle, Copy, Check, Undo2, Loader2, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Tone = 'direto' | 'popular' | 'urgente' | 'emocional' | 'agressivo' | 'comunidade' | 'premium';
type Size = 'curto' | 'medio' | 'longo';

interface BroadcastAIAssistantProps {
  currentText: string;
  onApplyText: (text: string) => void;
  broadcastType: string;
}

const QUICK_SUGGESTIONS = [
  { key: 'bom_dia', label: '☀️ Bom dia' },
  { key: 'boa_tarde', label: '🌤 Boa tarde' },
  { key: 'boa_noite', label: '🌙 Boa noite' },
  { key: 'ultimos_titulos', label: '🎫 Últimos títulos' },
  { key: 'ultima_oportunidade', label: '⚠️ Última oportunidade' },
  { key: 'reta_final', label: '🏁 Reta final' },
  { key: 'madrugada_sorte', label: '🌙 Madrugada da sorte' },
  { key: 'link_abencado', label: '🙏 Link abençoado' },
  { key: 'urgencia', label: '🚨 Urgência' },
  { key: 'escassez', label: '⏳ Escassez' },
  { key: 'prova_social', label: '🏆 Prova social' },
  { key: 'engajamento', label: '💬 Engajamento' },
  { key: 'comunidade', label: '👥 Comunidade' },
  { key: 'chamada_clique', label: '👆 Chamada p/ clique' },
  { key: 'premio_instantaneo', label: '💸 Prêmio instantâneo' },
  { key: 'premio_principal', label: '🚗 Prêmio principal' },
  { key: 'texto_imagem', label: '🖼 Texto p/ imagem' },
  { key: 'texto_status', label: '📱 Texto p/ status' },
  { key: 'texto_curto_comunidade', label: '✂️ Curto p/ comunidade' },
  { key: 'texto_agressivo', label: '🔥 Texto agressivo' },
  { key: 'texto_popular', label: '🗣 Texto popular' },
  { key: 'texto_emocional', label: '❤️ Texto emocional' },
];

const TONES: { key: Tone; label: string }[] = [
  { key: 'direto', label: 'Direto' },
  { key: 'popular', label: 'Popular' },
  { key: 'urgente', label: 'Urgente' },
  { key: 'emocional', label: 'Emocional' },
  { key: 'agressivo', label: 'Agressivo' },
  { key: 'comunidade', label: 'Comunidade' },
  { key: 'premium', label: 'Premium' },
];

const SIZES: { key: Size; label: string }[] = [
  { key: 'curto', label: 'Curto' },
  { key: 'medio', label: 'Médio' },
  { key: 'longo', label: 'Longo' },
];

export default function BroadcastAIAssistant({ currentText, onApplyText, broadcastType }: BroadcastAIAssistantProps) {
  const [open, setOpen] = useState(false);
  const [actionUrl, setActionUrl] = useState('');
  const [linkContext, setLinkContext] = useState<{ title?: string; description?: string; image?: string } | null>(null);
  const [fetchingPreview, setFetchingPreview] = useState(false);
  const [tone, setTone] = useState<Tone>('popular');
  const [size, setSize] = useState<Size>('medio');
  const [loading, setLoading] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [originalText, setOriginalText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchLinkPreview = async () => {
    if (!actionUrl.trim()) return;
    setFetchingPreview(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-link-preview', {
        body: { url: actionUrl },
      });
      if (error) throw new Error(error.message);
      setLinkContext(data || null);
      toast.success('Contexto da campanha carregado!');
    } catch {
      toast.error('Não foi possível buscar o preview do link');
    } finally {
      setFetchingPreview(false);
    }
  };

  const callAI = async (action: string, suggestionType?: string) => {
    setLoading(true);
    try {
      // Save original text before first generation
      if (originalText === null && currentText.trim()) {
        setOriginalText(currentText);
      }

      const { data, error } = await supabase.functions.invoke('ai-copy-generator', {
        body: {
          action,
          currentText: currentText || '',
          tone,
          size,
          linkContext: linkContext || undefined,
          suggestionType,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const generated = data?.text || '';
      if (!generated) throw new Error('Nenhum texto gerado');

      setLastGenerated(generated);
      onApplyText(generated);
      toast.success('Texto gerado com IA!');
    } catch (err: any) {
      toast.error(err.message || 'Não foi possível gerar a mensagem agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = () => {
    if (originalText !== null) {
      onApplyText(originalText);
      setOriginalText(null);
      toast.info('Texto original restaurado');
    }
  };

  const handleAppend = () => {
    if (lastGenerated) {
      const separator = currentText.trim() ? '\n\n' : '';
      onApplyText(currentText + separator + lastGenerated);
      toast.success('Texto inserido sem substituir');
    }
  };

  const handleCopy = async () => {
    const text = lastGenerated || currentText;
    if (text) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-2">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-primary w-full justify-start">
          <Sparkles className="w-3.5 h-3.5" />
          {open ? 'Fechar Assistente IA' : '✨ Assistente IA'}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-3 border rounded-lg p-3 bg-muted/20">
        {/* Link da ação */}
        <div>
          <Label className="text-xs font-medium">Link da ação atual</Label>
          <div className="flex gap-1.5 mt-1">
            <Input
              value={actionUrl}
              onChange={e => setActionUrl(e.target.value)}
              placeholder="Cole aqui o link da ação para a IA entender a campanha"
              className="h-8 text-xs"
            />
            <Button
              variant="secondary"
              size="sm"
              className="h-8 text-xs shrink-0"
              onClick={fetchLinkPreview}
              disabled={!actionUrl.trim() || fetchingPreview}
            >
              {fetchingPreview ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
            </Button>
          </div>
          {linkContext && (
            <div className="mt-1.5 text-[10px] text-muted-foreground bg-muted rounded px-2 py-1">
              ✅ Contexto: {linkContext.title || 'Sem título'} — {linkContext.description?.slice(0, 80) || ''}
            </div>
          )}
        </div>

        {/* Tom e Tamanho */}
        <div className="flex gap-3 flex-wrap">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Tom</Label>
            <div className="flex flex-wrap gap-1">
              {TONES.map(t => (
                <Badge
                  key={t.key}
                  variant={tone === t.key ? 'default' : 'outline'}
                  className="cursor-pointer text-[10px] px-1.5 py-0"
                  onClick={() => setTone(t.key)}
                >
                  {t.label}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Tamanho</Label>
            <div className="flex gap-1">
              {SIZES.map(s => (
                <Badge
                  key={s.key}
                  variant={size === s.key ? 'default' : 'outline'}
                  className="cursor-pointer text-[10px] px-1.5 py-0"
                  onClick={() => setSize(s.key)}
                >
                  {s.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Main action buttons */}
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" className="h-7 text-xs gap-1" onClick={() => callAI('generate')} disabled={loading}>
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Gerar com IA
          </Button>
          <Button variant="secondary" size="sm" className="h-7 text-xs gap-1" onClick={() => callAI('improve')} disabled={loading || !currentText.trim()}>
            <Wand2 className="w-3 h-3" /> Melhorar
          </Button>
          <Button variant="secondary" size="sm" className="h-7 text-xs gap-1" onClick={() => callAI('variation')} disabled={loading || !currentText.trim()}>
            <RefreshCw className="w-3 h-3" /> Variação
          </Button>
          <Button variant="secondary" size="sm" className="h-7 text-xs gap-1" onClick={() => callAI('shorten')} disabled={loading || !currentText.trim()}>
            <Scissors className="w-3 h-3" /> Encurtar
          </Button>
          <Button variant="secondary" size="sm" className="h-7 text-xs gap-1" onClick={() => callAI('stronger')} disabled={loading || !currentText.trim()}>
            <Flame className="w-3 h-3" /> Mais forte
          </Button>
          <Button variant="secondary" size="sm" className="h-7 text-xs gap-1" onClick={() => callAI('urgent')} disabled={loading || !currentText.trim()}>
            <AlertTriangle className="w-3 h-3" /> Mais urgente
          </Button>
        </div>

        {/* Quick suggestions */}
        <div>
          <Label className="text-[10px] text-muted-foreground mb-1 block">Sugestões rápidas</Label>
          <div className="flex flex-wrap gap-1">
            {QUICK_SUGGESTIONS.map(s => (
              <Badge
                key={s.key}
                variant="outline"
                className="cursor-pointer text-[10px] px-1.5 py-0.5 hover:bg-primary/10 transition-colors"
                onClick={() => !loading && callAI('quick_suggestion', s.key)}
              >
                {s.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            Gerando texto com IA...
          </div>
        )}

        {/* Output actions */}
        {(lastGenerated || originalText !== null) && !loading && (
          <div className="flex flex-wrap gap-1.5 pt-1 border-t">
            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => callAI('generate')}>
              <RefreshCw className="w-3 h-3" /> Gerar novamente
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={handleCopy}>
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </Button>
            {lastGenerated && currentText !== lastGenerated && (
              <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={handleAppend}>
                <Plus className="w-3 h-3" /> Inserir sem substituir
              </Button>
            )}
            {originalText !== null && (
              <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={handleUndo}>
                <Undo2 className="w-3 h-3" /> Desfazer
              </Button>
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
