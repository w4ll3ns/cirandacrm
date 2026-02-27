import type {
  UsuarioInterno, Responsavel, Aluno, OportunidadeMatricula,
  Conversa, Mensagem, Tarefa, Origem, EtapaPipeline, Temperatura,
  StatusAluno, StatusOportunidade, StatusConversa, StatusTarefa,
  PrioridadeTarefa, TipoTarefa, StatusRelacionamento
} from '@/types';

// ── Helpers ──
const d = (daysAgo: number, hour = 10) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - daysAgo);
  dt.setHours(hour, 0, 0, 0);
  return dt.toISOString();
};

const futureD = (daysAhead: number, hour = 10) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + daysAhead);
  dt.setHours(hour, 0, 0, 0);
  return dt.toISOString();
};

let _id = 0;
const uid = (prefix: string) => `${prefix}_${String(++_id).padStart(3, '0')}`;

// ── Usuários Internos ──
export const usuarios: UsuarioInterno[] = [
  { id: 'usr_001', nome: 'Carla Mendes', email: 'carla@cirandaabc.com.br', perfil: 'admin', ativo: true, criado_em: d(365), atualizado_em: d(1) },
  { id: 'usr_002', nome: 'Fernanda Lima', email: 'fernanda@cirandaabc.com.br', perfil: 'secretaria', ativo: true, criado_em: d(300), atualizado_em: d(1) },
  { id: 'usr_003', nome: 'Ricardo Souza', email: 'ricardo@cirandaabc.com.br', perfil: 'comercial', ativo: true, criado_em: d(200), atualizado_em: d(1) },
];

// ── Nomes brasileiros ──
const NOMES_RESP = [
  'Ana Paula Silva', 'Marcos Oliveira', 'Juliana Santos', 'Carlos Eduardo Pereira',
  'Patrícia Ferreira', 'Roberto Almeida', 'Camila Costa', 'André Rodrigues',
  'Luciana Martins', 'Fernando Nascimento', 'Beatriz Souza', 'Diego Araújo',
  'Renata Barbosa', 'Thiago Cardoso', 'Vanessa Lima', 'Gustavo Ribeiro',
  'Mariana Gomes', 'Rafael Moreira', 'Tatiane Alves', 'Bruno Carvalho',
  'Priscila Rocha', 'Leandro Monteiro', 'Adriana Vieira', 'Paulo Mendes',
  'Daniela Correia', 'Fábio Teixeira', 'Simone Nunes', 'Eduardo Pinto',
  'Cristiane Dias', 'Alexandre Machado', 'Sandra Freitas', 'Márcio Campos',
  'Aline Rezende', 'Lucas Borges', 'Viviane Castro', 'Rodrigo Xavier',
  'Elaine Duarte', 'Gabriel Lopes', 'Michele Cunha', 'Henrique Nogueira',
  'Rosana Farias', 'João Pedro Melo', 'Cláudia Assis', 'Wellington Brito',
  'Natália Paiva', 'Sérgio Amorim', 'Isabela Ramos', 'Anderson Prado',
  'Letícia Sampaio', 'Marcelo Guimarães', 'Denise Tavares', 'Vítor Hugo Andrade',
  'Jéssica Siqueira', 'Reginaldo Moura', 'Carolina Batista', 'Otávio Fonseca',
  'Lorena Azevedo', 'Nelson Coelho', 'Bianca Medeiros', 'Rogério Sales',
];

const NOMES_ALUNOS = [
  'Pedro Henrique', 'Maria Clara', 'João Gabriel', 'Ana Luísa', 'Lucas Matheus',
  'Sophia', 'Miguel', 'Isabella', 'Arthur', 'Helena', 'Bernardo', 'Valentina',
  'Heitor', 'Laura', 'Davi', 'Alice', 'Lorenzo', 'Manuela', 'Théo', 'Júlia',
  'Gabriel', 'Cecília', 'Samuel', 'Lara', 'Nicolas', 'Maria Eduarda', 'Enzo',
  'Beatriz', 'Rafael', 'Lívia', 'Joaquim', 'Mariana', 'Benjamin', 'Antonella',
  'Murilo', 'Isadora', 'Matheus', 'Emanuella', 'Cauã', 'Ana Beatriz',
];

const ORIGENS: Origem[] = ['instagram', 'indicacao', 'google', 'site', 'panfleto', 'facebook', 'whatsapp'];
const SERIES = ['Berçário', 'Maternal I', 'Maternal II', 'Jardim I', 'Jardim II', '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano'];
const MOTIVOS_PERDA = ['Sem retorno', 'Achou caro', 'Longe de casa', 'Matriculou em outra escola', 'Desistiu'];
const ETAPAS: EtapaPipeline[] = ['novo_lead', 'primeiro_contato', 'qualificado', 'visita_agendada', 'proposta_valores', 'documentacao', 'matricula_fechada', 'perdido'];
const TEMPS: Temperatura[] = ['quente', 'morno', 'frio'];
const INTERNOS = ['usr_001', 'usr_002', 'usr_003'];

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickIdx = (max: number) => Math.floor(Math.random() * max);

