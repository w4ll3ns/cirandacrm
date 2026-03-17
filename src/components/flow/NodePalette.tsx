import { Play, MessageCircle, ListOrdered, TextCursorInput, GitBranch, Building2, UserPlus, HeadphonesIcon, Edit3, ClipboardList, Square } from 'lucide-react';

const blocks = [
  { type: 'start', label: 'Início', icon: Play, color: 'text-emerald-600 bg-emerald-50' },
  { type: 'send_message', label: 'Enviar Mensagem', icon: MessageCircle, color: 'text-blue-600 bg-blue-50' },
  { type: 'question_options', label: 'Pergunta com Opções', icon: ListOrdered, color: 'text-violet-600 bg-violet-50' },
  { type: 'capture_input', label: 'Capturar Resposta', icon: TextCursorInput, color: 'text-amber-600 bg-amber-50' },
  { type: 'condition', label: 'Condição', icon: GitBranch, color: 'text-orange-600 bg-orange-50' },
  { type: 'route_sector', label: 'Encaminhar Setor', icon: Building2, color: 'text-teal-600 bg-teal-50' },
  { type: 'assign_agent', label: 'Atribuir Atendente', icon: UserPlus, color: 'text-indigo-600 bg-indigo-50' },
  { type: 'transfer_human', label: 'Transferir Humano', icon: HeadphonesIcon, color: 'text-rose-600 bg-rose-50' },
  { type: 'update_field', label: 'Atualizar Campo', icon: Edit3, color: 'text-slate-600 bg-slate-50' },
  { type: 'create_task', label: 'Criar Tarefa', icon: ClipboardList, color: 'text-cyan-600 bg-cyan-50' },
  { type: 'end', label: 'Encerrar Fluxo', icon: Square, color: 'text-red-600 bg-red-50' },
];

export default function NodePalette() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow-type', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-56 bg-card border-r border-border overflow-y-auto p-3 space-y-1.5">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Blocos</h3>
      {blocks.map(({ type, label, icon: Icon, color }) => (
        <div
          key={type}
          draggable
          onDragStart={(e) => onDragStart(e, type)}
          className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background hover:bg-muted cursor-grab active:cursor-grabbing transition-colors"
        >
          <div className={`p-1 rounded-md ${color}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-medium text-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}
