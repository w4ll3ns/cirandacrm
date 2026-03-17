// Types aligned with database schema

export type AppRole = 'admin' | 'atendente' | 'gestor';

export type Origem = 'instagram' | 'indicacao' | 'google' | 'site' | 'panfleto' | 'facebook' | 'whatsapp' | 'outro';

export interface Responsavel {
  id: string;
  nome: string;
  telefone: string;
  whatsapp: string | null;
  email: string | null;
  cpf: string | null;
  endereco: string | null;
  observacoes: string | null;
  origem: Origem | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Aluno {
  id: string;
  nome: string;
  data_nascimento: string | null;
  serie_interesse: string | null;
  unidade_interesse: string | null;
  responsavel_id: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export type EtapaPipeline = 'novo_lead' | 'primeiro_contato' | 'qualificado' | 'visita_agendada' | 'proposta_valores' | 'documentacao' | 'matricula_fechada' | 'perdido';
export type Temperatura = 'quente' | 'morno' | 'frio';
export type StatusOportunidade = 'aberta' | 'ganha' | 'perdida';

export interface OportunidadeMatricula {
  id: string;
  responsavel_id: string;
  aluno_id: string | null;
  etapa: EtapaPipeline;
  temperatura: string | null;
  status: StatusOportunidade;
  valor_estimado: number | null;
  proximo_followup_em: string | null;
  responsavel_interno_id: string | null;
  motivo_perda: string | null;
  notas: string | null;
  origem: Origem | null;
  created_at: string;
  updated_at: string;
}

export type CanalType = 'whatsapp' | 'telefone' | 'email' | 'presencial' | 'site' | 'instagram' | 'facebook';
export type ConversationStatus = 'nao_lida' | 'aguardando' | 'em_atendimento' | 'resolvida' | 'arquivada';
export type SetorType = 'comercial' | 'secretaria' | 'financeiro' | 'pedagogico' | 'direcao';

export interface Conversa {
  id: string;
  responsavel_id: string;
  status: ConversationStatus;
  canal: CanalType;
  setor: SetorType | null;
  telefone: string | null;
  ultima_mensagem_em: string | null;
  assigned_user_id: string | null;
  oportunidade_id: string | null;
  created_at: string;
  updated_at: string;
}

export type MessageDirection = 'inbound' | 'outbound';
export type SenderType = 'responsavel' | 'sistema' | 'usuario';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageType = 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'location' | 'contact';

export interface Mensagem {
  id: string;
  conversation_id: string;
  direction: MessageDirection;
  content_text: string | null;
  sender_type: SenderType;
  type: MessageType;
  status: MessageStatus;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  media_url: string | null;
  media_mime_type: string | null;
  media_filename: string | null;
  external_message_id: string | null;
  created_at: string;
}

export type TaskStatus = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
export type TaskPriority = 'baixa' | 'media' | 'alta' | 'urgente';
export type TipoTarefa = 'enviar_mensagem' | 'agendar_visita' | 'enviar_proposta' | 'reunir_documentos' | 'pos_matricula' | 'followup';

export interface Tarefa {
  id: string;
  titulo: string;
  tipo: string | null;
  descricao: string | null;
  due_date: string | null;
  status: TaskStatus;
  prioridade: TaskPriority;
  responsavel_interno_id: string | null;
  responsavel_id: string | null;
  aluno_id: string | null;
  oportunidade_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssignmentHistory {
  id: string;
  conversation_id: string;
  previous_user_id: string | null;
  new_user_id: string | null;
  changed_by: string | null;
  motivo: string | null;
  created_at: string;
}

export const ETAPA_LABELS: Record<EtapaPipeline, string> = {
  novo_lead: 'Novo Lead',
  primeiro_contato: 'Primeiro Contato',
  qualificado: 'Qualificado',
  visita_agendada: 'Visita Agendada',
  proposta_valores: 'Proposta/Valores',
  documentacao: 'Documentação',
  matricula_fechada: 'Matrícula Fechada',
  perdido: 'Perdido',
};

export const ETAPAS_ORDER: EtapaPipeline[] = [
  'novo_lead', 'primeiro_contato', 'qualificado', 'visita_agendada',
  'proposta_valores', 'documentacao', 'matricula_fechada', 'perdido',
];

export const TEMPERATURA_LABELS: Record<Temperatura, string> = {
  quente: 'Quente',
  morno: 'Morno',
  frio: 'Frio',
};

export const ORIGEM_LABELS: Record<Origem, string> = {
  instagram: 'Instagram',
  indicacao: 'Indicação',
  google: 'Google',
  site: 'Site',
  panfleto: 'Panfleto',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  outro: 'Outro',
};

export const TIPO_TAREFA_LABELS: Record<string, string> = {
  enviar_mensagem: 'Enviar Mensagem',
  agendar_visita: 'Agendar Visita',
  enviar_proposta: 'Enviar Proposta',
  reunir_documentos: 'Reunir Documentos',
  pos_matricula: 'Pós-matrícula',
  followup: 'Follow-up',
};
