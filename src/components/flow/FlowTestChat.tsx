import { useState, useCallback, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, RotateCcw } from 'lucide-react';
import type { Node, Edge } from '@xyflow/react';

interface FlowTestChatProps {
  open: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
  onHighlightNode?: (nodeId: string | null) => void;
}

interface ChatMessage {
  id: string;
  from: 'bot' | 'user';
  text: string;
}

export default function FlowTestChat({ open, onClose, nodes, edges, onHighlightNode }: FlowTestChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [context, setContext] = useState<Record<string, any>>({});
  const [finished, setFinished] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const addMsg = useCallback((from: 'bot' | 'user', text: string) => {
    setMessages(prev => [...prev, { id: `${Date.now()}_${Math.random()}`, from, text }]);
  }, []);

  const getNodeData = (node: Node) => node.data as any;

  const findOutEdges = useCallback((nodeId: string) => {
    return edges
      .filter(e => e.source === nodeId)
      .sort((a, b) => ((a.data as any)?.priority_order || 0) - ((b.data as any)?.priority_order || 0));
  }, [edges]);

  const findNode = useCallback((nodeId: string) => nodes.find(n => n.id === nodeId), [nodes]);

  const processNode = useCallback((nodeId: string, ctx: Record<string, any>) => {
    const node = findNode(nodeId);
    if (!node) { setFinished(true); return; }

    const data = getNodeData(node);
    onHighlightNode?.(nodeId);

    if (data.nodeType === 'start') {
      const outEdges = findOutEdges(nodeId);
      if (outEdges[0]) {
        setTimeout(() => processNode(outEdges[0].target, ctx), 300);
      } else {
        setFinished(true);
      }
    } else if (data.nodeType === 'send_message') {
      const msg = replaceVars(data.config?.message || '(mensagem vazia)', ctx);
      addMsg('bot', msg);
      const outEdges = findOutEdges(nodeId);
      if (outEdges[0]) {
        setTimeout(() => processNode(outEdges[0].target, ctx), 600);
      } else {
        setFinished(true);
      }
    } else if (data.nodeType === 'question_options') {
      const options: any[] = data.config?.options || [];
      let text = data.config?.question || '';
      options.forEach((opt: any, i: number) => { text += `\n${i + 1}. ${opt.label}`; });
      addMsg('bot', replaceVars(text, ctx));
      setCurrentNodeId(nodeId);
      setWaiting(true);
    } else if (data.nodeType === 'capture_input') {
      const prompt = data.config?.prompt || 'Por favor, informe:';
      addMsg('bot', replaceVars(prompt, ctx));
      setCurrentNodeId(nodeId);
      setWaiting(true);
    } else if (data.nodeType === 'condition') {
      const condVar = data.config?.variable || '';
      const condValue = ctx.variables?.[condVar] || ctx[condVar] || '';
      const outEdges = findOutEdges(nodeId);
      let nextId: string | null = null;
      for (const edge of outEdges) {
        const ed = edge.data as any;
        if (!ed?.condition_type || ed.condition_type === 'default') {
          if (!nextId) nextId = edge.target;
          continue;
        }
        const cv = ed.condition_value || '';
        let match = false;
        switch (ed.condition_type) {
          case 'equals': match = String(condValue).toLowerCase() === cv.toLowerCase(); break;
          case 'not_equals': match = String(condValue).toLowerCase() !== cv.toLowerCase(); break;
          case 'contains': match = String(condValue).toLowerCase().includes(cv.toLowerCase()); break;
          case 'empty': match = !condValue; break;
          case 'not_empty': match = !!condValue; break;
        }
        if (match) { nextId = edge.target; break; }
      }
      if (nextId) setTimeout(() => processNode(nextId!, ctx), 300);
      else setFinished(true);
    } else if (data.nodeType === 'route_sector') {
      addMsg('bot', `📋 [Encaminhado para setor: ${data.config?.sector || 'comercial'}]`);
      const outEdges = findOutEdges(nodeId);
      if (outEdges[0]) setTimeout(() => processNode(outEdges[0].target, ctx), 400);
      else setFinished(true);
    } else if (data.nodeType === 'assign_agent') {
      addMsg('bot', `👤 [Atribuído a atendente]`);
      const outEdges = findOutEdges(nodeId);
      if (outEdges[0]) setTimeout(() => processNode(outEdges[0].target, ctx), 400);
      else setFinished(true);
    } else if (data.nodeType === 'transfer_human') {
      const msg = data.config?.message || 'Transferindo para um atendente.';
      addMsg('bot', replaceVars(msg, ctx));
      addMsg('bot', '🔄 [Transferido para humano — fluxo encerrado]');
      setFinished(true);
    } else if (data.nodeType === 'create_task') {
      addMsg('bot', `✅ [Tarefa criada: ${data.config?.title || 'Nova tarefa'}]`);
      const outEdges = findOutEdges(nodeId);
      if (outEdges[0]) setTimeout(() => processNode(outEdges[0].target, ctx), 400);
      else setFinished(true);
    } else if (data.nodeType === 'update_field') {
      addMsg('bot', `📝 [Campo atualizado: ${data.config?.field} = ${data.config?.value}]`);
      const outEdges = findOutEdges(nodeId);
      if (outEdges[0]) setTimeout(() => processNode(outEdges[0].target, ctx), 400);
      else setFinished(true);
    } else if (data.nodeType === 'end') {
      addMsg('bot', '🏁 [Fluxo encerrado]');
      setFinished(true);
    } else {
      const outEdges = findOutEdges(nodeId);
      if (outEdges[0]) setTimeout(() => processNode(outEdges[0].target, ctx), 300);
      else setFinished(true);
    }
  }, [findNode, findOutEdges, addMsg, onHighlightNode]);

  const start = useCallback(() => {
    setMessages([]);
    setFinished(false);
    setWaiting(false);
    setInput('');
    const ctx = { nome_contato: 'Teste', telefone: '11999999999', setor: 'comercial', canal: 'whatsapp', variables: {} };
    setContext(ctx);

    const startNode = nodes.find(n => (n.data as any).nodeType === 'start');
    if (!startNode) {
      addMsg('bot', '⚠️ Nenhum bloco "Início" encontrado no fluxo.');
      setFinished(true);
      return;
    }
    addMsg('bot', '▶️ Simulação iniciada...');
    setTimeout(() => processNode(startNode.id, ctx), 400);
  }, [nodes, processNode, addMsg]);

  useEffect(() => {
    if (open) start();
    else onHighlightNode?.(null);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !waiting || !currentNodeId) return;
    const text = input.trim();
    setInput('');
    addMsg('user', text);
    setWaiting(false);

    const node = findNode(currentNodeId);
    if (!node) return;
    const data = getNodeData(node);

    if (data.nodeType === 'question_options') {
      const options: any[] = data.config?.options || [];
      const inputLower = text.toLowerCase();
      const matched = options.find((opt: any, idx: number) => {
        return inputLower === String(idx + 1) || inputLower === (opt.value || '').toLowerCase() || inputLower === (opt.label || '').toLowerCase();
      });
      if (!matched) {
        addMsg('bot', data.config?.invalid_message || 'Opção inválida. Tente novamente.');
        setWaiting(true);
        return;
      }
      const newCtx = { ...context, variables: { ...context.variables, [`option_${node.id}`]: matched.value || matched.label } };
      setContext(newCtx);
      const outEdges = findOutEdges(currentNodeId);
      const matchedEdge = outEdges.find(e => e.sourceHandle === (matched.value || matched.label)) || outEdges[0];
      if (matchedEdge) setTimeout(() => processNode(matchedEdge.target, newCtx), 400);
      else setFinished(true);
    } else if (data.nodeType === 'capture_input') {
      const varName = data.config?.variable_name || 'input';
      const newCtx = { ...context, variables: { ...context.variables, [varName]: text } };
      setContext(newCtx);
      const outEdges = findOutEdges(currentNodeId);
      if (outEdges[0]) setTimeout(() => processNode(outEdges[0].target, newCtx), 400);
      else setFinished(true);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-[380px] sm:w-[420px] p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle className="text-sm flex items-center justify-between">
            Simulador de Fluxo
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={start}>
              <RotateCcw className="w-3 h-3" />Reiniciar
            </Button>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4 py-3">
          <div className="space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  msg.from === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {finished && (
              <p className="text-center text-xs text-muted-foreground py-2">Simulação encerrada</p>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-border p-3 flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={waiting ? 'Digite sua resposta...' : 'Aguardando...'}
            disabled={!waiting || finished}
            className="text-sm h-9"
          />
          <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend} disabled={!waiting || finished || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function replaceVars(text: string, ctx: Record<string, any>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => ctx.variables?.[key] || ctx[key] || `{{${key}}}`);
}
