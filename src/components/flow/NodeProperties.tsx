import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { X, Plus, Trash2 } from 'lucide-react';
import { nodeLabels } from './FlowNodeTypes';
import { useProfiles } from '@/hooks/useProfiles';

interface NodePropertiesProps {
  node: any;
  onUpdate: (nodeId: string, data: any) => void;
  onClose: () => void;
}

export default function NodeProperties({ node, onUpdate, onClose }: NodePropertiesProps) {
  const { profiles } = useProfiles();
  const nodeType = node.data?.nodeType || 'start';
  const config = node.data?.config || {};

  const updateConfig = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    onUpdate(node.id, { ...node.data, config: newConfig, subtitle: getSubtitle(nodeType, newConfig) });
  };

  const updateLabel = (label: string) => {
    onUpdate(node.id, { ...node.data, label });
  };

  return (
    <div className="w-72 bg-card border-l border-border overflow-y-auto flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="text-sm font-bold">{nodeLabels[nodeType] || 'Propriedades'}</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      <div className="p-3 space-y-4 flex-1">
        <div>
          <Label className="text-xs">Título do bloco</Label>
          <Input value={node.data?.label || ''} onChange={(e) => updateLabel(e.target.value)} className="mt-1 text-sm" />
        </div>

        {nodeType === 'start' && <StartProps config={config} onChange={updateConfig} />}
        {nodeType === 'send_message' && <SendMessageProps config={config} onChange={updateConfig} />}
        {nodeType === 'question_options' && <QuestionProps config={config} onChange={updateConfig} onUpdate={onUpdate} node={node} />}
        {nodeType === 'capture_input' && <CaptureProps config={config} onChange={updateConfig} />}
        {nodeType === 'condition' && <ConditionProps config={config} onChange={updateConfig} />}
        {nodeType === 'route_sector' && <RouteSectorProps config={config} onChange={updateConfig} />}
        {nodeType === 'assign_agent' && <AssignAgentProps config={config} onChange={updateConfig} profiles={profiles} />}
        {nodeType === 'transfer_human' && <TransferProps config={config} onChange={updateConfig} />}
        {nodeType === 'update_field' && <UpdateFieldProps config={config} onChange={updateConfig} />}
        {nodeType === 'create_task' && <CreateTaskProps config={config} onChange={updateConfig} profiles={profiles} />}
        {nodeType === 'end' && <EndProps config={config} onChange={updateConfig} />}
      </div>

      <div className="p-3 border-t border-border">
        <p className="text-[10px] text-muted-foreground">
          Variáveis: {'{{nome_contato}}'}, {'{{telefone}}'}, {'{{setor}}'}
        </p>
      </div>
    </div>
  );
}

function getSubtitle(type: string, config: any): string {
  switch (type) {
    case 'send_message': return config.message?.slice(0, 30) || '';
    case 'question_options': return `${(config.options || []).length} opções`;
    case 'route_sector': return config.sector || '';
    case 'end': return config.close_conversation === false ? 'Manter aberta' : 'Encerrar';
    default: return '';
  }
}

