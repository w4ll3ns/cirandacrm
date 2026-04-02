const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `Você é um assistente especialista em copy curta para campanhas promocionais em WhatsApp e comunidades.

Sua missão é gerar mensagens curtas, diretas, persuasivas, altamente engajadoras e fáceis de compartilhar.

REGRAS OBRIGATÓRIAS:
- Use linguagem popular quando apropriado
- Foco em urgência, escassez, prova social, curiosidade e chamada para ação
- NUNCA invente fatos. Se houver contexto da campanha via link, use-o como base principal
- Se houver texto já escrito pelo usuário, preserve a intenção original ao melhorar
- O texto final deve ser pronto para colar no WhatsApp, com quebras de linha, emojis e asteriscos simples para negrito (*texto*)
- Frases curtas com quebra de linha
- Emojis usados de forma estratégica (não excessiva)
- CTA claro no final
- Tom de "corre agora", "última chance", "pode sair a qualquer momento", "o próximo pode ser você"

GATILHOS QUE VOCÊ DEVE SABER USAR:
- Urgência: "corre agora", "pode sair a qualquer momento", "última oportunidade", "reta final", "últimos títulos", "últimos %"
- Escassez: "resta apenas 1", "últimos disponíveis", "depois que sair, acabou"
- Prova social: "saiu mais um", "mais uma caixinha premiada encontrada", "olha esse print", "tem gente comprando e tem gente ganhando"
- Engajamento: "e se fosse você?", "já sabe o que faria com esse valor?", "vai participar ou só assistir?"
- Clique: "link abençoado", "garanta seus títulos agora", "corre no link"

LÓGICA IMPORTANTE DE PRÊMIOS:
- Prêmio instantâneo = pode sair a qualquer momento (se informado pelo contexto)
- Prêmio principal = segue na premiação principal, NÃO afirme que sai naquele momento a menos que esteja explicitamente informado
- Saiba diferenciar entre "pode sair agora" (instantâneo) e "continua concorrendo ao prêmio principal"

FORMATO:
- Pronto para WhatsApp/comunidade
- Frases curtas com quebra de linha
- Destaques com *asteriscos simples* para negrito
- Emojis estratégicos
- CTA final com espaço para link

EXEMPLOS DE REFERÊNCIA:

Exemplo 1:
"🚨 *SUA ÚLTIMA OPORTUNIDADE!* 🚨

🔥 *ESTAMOS NOS ÚLTIMOS 2% DA AÇÃO!*

*Resta apenas 1 título premiado disponível de R$ 1.000,00* 💸

Ou seja: *o próximo pode sair a qualquer momento... e pode ser o seu!*

⚠️ *Depois que sair, acabou.*

E o melhor: *além de tentar o milzão agora, você ainda continua concorrendo ao Corolla na premiação principal!* 🚗🍀

👇🏻 *Corre garantir seus títulos agora:*"

Exemplo 2:
"🎁 *E se na caixinha premiada vier R$ 1.000 pra você agora?* 💸🔥

E o melhor: *além de tentar o milzão instantâneo, você ainda continua concorrendo ao Corolla na premiação principal!* 🚗🍀

👇🏻 *Corre garantir seus títulos:*"

Exemplo 3:
"🌙 *MADRUGADA DA SORTE* 🔥

⚠️ *Último título premiado disponível!*

Pode sair *a qualquer momento* 💸

🚗 E você ainda segue concorrendo ao *Corolla na premiação principal!*

👇🏻 *Link abençoado:*"

Retorne APENAS o texto da mensagem, sem explicações, sem aspas ao redor, sem prefixos.`;

const ACTION_PROMPTS: Record<string, string> = {
  generate: 'Gere uma mensagem nova do zero para campanha promocional de WhatsApp.',
  generate_with_text: 'O usuário já escreveu o seguinte texto. Use-o como base e gere uma versão melhorada, mais persuasiva e impactante, preservando a intenção original.',
  improve: 'Reescreva o texto abaixo com mais clareza, impacto e conversão. Preserve a intenção original do usuário.',
  variation: 'Crie uma nova variação da mensagem abaixo, mudando estrutura, abertura e CTA, mas mantendo o mesmo objetivo.',
  shorten: 'Reduza a mensagem abaixo mantendo o máximo de impacto possível. Seja mais conciso.',
  stronger: 'Reescreva a mensagem abaixo aumentando o apelo emocional e a persuasão. Mais forte e convincente.',
  urgent: 'Reescreva a mensagem abaixo reforçando escassez, tempo limitado, reta final e necessidade de agir AGORA.',
  quick_suggestion: 'Gere uma mensagem curta e impactante para WhatsApp/comunidade com o tema:',
};