// Seed random for consistency
let seed = 42;
const seededRandom = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const sPick = <T>(arr: T[]): T => arr[Math.floor(seededRandom() * arr.length)];
const sPickIdx = (max: number) => Math.floor(seededRandom() * max);

// ── Responsáveis ──
export const responsaveis: Responsavel[] = NOMES_RESP.map((nome, i) => {
  const ddd = ['11', '11', '11', '21', '31', '19'][i % 6];
  const tel = `(${ddd}) 9${String(8000 + i * 137).slice(0, 4)}-${String(1000 + i * 73).slice(0, 4)}`;
  const origem = ORIGENS[i % ORIGENS.length];
  const statusArr: StatusRelacionamento[] = ['lead', 'matriculado', 'interessado', 'ex-aluno'];
  return {
    id: `resp_${String(i + 1).padStart(3, '0')}`,
    nome,
    telefone: tel,
    whatsapp: tel,
    email: i % 3 === 0 ? `${nome.split(' ')[0].toLowerCase()}@email.com` : undefined,
    origem,
    utm_source: origem === 'google' ? 'google_ads' : undefined,
    utm_medium: origem === 'google' ? 'cpc' : undefined,
    tags: i % 5 === 0 ? ['vip'] : [],
    status_relacionamento: statusArr[i % statusArr.length],
    criado_em: d(90 - i),
    atualizado_em: d(Math.max(0, 30 - i)),
  };
});