function StartProps({ config, onChange }: any) {
  return (
    <>
      <div>
        <Label className="text-xs">Tipo de gatilho</Label>
        <Select value={config.trigger_type || 'new_conversation'} onValueChange={(v) => onChange('trigger_type', v)}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="new_conversation">Nova conversa</SelectItem>
            <SelectItem value="first_message">Primeira mensagem</SelectItem>
            <SelectItem value="keyword">Palavra-chave</SelectItem>
            <SelectItem value="no_assignee">Sem atendente</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {config.trigger_type === 'keyword' && (
        <div>
          <Label className="text-xs">Palavras-chave (separadas por vírgula)</Label>
          <Input value={(config.keywords || []).join(', ')} onChange={(e) => onChange('keywords', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} className="mt-1 text-sm" />
        </div>
      )}
    </>
  );
}

function SendMessageProps({ config, onChange }: any) {
  return (
    <div>
      <Label className="text-xs">Mensagem</Label>
      <Textarea value={config.message || ''} onChange={(e) => onChange('message', e.target.value)} className="mt-1 text-sm min-h-[100px]" placeholder="Digite a mensagem..." />
    </div>
  );
}

function QuestionProps({ config, onChange, onUpdate, node }: any) {
  const options = config.options || [];

  const addOption = () => {
    const newOpts = [...options, { label: `Opção ${options.length + 1}`, value: `opcao_${options.length + 1}` }];
    const newConfig = { ...config, options: newOpts };
    onUpdate(node.id, { ...node.data, config: newConfig, subtitle: `${newOpts.length} opções` });
  };

  const removeOption = (idx: number) => {
    const newOpts = options.filter((_: any, i: number) => i !== idx);
    const newConfig = { ...config, options: newOpts };
    onUpdate(node.id, { ...node.data, config: newConfig, subtitle: `${newOpts.length} opções` });
  };

  const updateOption = (idx: number, field: string, value: string) => {
    const newOpts = options.map((o: any, i: number) => i === idx ? { ...o, [field]: value } : o);
    const newConfig = { ...config, options: newOpts };
    onUpdate(node.id, { ...node.data, config: newConfig });
  };

  return (
    <>
      <div>
        <Label className="text-xs">Pergunta</Label>
        <Textarea value={config.question || ''} onChange={(e) => onChange('question', e.target.value)} className="mt-1 text-sm" placeholder="Qual o motivo do contato?" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs">Opções</Label>
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={addOption}><Plus className="w-3 h-3 mr-1" />Adicionar</Button>
        </div>
        {options.map((opt: any, idx: number) => (
          <div key={idx} className="flex gap-1 mb-1.5">
            <Input value={opt.label} onChange={(e) => updateOption(idx, 'label', e.target.value)} className="text-xs flex-1" placeholder="Texto" />
            <Input value={opt.value} onChange={(e) => updateOption(idx, 'value', e.target.value)} className="text-xs w-20" placeholder="Valor" />
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeOption(idx)}><Trash2 className="w-3 h-3" /></Button>
          </div>
        ))}
      </div>
      <div>
        <Label className="text-xs">Máximo de tentativas</Label>
        <Input type="number" value={config.max_retries || 3} onChange={(e) => onChange('max_retries', Number(e.target.value))} className="mt-1 text-sm w-20" />
      </div>
      <div>
        <Label className="text-xs">Mensagem de opção inválida</Label>
        <Input value={config.invalid_message || ''} onChange={(e) => onChange('invalid_message', e.target.value)} className="mt-1 text-sm" placeholder="Opção inválida..." />
      </div>
    </>
  );
}

function CaptureProps({ config, onChange }: any) {
  return (
    <>
      <div>
        <Label className="text-xs">Nome da variável</Label>
        <Input value={config.variable_name || ''} onChange={(e) => onChange('variable_name', e.target.value)} className="mt-1 text-sm" placeholder="nome_aluno" />
      </div>
      <div>
        <Label className="text-xs">Tipo esperado</Label>
        <Select value={config.expected_type || 'text'} onValueChange={(v) => onChange('expected_type', v)}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Texto</SelectItem>
            <SelectItem value="number">Número</SelectItem>
            <SelectItem value="email">E-mail</SelectItem>
            <SelectItem value="cpf">CPF</SelectItem>
            <SelectItem value="telefone">Telefone</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Mensagem de prompt</Label>
        <Textarea value={config.prompt || ''} onChange={(e) => onChange('prompt', e.target.value)} className="mt-1 text-sm" placeholder="Por favor, informe..." />
      </div>
      <div>
        <Label className="text-xs">Mensagem de erro</Label>
        <Input value={config.error_message || ''} onChange={(e) => onChange('error_message', e.target.value)} className="mt-1 text-sm" placeholder="Formato inválido..." />
      </div>
    </>
  );
}

