import { ArrowLeft, Save, Upload, Power, PowerOff, Copy, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface FlowToolbarProps {
  name: string;
  status: string;
  ativo: boolean;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onPublish: () => void;
  onToggleActive: () => void;
  onDuplicate: () => void;
  onTest: () => void;
  saving: boolean;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Rascunho', variant: 'outline' },
  active: { label: 'Ativo', variant: 'default' },
  inactive: { label: 'Inativo', variant: 'secondary' },
};

export default function FlowToolbar({ name, status, ativo, onNameChange, onSave, onPublish, onToggleActive, onDuplicate, onTest, saving }: FlowToolbarProps) {
  const navigate = useNavigate();
  const statusInfo = statusLabels[status] || statusLabels.draft;

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card shrink-0">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/app/fluxos')}>
        <ArrowLeft className="w-4 h-4" />
      </Button>

      <Input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        className="text-sm font-semibold h-8 w-48 border-none shadow-none focus-visible:ring-1"
        placeholder="Nome do fluxo"
      />

      <Badge variant={statusInfo.variant} className="text-[10px]">{statusInfo.label}</Badge>

      <div className="flex-1" />

      <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={onTest}>
        <Play className="w-3 h-3" />Testar
      </Button>
      <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={onDuplicate}>
        <Copy className="w-3 h-3" />Duplicar
      </Button>
      <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={onToggleActive}>
        {ativo ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
        {ativo ? 'Desativar' : 'Ativar'}
      </Button>
      <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={onSave} disabled={saving}>
        <Save className="w-3 h-3" />{saving ? 'Salvando...' : 'Salvar'}
      </Button>
      <Button size="sm" className="h-8 text-xs gap-1" onClick={onPublish} disabled={saving}>
        <Upload className="w-3 h-3" />Publicar
      </Button>
    </div>
  );
}
