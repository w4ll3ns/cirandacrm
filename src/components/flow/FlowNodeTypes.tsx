import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Play, MessageCircle, ListOrdered, TextCursorInput, GitBranch, Building2, UserPlus, HeadphonesIcon, Edit3, ClipboardList, Square } from 'lucide-react';

const nodeStyles: Record<string, { icon: any; color: string; bg: string }> = {
  start: { icon: Play, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-300' },
  send_message: { icon: MessageCircle, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-300' },
  question_options: { icon: ListOrdered, color: 'text-violet-700', bg: 'bg-violet-50 border-violet-300' },
  capture_input: { icon: TextCursorInput, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-300' },
  condition: { icon: GitBranch, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-300' },
  route_sector: { icon: Building2, color: 'text-teal-700', bg: 'bg-teal-50 border-teal-300' },
  assign_agent: { icon: UserPlus, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-300' },
  transfer_human: { icon: HeadphonesIcon, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-300' },
  update_field: { icon: Edit3, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-300' },
  create_task: { icon: ClipboardList, color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-300' },
  end: { icon: Square, color: 'text-red-700', bg: 'bg-red-50 border-red-300' },
};

const nodeLabels: Record<string, string> = {
  start: 'Início',
  send_message: 'Enviar Mensagem',
  question_options: 'Pergunta com Opções',
  capture_input: 'Capturar Resposta',
  condition: 'Condição',
  route_sector: 'Encaminhar Setor',
  assign_agent: 'Atribuir Atendente',
  transfer_human: 'Transferir Humano',
  update_field: 'Atualizar Campo',
  create_task: 'Criar Tarefa',
  end: 'Encerrar Fluxo',
};

function FlowNode({ data, selected }: NodeProps) {
  const nodeType = (data.nodeType as string) || 'start';
  const style = nodeStyles[nodeType] || nodeStyles.start;
  const Icon = style.icon;
  const title = (data.label as string) || nodeLabels[nodeType] || nodeType;
  const subtitle = (data.subtitle as string) || '';

  const hasOptions = nodeType === 'question_options';
  const options: any[] = (data.config as any)?.options || [];
  const hasCondition = nodeType === 'condition';

  return (
    <div className={`rounded-xl border-2 shadow-sm min-w-[180px] max-w-[240px] ${style.bg} ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
      {nodeType !== 'start' && (
        <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
      )}

      <div className="px-3 py-2 flex items-center gap-2">
        <div className={`p-1.5 rounded-lg bg-background/60 ${style.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate text-foreground">{title}</p>
          {subtitle && <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>}
        </div>
      </div>

      {hasOptions && options.length > 0 && (
        <div className="px-3 pb-2 space-y-1">
          {options.map((opt: any, idx: number) => (
            <div key={idx} className="relative">
              <div className="text-[10px] bg-background/50 rounded px-1.5 py-0.5 text-muted-foreground truncate">
                {idx + 1}. {opt.label}
              </div>
              <Handle
                type="source"
                position={Position.Right}
                id={opt.value || opt.label}
                style={{ top: 'auto', bottom: 'auto' }}
                className="!w-2.5 !h-2.5 !bg-violet-500 !border-2 !border-background !-right-[5px]"
              />
            </div>
          ))}
        </div>
      )}

      {hasCondition && (
        <div className="px-3 pb-2">
          <div className="flex gap-1">
            <span className="text-[9px] bg-emerald-100 text-emerald-700 rounded px-1">Sim</span>
            <span className="text-[9px] bg-red-100 text-red-700 rounded px-1">Não</span>
          </div>
        </div>
      )}

      {nodeType !== 'end' && !hasOptions && (
        <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-primary !border-2 !border-background" />
      )}

      {hasCondition && (
        <>
          <Handle type="source" position={Position.Right} id="true" className="!w-2.5 !h-2.5 !bg-emerald-500 !border-2 !border-background" />
          <Handle type="source" position={Position.Left} id="false" className="!w-2.5 !h-2.5 !bg-red-500 !border-2 !border-background" />
        </>
      )}
    </div>
  );
}

export const flowNodeTypes = {
  flowNode: memo(FlowNode),
};

export { nodeLabels, nodeStyles };