function ConditionProps({ config, onChange }: any) {
  return (
    <>
      <div>
        <Label className="text-xs">Variável</Label>
        <Input value={config.variable || ''} onChange={(e) => onChange('variable', e.target.value)} className="mt-1 text-sm" placeholder="setor, canal, nome_contato..." />
      </div>
      <div>
        <Label className="text-xs">Operador</Label>
        <Select value={config.operator || 'equals'} onValueChange={(v) => onChange('operator', v)}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">Igual</SelectItem>
            <SelectItem value="not_equals">Diferente</SelectItem>
            <SelectItem value="contains">Contém</SelectItem>
            <SelectItem value="empty">Vazio</SelectItem>
            <SelectItem value="not_empty">Não vazio</SelectItem>
            <SelectItem value="greater_than">Maior que</SelectItem>
            <SelectItem value="less_than">Menor que</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Valor</Label>
        <Input value={config.value || ''} onChange={(e) => onChange('value', e.target.value)} className="mt-1 text-sm" />
      </div>
    </>
  );
}

function RouteSectorProps({ config, onChange }: any) {
  return (
    <div>
      <Label className="text-xs">Setor</Label>
      <Select value={config.sector || 'comercial'} onValueChange={(v) => onChange('sector', v)}>
        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="comercial">Comercial</SelectItem>
          <SelectItem value="secretaria">Secretaria</SelectItem>
          <SelectItem value="financeiro">Financeiro</SelectItem>
          <SelectItem value="pedagogico">Pedagógico</SelectItem>
          <SelectItem value="direcao">Direção</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function AssignAgentProps({ config, onChange, profiles }: any) {
  return (
    <>
      <div>
        <Label className="text-xs">Modo</Label>
        <Select value={config.mode || 'manual'} onValueChange={(v) => onChange('mode', v)}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="auto">Automático</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {config.mode === 'manual' && (
        <div>
          <Label className="text-xs">Atendente</Label>
          <Select value={config.agent_id || ''} onValueChange={(v) => onChange('agent_id', v)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
            <SelectContent>
              {(profiles || []).map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
}

function TransferProps({ config, onChange }: any) {
  return (
    <div>
      <Label className="text-xs">Mensagem de transição</Label>
      <Textarea value={config.message || ''} onChange={(e) => onChange('message', e.target.value)} className="mt-1 text-sm" placeholder="Transferindo para um atendente..." />
    </div>
  );
}

function UpdateFieldProps({ config, onChange }: any) {
  return (
    <>
      <div>
        <Label className="text-xs">Campo</Label>
        <Select value={config.field || 'status'} onValueChange={(v) => onChange('field', v)}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="setor">Setor</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Valor</Label>
        <Input value={config.value || ''} onChange={(e) => onChange('value', e.target.value)} className="mt-1 text-sm" />
      </div>
    </>
  );
}

function CreateTaskProps({ config, onChange, profiles }: any) {
  return (
    <>
      <div>
        <Label className="text-xs">Título</Label>
        <Input value={config.title || ''} onChange={(e) => onChange('title', e.target.value)} className="mt-1 text-sm" placeholder="Follow-up {{nome_contato}}" />
      </div>
      <div>
        <Label className="text-xs">Descrição</Label>
        <Textarea value={config.description || ''} onChange={(e) => onChange('description', e.target.value)} className="mt-1 text-sm" />
      </div>
      <div>
        <Label className="text-xs">Prioridade</Label>
        <Select value={config.priority || 'media'} onValueChange={(v) => onChange('priority', v)}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="baixa">Baixa</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="urgente">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Responsável</Label>
        <Select value={config.assignee_id || ''} onValueChange={(v) => onChange('assignee_id', v)}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
          <SelectContent>
            {(profiles || []).map((p: any) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Prazo (dias)</Label>
        <Input type="number" value={config.due_days || ''} onChange={(e) => onChange('due_days', e.target.value)} className="mt-1 text-sm w-20" />
      </div>
    </>
  );
}

function EndProps({ config, onChange }: any) {
  return (
    <>
      <div>
        <Label className="text-xs">Mensagem final (opcional)</Label>
        <Textarea value={config.message || ''} onChange={(e) => onChange('message', e.target.value)} className="mt-1 text-sm" placeholder="Obrigado pelo contato!" />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={config.close_conversation !== false} onCheckedChange={(v) => onChange('close_conversation', v)} />
        <Label className="text-xs">Encerrar conversa</Label>
      </div>
    </>
  );
}
