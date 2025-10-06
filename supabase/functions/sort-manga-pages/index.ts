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

    const content = [
      {
        type: "text",
        text: `TAREFA CRÍTICA: ORGANIZAR PÁGINAS DE MANHWA/MANGA POR ANÁLISE VISUAL DETALHADA

📖 Obra: ${mangaTitle} - Capítulo ${chapterNumber}
🔢 Total de páginas: ${images.length}

${externalReference ? `🌐 REFERÊNCIA EXTERNA ENCONTRADA:\n${externalReference}\n\n` : ''}

⚠️ INSTRUÇÕES ABSOLUTAS:
1. IGNORE COMPLETAMENTE OS NOMES DOS ARQUIVOS!
2. Analise PROFUNDAMENTE o conteúdo visual de CADA imagem
3. Use a referência externa acima (se disponível) para confirmar a ordem
4. Se não tiver 100% de certeza, indique na resposta

🎯 METODOLOGIA DE ANÁLISE (EXECUTE TODOS OS PASSOS):

PASSO 1 - IDENTIFICAR PRIMEIRA PÁGINA:
✓ Procure por título do capítulo em fonte grande/destacada
✓ Arte de abertura mais elaborada ou colorida
✓ Pode ter logo da obra ou número do capítulo
✓ Geralmente tem menos ou nenhum diálogo

PASSO 2 - IDENTIFICAR ÚLTIMA PÁGINA:
✓ Palavras como "FIM", "CONTINUA", "TO BE CONTINUED", "Próximo Capítulo"
✓ Créditos do scan/tradução
✓ Preview ou arte de encerramento
✓ Cena de conclusão narrativa

PASSO 3 - ANALISAR CONTINUIDADE DE DIÁLOGO:
Para CADA página, leia TODOS os balões de fala e verifique:
• Uma pergunta em uma página → resposta deve estar na próxima
• Conversa interrompida → continuação na próxima
• Personagem falando → reação de outro personagem
• Ordem natural de conversação

PASSO 4 - ANALISAR CONTINUIDADE DE AÇÃO:
• Movimento iniciado → movimento completado
• Personagem olhando para algo → mostra o que está olhando
• Ataque/golpe → impacto → reação
• Expressão neutra → surpresa → resposta emocional
• Causa → efeito (temporal)

PASSO 5 - ANALISAR CONTINUIDADE DE CENÁRIO:
• Mesma localização/ambiente deve ficar agrupado
• Interior → exterior (transição lógica)
• Dia → noite (progressão temporal)
• Mudanças de cena devem ter sentido cronológico

PASSO 6 - DIREÇÃO DE LEITURA:
• Manhwa (Coreano): Esquerda → Direita, Cima → Baixo
• Manga (Japonês): Direita → Esquerda, Cima → Baixo
• Webtoon: Cima → Baixo (vertical contínuo)

PASSO 7 - VERIFICAÇÃO CRUZADA:
• Compare sua ordem com a referência externa (se disponível)
• Verifique se TODAS as transições fazem sentido
• Releia os diálogos na ordem proposta
• Confirme a progressão narrativa

❌ ERROS QUE VOCÊ NUNCA DEVE COMETER:
• Usar ordem alfabética ou numérica dos nomes de arquivo
• Separar páginas de uma mesma cena/conversa
• Inverter causa e efeito
• Ignorar continuidade de diálogo
• Colocar a resposta antes da pergunta

✅ FORMATO DE SAÍDA OBRIGATÓRIO:
{
  "order": ["nome_exato_1.webp", "nome_exato_2.webp", ...],
  "confidence": 0.95,
  "reasoning": "Breve explicação da ordem: primeira página identificada por [razão], sequência de diálogo [descrição], última página com [indicador]"
}

📋 NOMES EXATOS DAS IMAGENS: ${imageNames.join(", ")}

🧠 ANALISE CADA IMAGEM INDIVIDUALMENTE, COMPARE TODAS ENTRE SI, E CONSTRUA A SEQUÊNCIA NARRATIVA PERFEITA!`
      },
      ...images.map((img: { name: string; data: string }, index: number) => ({
        type: "text",
        text: `\n--- IMAGEM ${index + 1}: ${img.name} ---\nAnálise necessária: diálogo, ação, cenário, posição narrativa`
      })),
      ...images.map((img: { name: string; data: string }) => ({
        type: "image_url",
        image_url: {
          url: img.data
        }
      }))
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
