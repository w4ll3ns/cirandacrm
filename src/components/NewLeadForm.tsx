import { useState } from 'react';
import { X } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { ORIGEM_LABELS } from '@/types';
import type { Origem } from '@/types';
import { toast } from 'sonner';
import { useProfiles } from '@/hooks/useProfiles';

interface Props {
  open: boolean;
  onClose: () => void;
}

const SERIES = ['Berçário', 'Maternal I', 'Maternal II', 'Jardim I', 'Jardim II', '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano'];

export default function NewLeadForm({ open, onClose }: Props) {
  const { addResponsavel, addAluno, addOportunidade } = useData();
  const { usuario } = useAuth();
  const { profiles } = useProfiles();
  const [nomeResp, setNomeResp] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [origem, setOrigem] = useState<Origem>('whatsapp');
  const [nomeAluno, setNomeAluno] = useState('');
  const [serie, setSerie] = useState('Jardim I');
  const [valorEstimado, setValorEstimado] = useState('');
  const [responsavelInternoId, setResponsavelInternoId] = useState(usuario?.id || '');
  const [submitting, setSubmitting] = useState(false);
  const isAdmin = usuario?.perfil === 'admin';

  if (!open) return null;

  const handleSubmit = async () => {
    if (!nomeResp.trim() || !whatsapp.trim() || !nomeAluno.trim()) {
      toast.error('Preencha nome do responsável, WhatsApp e nome do aluno');
      return;
    }

    setSubmitting(true);
    try {
      const respId = await addResponsavel({
        nome: nomeResp.trim(),
        telefone: whatsapp.trim(),
        whatsapp: whatsapp.trim(),
        origem,
        tags: [],
      });

      const alunoId = await addAluno({
        nome: nomeAluno.trim(),
        responsavel_id: respId,
        serie_interesse: serie,
      });

      await addOportunidade({
        responsavel_id: respId,
        aluno_id: alunoId,
        etapa: 'novo_lead',
        temperatura: 'morno',
        status: 'aberta',
        valor_estimado: valorEstimado ? Number(valorEstimado) : null,
        responsavel_interno_id: responsavelInternoId || usuario?.id || null,
      });

      toast.success('Lead cadastrado com sucesso! 🎉');
      setNomeResp(''); setWhatsapp(''); setNomeAluno(''); setValorEstimado('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/40" />
      <div className="relative bg-card rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Novo Lead</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Responsável</label>
            <input value={nomeResp} onChange={e => setNomeResp(e.target.value)} placeholder="Nome completo" className="w-full mt-1 bg-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">WhatsApp</label>
            <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(00) 90000-0000" className="w-full mt-1 bg-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Origem</label>
            <select value={origem} onChange={e => setOrigem(e.target.value as Origem)} className="w-full mt-1 bg-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              {Object.entries(ORIGEM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          <div className="border-t border-border pt-4">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aluno</label>
            <input value={nomeAluno} onChange={e => setNomeAluno(e.target.value)} placeholder="Nome do aluno" className="w-full mt-1 bg-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Série de Interesse</label>
            <select value={serie} onChange={e => setSerie(e.target.value)} className="w-full mt-1 bg-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              {SERIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {isAdmin && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Responsável Interno</label>
              <select value={responsavelInternoId} onChange={e => setResponsavelInternoId(e.target.value)} className="w-full mt-1 bg-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {profiles.filter(p => p.active).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor Estimado (R$)</label>
            <input type="number" value={valorEstimado} onChange={e => setValorEstimado(e.target.value)} placeholder="Ex: 1500" className="w-full mt-1 bg-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <button onClick={handleSubmit} disabled={submitting} className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold active:scale-[0.98] transition-transform hover:opacity-90 mt-2 disabled:opacity-50">
            {submitting ? 'Cadastrando...' : 'Cadastrar Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}
