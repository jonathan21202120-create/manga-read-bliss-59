import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images, mangaTitle, chapterNumber } = await req.json();
    
    if (!images || images.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma imagem fornecida' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    console.log(`Processando ${images.length} imagens para ${mangaTitle} - Capítulo ${chapterNumber}`);
    
    // Preparar conteúdo para o modelo de visão
    const imageNames = images.map((img: { name: string; data: string }) => img.name);
    
    // Primeiro: tentar buscar ordem correta online
    console.log('🔍 Buscando referência online para:', mangaTitle, 'Capítulo', chapterNumber);
    
    let externalReference = '';
    try {
      const searchResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: `Busque sites de scan/leitura online para a obra "${mangaTitle}" Capítulo ${chapterNumber}.
              
Retorne APENAS URLs diretas de sites de scan como:
- brmangas.net
- mangayabu.top  
- tsukimangas.com
- mangalivre.net
- unionmangas.top

Formato de resposta:
{
  "urls": ["url1", "url2"],
  "readingOrder": "left-to-right ou right-to-left",
  "notes": "observações sobre a ordem de leitura"
}`
            }
          ],
          temperature: 0.3
        })
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        const searchResult = searchData.choices?.[0]?.message?.content;
        console.log('🌐 Referência externa encontrada:', searchResult);
        externalReference = searchResult || '';
      }
    } catch (e) {
      console.warn('⚠️ Não foi possível buscar referência externa:', e);
    }

    // Preparar análise detalhada de cada imagem ANTES de enviar para o modelo
    const imageAnalysisPrompts = images.map((img: { name: string; data: string }, index: number) => ({
      type: "text",
      text: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 IMAGEM ${index + 1}/${images.length}: ${img.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANALISE VISUAL OBRIGATÓRIA DESTA IMAGEM:

1️⃣ IDENTIFICAÇÃO DA PÁGINA:
   □ É página de ABERTURA? (título do capítulo, arte elaborada, logo)
   □ É página de ENCERRAMENTO? ("FIM", "CONTINUA", créditos)
   □ É página INTERMEDIÁRIA?

2️⃣ DIÁLOGOS E TEXTOS:
   □ Liste TODOS os textos/diálogos visíveis
   □ Qual personagem está falando?
   □ O diálogo é uma PERGUNTA, RESPOSTA, CONTINUAÇÃO ou INÍCIO de conversa?
   □ Há narração/pensamento?

3️⃣ AÇÃO VISUAL:
   □ Descreva a ação principal acontecendo
   □ A ação está INICIANDO, NO MEIO ou TERMINANDO?
   □ Há continuidade com ação anterior ou posterior óbvia?

4️⃣ CENÁRIO E PERSONAGENS:
   □ Onde se passa a cena? (interior/exterior, local específico)
   □ Quais personagens estão presentes?
   □ Qual é o clima/tempo da cena? (dia/noite, luz/sombra)

5️⃣ PISTAS DE ORDENAÇÃO:
   □ Há elementos visuais que indicam "antes" ou "depois"?
   □ Há linhas de movimento/velocidade indicando direção?
   □ Há mudança de expressão facial dos personagens?
`
    }));

    const content = [
      {
        type: "text",
        text: `╔══════════════════════════════════════════════════════════════════╗
║  🎯 TAREFA CRÍTICA: ORGANIZAÇÃO PROFUNDA DE PÁGINAS DE MANGA    ║
╚══════════════════════════════════════════════════════════════════╝

📖 OBRA: ${mangaTitle}
📗 CAPÍTULO: ${chapterNumber}
📊 TOTAL DE PÁGINAS: ${images.length}

${externalReference ? `
╔══════════════════════════════════════════════════════════════════╗
║  🌐 REFERÊNCIA EXTERNA ENCONTRADA (USE COMO VALIDAÇÃO)          ║
╚══════════════════════════════════════════════════════════════════╝
${externalReference}

` : ''}

╔══════════════════════════════════════════════════════════════════╗
║  ⚠️  REGRAS ABSOLUTAS E INEGOCIÁVEIS                            ║
╚══════════════════════════════════════════════════════════════════╝

🚫 REGRA #1: IGNORE **COMPLETAMENTE** OS NOMES DOS ARQUIVOS!
   - Os nomes são hashes aleatórios SEM significado narrativo
   - NUNCA use ordem alfabética ou numérica dos nomes
   - Base sua decisão 100% no CONTEÚDO VISUAL

🔍 REGRA #2: ANÁLISE VISUAL PROFUNDA E METICULOSA
   - Leia TODO o texto em TODAS as imagens
   - Analise TODAS as expressões faciais
   - Observe TODOS os elementos de cenário
   - Identifique TODAS as transições de ação

✅ REGRA #3: VALIDAÇÃO COM REFERÊNCIA EXTERNA
   - Se houver referência externa acima, use-a para VALIDAR sua ordem
   - Compare sua análise visual com a sequência dos sites oficiais
   - Em caso de dúvida, priorize a ordem da referência externa

📊 REGRA #4: CONFIDENCE HONESTO
   - Só retorne confidence 0.9+ se tiver CERTEZA ABSOLUTA
   - Se tiver dúvidas, reduza o confidence e explique no reasoning
   - Confidence baixo (<0.7) indica que precisa de revisão manual

╔══════════════════════════════════════════════════════════════════╗
║  📝 METODOLOGIA PASSO A PASSO (OBRIGATÓRIA)                     ║
╚══════════════════════════════════════════════════════════════════╝

ETAPA 1: IDENTIFICAÇÃO DE PÁGINAS ESPECIAIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Primeira página (ABERTURA):
  ✓ Título do capítulo em destaque (ex: "Capítulo 5", "제5화")
  ✓ Arte mais elaborada/colorida que as outras
  ✓ Logo da obra ou número grande
  ✓ Pouco ou nenhum diálogo
  ✓ Pode ter frase de abertura épica

Última página (ENCERRAMENTO):
  ✓ Texto de finalização: "FIM", "CONTINUA", "TO BE CONTINUED"
  ✓ "Próximo capítulo em...", "Continue lendo..."
  ✓ Créditos de tradução/scan (ex: "Tradução: X", "Scan: Y")
  ✓ Preview do próximo capítulo
  ✓ Arte de encerramento ou página em branco

ETAPA 2: CONTINUIDADE DE DIÁLOGO (CRÍTICO!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Para CADA par de páginas consecutivas, verifique:

  1. PERGUNTA → RESPOSTA:
     Página A: "O que você está fazendo aqui?"
     Página B: "Eu vim te salvar!" ✓ CORRETA SEQUÊNCIA

  2. FRASE INCOMPLETA → CONTINUAÇÃO:
     Página A: "Eu preciso te dizer que..."
     Página B: "...você é muito importante para mim" ✓ CORRETA

  3. AÇÃO → REAÇÃO VERBAL:
     Página A: [Personagem cai]
     Página B: "Está tudo bem?!" ✓ CORRETA

  4. CONVERSA ENTRE MÚLTIPLOS PERSONAGENS:
     Siga o fluxo natural: A fala → B responde → A replica → B conclui

ETAPA 3: CONTINUIDADE DE AÇÃO (VISUAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sequência temporal correta de ações:

  INÍCIO → MEIO → FIM:
    Página 1: [Personagem prepara soco - punho para trás]
    Página 2: [Soco em movimento - linhas de velocidade]
    Página 3: [Impacto - efeito visual de batida]
    Página 4: [Inimigo caindo - expressão de dor]

  CAUSA → EFEITO:
    Página A: [Pessoa abre porta]
    Página B: [Luz entra no quarto escuro] ✓ CORRETA

  OLHAR → FOCO:
    Página A: [Personagem olha para cima, surpreso]
    Página B: [Mostra o que ele vê: algo no céu] ✓ CORRETA

ETAPA 4: CONTINUIDADE DE CENÁRIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • Mantenha páginas do MESMO LOCAL juntas
  • Transições lógicas: Quarto → Corredor → Sala → Exterior
  • Progressão temporal: Dia → Entardecer → Noite
  • Clima consistente: Se está chovendo, a chuva continua nas próximas páginas

ETAPA 5: DIREÇÃO DE LEITURA (CULTURAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📱 MANHWA (Coreano): ESQUERDA → DIREITA, CIMA → BAIXO
     Balões de fala seguem ordem ocidental

  📚 MANGA (Japonês): DIREITA → ESQUERDA, CIMA → BAIXO
     Balões de fala seguem ordem japonesa (inversa)

  📜 WEBTOON: CIMA → BAIXO (leitura vertical contínua)
     Páginas longas em formato scroll

ETAPA 6: VALIDAÇÃO CRUZADA FINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Após definir a ordem, faça estas verificações:

  ✓ A primeira página É REALMENTE a abertura do capítulo?
  ✓ A última página TEM elementos de encerramento?
  ✓ TODOS os diálogos seguem ordem lógica de conversa?
  ✓ TODAS as ações têm progressão temporal correta?
  ✓ Os cenários transitam de forma coerente?
  ✓ A referência externa (se houver) CONFIRMA sua ordem?

╔══════════════════════════════════════════════════════════════════╗
║  ❌ ERROS FATAIS QUE VOCÊ DEVE EVITAR                           ║
╚══════════════════════════════════════════════════════════════════╝

❌ NUNCA ordene por nome de arquivo (são hashes aleatórios!)
❌ NUNCA separe páginas da mesma conversa/cena
❌ NUNCA coloque a resposta ANTES da pergunta
❌ NUNCA inverta causa e efeito (ação → consequência)
❌ NUNCA ignore os textos e diálogos das páginas
❌ NUNCA assuma que a ordem atual está correta

╔══════════════════════════════════════════════════════════════════╗
║  ✅ FORMATO DE RESPOSTA OBRIGATÓRIO (JSON)                      ║
╚══════════════════════════════════════════════════════════════════╝

{
  "order": [
    "hash1.webp",
    "hash2.webp",
    "hash3.webp"
  ],
  "confidence": 0.95,
  "reasoning": "PRIMEIRA PÁGINA: [hash1.webp] identificada por título 'Capítulo 5' em coreano (제5화) e arte de abertura elaborada. SEQUÊNCIA: Diálogo inicia com personagem acordando (hash2), continua conversa com mulher (hash3-hash8), transição para sala do lorde (hash9-hash12), confronto final (hash13-hash15). ÚLTIMA PÁGINA: [hashFinal.webp] contém créditos de tradução e texto 'CONTINUA...'."
}

📋 NOMES EXATOS DAS ${images.length} IMAGENS:
${imageNames.map((name, i) => `   ${i + 1}. ${name}`).join('\n')}

╔══════════════════════════════════════════════════════════════════╗
║  🎬 AGORA ANALISE CADA IMAGEM DETALHADAMENTE                    ║
╚══════════════════════════════════════════════════════════════════╝
`
      },
      ...imageAnalysisPrompts,
      ...images.map((img: { name: string; data: string }) => ({
        type: "image_url",
        image_url: {
          url: img.data
        }
      })),
      {
        type: "text",
        text: `

╔══════════════════════════════════════════════════════════════════╗
║  🎯 INSTRUÇÕES FINAIS ANTES DE RESPONDER                        ║
╚══════════════════════════════════════════════════════════════════╝

Agora que você viu TODAS as ${images.length} imagens:

1. Identifique qual é a PRIMEIRA página (abertura)
2. Identifique qual é a ÚLTIMA página (encerramento)
3. Organize as páginas intermediárias seguindo:
   - Continuidade de diálogo
   - Progressão de ação
   - Transições de cenário
   - Lógica temporal

4. Valide sua ordem comparando com a referência externa (se disponível)
5. Calcule o confidence honestamente:
   - 1.0 = Certeza absoluta, todas as transições perfeitas
   - 0.9 = Muito confiante, pequenas dúvidas pontuais
   - 0.7-0.8 = Confiante, mas com algumas incertezas
   - <0.7 = Pouca confiança, precisa de revisão manual

6. Escreva um reasoning DETALHADO explicando:
   - Como identificou a primeira e última página
   - Principais blocos narrativos e sua ordem
   - Elementos-chave que confirmam a sequência

RETORNE AGORA O JSON COM A ORDEM CORRETA!`
      }
    ];

    console.log('Enviando para Lovable AI:', images.length, 'imagens');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "user",
            content: content
          }
        ],
        temperature: 0.1 // Baixa temperatura para respostas mais consistentes
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido, tente novamente mais tarde." }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes no Lovable AI." }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error("Erro da API:", response.status, errorText);
      throw new Error(`Erro da API: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    
    console.log('📊 Resposta da IA:', aiResponse);

    // Extrair JSON da resposta
    let parsedOrder;
    try {
      // Tentar encontrar JSON na resposta
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedOrder = JSON.parse(jsonMatch[0]);
      } else {
        parsedOrder = JSON.parse(aiResponse);
      }
      
      // Log detalhado para debug
      console.log('📝 Nomes enviados:', imageNames);
      console.log('📝 Nomes retornados pela IA:', parsedOrder.order);
      console.log('🎯 Confiança da IA:', parsedOrder.confidence || 'não informada');
      console.log('💭 Raciocínio:', parsedOrder.reasoning || 'não informado');
      
      // Verificar se todos os nomes retornados existem nos enviados
      const invalidNames = parsedOrder.order?.filter((name: string) => !imageNames.includes(name)) || [];
      if (invalidNames.length > 0) {
        console.error('❌ ERRO: IA retornou nomes inválidos:', invalidNames);
        return new Response(
          JSON.stringify({ 
            error: 'IA retornou nomes de arquivo inválidos',
            invalidNames,
            validNames: imageNames 
          }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar se todos os nomes originais estão na resposta
      const missingNames = imageNames.filter((name: string) => !parsedOrder.order?.includes(name)) || [];
      if (missingNames.length > 0) {
        console.error('❌ ERRO: IA não incluiu todas as imagens:', missingNames);
        return new Response(
          JSON.stringify({ 
            error: 'IA não incluiu todas as imagens na ordenação',
            missingNames 
          }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar confiança
      const confidence = parsedOrder.confidence || 0;
      if (confidence < 0.7) {
        console.warn('⚠️ AVISO: Confiança baixa na ordenação:', confidence);
      }
      
    } catch (e) {
      console.error('❌ Erro ao parsear resposta da IA:', e);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar resposta da IA', rawResponse: aiResponse }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Ordenação concluída com sucesso');
    return new Response(
      JSON.stringify({ 
        order: parsedOrder.order,
        confidence: parsedOrder.confidence,
        reasoning: parsedOrder.reasoning
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função sort-manga-pages:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