// ── Alunos ──
export const alunos: Aluno[] = NOMES_ALUNOS.map((nome, i) => {
  const statusArr: StatusAluno[] = ['interessado', 'em_negociacao', 'matriculado', 'ex_aluno'];
  const year = 2018 + (i % 7);
  const month = (i % 12) + 1;
  return {
    id: `alu_${String(i + 1).padStart(3, '0')}`,
    nome,
    data_nascimento: `${year}-${String(month).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
    serie_turma_interesse: SERIES[i % SERIES.length],
    status: statusArr[i % statusArr.length],
    responsavel_id: `resp_${String((i % 40) + 1).padStart(3, '0')}`,
    criado_em: d(80 - i),
    atualizado_em: d(Math.max(0, 20 - i)),
  };
});

// ── Oportunidades ──
export const oportunidades: OportunidadeMatricula[] = Array.from({ length: 60 }, (_, i) => {
  const etapa = ETAPAS[i % 8];
  const isPerdido = etapa === 'perdido';
  const isGanha = etapa === 'matricula_fechada';
  const status: StatusOportunidade = isPerdido ? 'perdida' : isGanha ? 'ganha' : 'aberta';
  const temp = TEMPS[i % 3];
  return {
    id: `opp_${String(i + 1).padStart(3, '0')}`,
    responsavel_id: `resp_${String((i % 50) + 1).padStart(3, '0')}`,
    aluno_id: `alu_${String((i % 40) + 1).padStart(3, '0')}`,
    etapa,
    temperatura: isPerdido ? 'frio' : temp,
    status,
    valor_estimado: 1200 + (i % 5) * 300,
    proximo_followup_em: !isPerdido && !isGanha ? futureD((i % 7) + 1) : undefined,
    responsavel_interno_id: INTERNOS[i % 3],
    motivo_perda: isPerdido ? MOTIVOS_PERDA[i % MOTIVOS_PERDA.length] : undefined,
    notas: i % 4 === 0 ? 'Interessado na turma integral.' : undefined,
    criado_em: d(60 - i),
    atualizado_em: d(Math.max(0, 15 - (i % 15))),
  };
});

// ── Conversas e Mensagens ──
const MSG_INBOUND = [
  'Olá, gostaria de saber sobre as vagas disponíveis.',
  'Qual o valor da mensalidade para o Jardim I?',
  'Vocês têm turma integral?',
  'Posso agendar uma visita para esta semana?',
  'Quais documentos preciso levar?',
  'Minha filha tem 4 anos, qual a turma indicada?',
  'Vi o anúncio no Instagram e fiquei interessada.',
  'Boa tarde! Gostaria de informações sobre matrícula.',
  'Tem desconto para irmãos?',
  'Qual o horário de funcionamento da secretaria?',
  'O uniforme é obrigatório?',
  'Como funciona a adaptação?',
  'Vocês aceitam transferência de outra escola?',
  'Tem vaga para o 2º ano ainda?',
  'Qual a formação dos professores?',
  'Achei a escola linda pelo site! Quero saber mais.',
  'Posso visitar amanhã de manhã?',
  'Quero matricular meu filho, como faço?',
  'Aceita pagamento parcelado?',
  'O lanche é incluso na mensalidade?',
];

const MSG_OUTBOUND = [
  'Olá! Obrigada pelo contato. Temos vagas sim! 😊',
  'A mensalidade do Jardim I é R$ 1.450,00. Posso enviar mais detalhes?',
  'Sim, temos turma integral das 7h às 19h.',
  'Claro! Podemos agendar para quarta-feira às 10h. Pode ser?',
  'Os documentos necessários são: RG, CPF, comprovante de residência e histórico escolar.',
  'Para 4 aninhos a turma indicada é o Jardim I. Vou enviar nosso material informativo!',
  'Fico feliz que tenha nos encontrado! Posso agendar uma visita?',
  'Boa tarde! Com prazer! Para qual série você tem interesse?',
  'Sim, temos desconto de 10% para irmãos matriculados.',
  'A secretaria funciona de segunda a sexta, das 7h30 às 17h30.',
  'O uniforme é obrigatório a partir do Jardim I.',
  'A adaptação é gradual, começamos com períodos menores.',
  'Sim, aceitamos transferência! Basta trazer o histórico escolar.',
  'Ainda temos vagas para o 2º ano! Gostaria de agendar uma visita?',
  'Todos os nossos professores têm formação superior completa.',
  'Obrigada! Quando gostaria de nos visitar?',
  'Perfeito! Amanhã às 9h está ótimo. Vou reservar.',
  'Fico feliz! O primeiro passo é a visita. Já conhece a escola?',
  'Sim, parcelamos em até 12x no cartão sem juros.',
  'O lanche pode ser enviado de casa ou contratado à parte por R$ 280/mês.',
];

export const conversas: Conversa[] = [];
export const mensagens: Mensagem[] = [];

const STATUS_CONV: StatusConversa[] = ['nao_lida', 'aguardando', 'resolvida', 'arquivada'];

for (let i = 0; i < 80; i++) {
  const convId = `conv_${String(i + 1).padStart(3, '0')}`;
  const respId = `resp_${String((i % 50) + 1).padStart(3, '0')}`;
  const daysAgo = Math.max(0, i % 30);

  conversas.push({
    id: convId,
    responsavel_id: respId,
    status: STATUS_CONV[i % 4],
    ultima_mensagem_em: d(daysAgo, 9 + (i % 10)),
    responsavel_interno_id: INTERNOS[i % 3],
    criado_em: d(daysAgo + 5),
    atualizado_em: d(daysAgo),
  });

  // 2-6 messages per conversation
  const msgCount = 2 + (i % 5);
  for (let j = 0; j < msgCount; j++) {
    const isInbound = j % 2 === 0;
    mensagens.push({
      id: `msg_${String(i * 10 + j + 1).padStart(4, '0')}`,
      conversa_id: convId,
      direcao: isInbound ? 'inbound' : 'outbound',
      texto: isInbound ? MSG_INBOUND[(i + j) % MSG_INBOUND.length] : MSG_OUTBOUND[(i + j) % MSG_OUTBOUND.length],
      enviada_em: d(daysAgo, 9 + j),
      lida: j < msgCount - 1 || !isInbound,
      criado_em: d(daysAgo, 9 + j),
    });
  }
}

// ── Tarefas ──
const TIPO_TAREFAS: TipoTarefa[] = ['enviar_mensagem', 'agendar_visita', 'enviar_proposta', 'reunir_documentos', 'pos_matricula', 'followup'];
const PRIOS: PrioridadeTarefa[] = ['baixa', 'media', 'alta'];
const TITULOS_TAREFA = [
  'Enviar valores para', 'Agendar visita com', 'Follow-up com', 'Enviar proposta para',
  'Coletar documentos de', 'Mensagem de boas-vindas para', 'Confirmar visita de',
  'Reenviar informações para', 'Verificar interesse de', 'Lembrar matrícula de',
];

export const tarefas: Tarefa[] = Array.from({ length: 120 }, (_, i) => {
  const daysOffset = i < 40 ? -(i % 10) - 1 : i < 80 ? (i % 14) + 1 : 0;
  const isPast = daysOffset < 0;
  const isToday = daysOffset === 0;
  const statusArr: StatusTarefa[] = isPast
    ? (i % 3 === 0 ? ['atrasada'] : ['concluida'])
    : isToday ? ['pendente'] : ['pendente'];
  const respNome = NOMES_RESP[(i * 3) % NOMES_RESP.length].split(' ')[0];

  return {
    id: `tar_${String(i + 1).padStart(3, '0')}`,
    titulo: `${TITULOS_TAREFA[i % TITULOS_TAREFA.length]} ${respNome}`,
    tipo: TIPO_TAREFAS[i % TIPO_TAREFAS.length],
    descricao: i % 3 === 0 ? 'Entrar em contato o mais breve possível.' : undefined,
    data_hora: daysOffset === 0 ? new Date().toISOString() : daysOffset > 0 ? futureD(daysOffset) : d(Math.abs(daysOffset)),
    status: statusArr[0],
    prioridade: PRIOS[i % 3],
    responsavel_interno_id: INTERNOS[i % 3],
    responsavel_id: `resp_${String((i % 50) + 1).padStart(3, '0')}`,
    aluno_id: i % 3 === 0 ? `alu_${String((i % 40) + 1).padStart(3, '0')}` : undefined,
    oportunidade_id: i % 2 === 0 ? `opp_${String((i % 60) + 1).padStart(3, '0')}` : undefined,
    criado_em: d(Math.abs(daysOffset) + 5),
    atualizado_em: d(Math.max(0, Math.abs(daysOffset))),
  };
});
