export type Perfil = 'admin' | 'secretaria' | 'comercial';

export interface UsuarioInterno {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
  avatar?: string;
  criado_em: string;
  atualizado_em: string;
}

export type StatusRelacionamento = 'lead' | 'matriculado' | 'ex-aluno' | 'interessado';
export type Origem = 'instagram' | 'indicacao' | 'google' | 'site' | 'panfleto' | 'facebook' | 'whatsapp';

export interface Responsavel {
  id: string;
  nome: string;
  telefone: string;
  whatsapp: string;
  email?: string;
  endereco?: string;
  origem: Origem;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  tags: string[];
  status_relacionamento: StatusRelacionamento;
  criado_em: string;
  atualizado_em: string;
}

export type StatusAluno = 'interessado' | 'em_negociacao' | 'matriculado' | 'ex_aluno';

export interface Aluno {
  id: string;
  nome: string;
  data_nascimento: string;
  serie_turma_interesse: string;
  status: StatusAluno;
  responsavel_id: string;
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
}

export type EtapaPipeline = 'novo_lead' | 'primeiro_contato' | 'qualificado' | 'visita_agendada' | 'proposta_valores' | 'documentacao' | 'matricula_fechada' | 'perdido';
export type Temperatura = 'quente' | 'morno' | 'frio';
export type StatusOportunidade = 'aberta' | 'ganha' | 'perdida';

export interface OportunidadeMatricula {
  id: string;
  responsavel_id: string;
  aluno_id: string;
  etapa: EtapaPipeline;
  temperatura: Temperatura;
  status: StatusOportunidade;
  valor_estimado?: number;
  proximo_followup_em?: string;
  responsavel_interno_id: string;
  motivo_perda?: string;
  notas?: string;
  criado_em: string;
  atualizado_em: string;
}

export type StatusConversa = 'nao_lida' | 'aguardando' | 'resolvida' | 'arquivada';

export interface HistoricoAtendente {
  usuario_id: string;
  inicio_em: string;
  fim_em?: string;
}

export interface Conversa {
  id: string;
  responsavel_id: string;
  status: StatusConversa;
  ultima_mensagem_em: string;
  responsavel_interno_id: string;
  historico_atendentes: HistoricoAtendente[];
  criado_em: string;
  atualizado_em: string;
}

export type DirecaoMensagem = 'inbound' | 'outbound';

export interface Mensagem {
  id: string;
  conversa_id: string;
  direcao: DirecaoMensagem;
  texto: string;
  anexo_placeholder?: string;
  enviada_em: string;
  lida: boolean;
  criado_em: string;
}

export type StatusTarefa = 'pendente' | 'concluida' | 'atrasada';
export type PrioridadeTarefa = 'baixa' | 'media' | 'alta';
export type TipoTarefa = 'enviar_mensagem' | 'agendar_visita' | 'enviar_proposta' | 'reunir_documentos' | 'pos_matricula' | 'followup';

export interface Tarefa {
  id: string;
  titulo: string;
  tipo: TipoTarefa;
  descricao?: string;
  data_hora: string;
  status: StatusTarefa;
  prioridade: PrioridadeTarefa;
  responsavel_interno_id: string;
  responsavel_id?: string;
  aluno_id?: string;
  oportunidade_id?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface VisitaAgendada {
  id: string;
  oportunidade_id: string;
  data_hora: string;
  formato: 'presencial' | 'online';
  status: 'agendada' | 'realizada' | 'cancelada';
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
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
};

export const TIPO_TAREFA_LABELS: Record<TipoTarefa, string> = {
  enviar_mensagem: 'Enviar Mensagem',
  agendar_visita: 'Agendar Visita',
  enviar_proposta: 'Enviar Proposta',
  reunir_documentos: 'Reunir Documentos',
  pos_matricula: 'Pós-matrícula',
  followup: 'Follow-up',
};