const SUGGESTION_THEMES: Record<string, string> = {
  bom_dia: 'Saudação de bom dia com energia, motivação e convite para participar da ação/campanha',
  boa_tarde: 'Saudação de boa tarde com convite engajador para a ação',
  boa_noite: 'Saudação de boa noite, clima de oportunidade noturna',
  ultimos_titulos: 'Últimos títulos disponíveis — escassez e urgência máxima',
  ultima_oportunidade: 'Última oportunidade de participar — reta final absoluta',
  reta_final: 'Reta final da ação — poucos títulos restantes, urgência',
  madrugada_sorte: 'Madrugada da sorte — clima noturno, misterioso, oportunidade especial',
  link_abencado: 'Link abençoado — tom espiritual/popular, fé na sorte, convite para clicar',
  urgencia: 'Urgência pura — precisa agir AGORA, tempo acabando',
  escassez: 'Escassez — poucos restantes, está acabando, últimas unidades',
  prova_social: 'Prova social — ganhadores, prints, resultados reais',
  engajamento: 'Engajamento — perguntas, interação, provocação positiva',
  comunidade: 'Mensagem para comunidade — tom coletivo, pertencimento',
  chamada_clique: 'Chamada para clique — CTA forte, direto, urgente',
  premio_instantaneo: 'Prêmio instantâneo — pode sair a qualquer momento',
  premio_principal: 'Prêmio principal — concorrendo ao grande prêmio',
  texto_imagem: 'Texto curto para acompanhar uma imagem de divulgação',
  texto_status: 'Texto curtíssimo para status do WhatsApp',
  texto_curto_comunidade: 'Texto muito curto e direto para postar na comunidade',
  texto_agressivo: 'Texto agressivo de vendas — forte, direto, sem rodeios',
  texto_popular: 'Texto popular — linguagem do povo, acessível, informal',
  texto_emocional: 'Texto emocional — toca o coração, sonho, esperança, família',
};

const TONE_MAP: Record<string, string> = {
  direto: 'Use tom direto, objetivo, sem rodeios.',
  popular: 'Use tom popular, informal, linguagem do povo.',
  urgente: 'Use tom urgente, pressão do tempo, escassez.',
  emocional: 'Use tom emocional, sonho, esperança, família.',
  agressivo: 'Use tom agressivo de vendas, muito forte e direto.',
  comunidade: 'Use tom de comunidade, pertencimento, coletivo.',
  premium: 'Use tom premium, sofisticado, exclusividade.',
};

const SIZE_MAP: Record<string, string> = {
  curto: 'Mensagem curta: máximo 3-4 linhas.',
  medio: 'Mensagem média: 5-8 linhas.',
  longo: 'Mensagem longa: 8-15 linhas, mais detalhada.',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action, currentText, tone, size, linkContext, suggestionType } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'action é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build user prompt
    let userPrompt = '';

    // Add link context if available
    if (linkContext && (linkContext.title || linkContext.description)) {
      userPrompt += `CONTEXTO DA CAMPANHA (extraído do link da ação atual):\n`;
      if (linkContext.title) userPrompt += `- Título: ${linkContext.title}\n`;
      if (linkContext.description) userPrompt += `- Descrição: ${linkContext.description}\n`;
      userPrompt += `Use essas informações para contextualizar a mensagem.\n\n`;
    }

    // Add tone instruction
    if (tone && TONE_MAP[tone]) {
      userPrompt += `TOM: ${TONE_MAP[tone]}\n`;
    }

    // Add size instruction
    if (size && SIZE_MAP[size]) {
      userPrompt += `TAMANHO: ${SIZE_MAP[size]}\n`;
    }

    // Build action-specific prompt
    if (action === 'quick_suggestion' && suggestionType) {
      const theme = SUGGESTION_THEMES[suggestionType] || suggestionType;
      userPrompt += `\n${ACTION_PROMPTS.quick_suggestion} ${theme}`;
    } else if (action === 'generate' && currentText?.trim()) {
      userPrompt += `\n${ACTION_PROMPTS.generate_with_text}\n\nTexto do usuário:\n${currentText}`;
    } else if (action === 'generate') {
      userPrompt += `\n${ACTION_PROMPTS.generate}`;
    } else if (ACTION_PROMPTS[action]) {
      userPrompt += `\n${ACTION_PROMPTS[action]}`;
      if (currentText?.trim()) {
        userPrompt += `\n\nTexto atual:\n${currentText}`;
      }
    } else {
      return new Response(
        JSON.stringify({ error: `Ação desconhecida: ${action}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI Copy Generator - action:', action, 'tone:', tone, 'size:', size);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI error:', response.status, errorData);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições atingido. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402 || response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Problema com a chave da API OpenAI. Verifique se está válida e com saldo.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Erro ao gerar texto com IA. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content?.trim() || '';

    if (!generatedText) {
      return new Response(
        JSON.stringify({ error: 'A IA não retornou nenhum texto. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ text: generatedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('AI Copy Generator error:', error);
    return new Response(
      JSON.stringify({ error: 'Não foi possível gerar a mensagem agora. Tente novamente.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
