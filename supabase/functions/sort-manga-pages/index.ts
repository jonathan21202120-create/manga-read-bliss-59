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
    
    // Preparar conteúdo para o modelo de visão - criar mensagem com nomes ANTES das imagens
    const imageNames = images.map((img: { name: string; data: string }) => img.name);
    
    // Buscar referências externas da obra e capítulo
    let externalContext = "";
    try {
      console.log('Buscando referências externas na web...');
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
              content: `Pesquise informações sobre a ordem correta das páginas do capítulo ${chapterNumber} da obra "${mangaTitle}". 
              
Retorne um resumo breve sobre:
1. A sequência típica de eventos neste capítulo
2. Cenas principais em ordem cronológica
3. Qualquer característica visual distintiva das páginas

Se não encontrar informações específicas, descreva padrões típicos de manhwa/manga.`
            }
          ],
          temperature: 0.3
        })
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        externalContext = searchData.choices?.[0]?.message?.content || "";
        console.log('Contexto externo obtido:', externalContext.substring(0, 200) + '...');
      }
    } catch (searchError) {
      console.warn('Erro ao buscar contexto externo:', searchError);
      // Continua sem o contexto externo
    }
    
    const content = [
      {
        type: "text",
        text: `TAREFA CRÍTICA DE ORDENAÇÃO VISUAL - ${mangaTitle} - Capítulo ${chapterNumber}

Você receberá ${images.length} imagens de páginas de manhwa/quadrinho que estão COMPLETAMENTE DESORDENADAS.

${externalContext ? `CONTEXTO DE REFERÊNCIA:\n${externalContext}\n\n` : ''}

⚠️ REGRA ABSOLUTA: IGNORE COMPLETAMENTE OS NOMES DOS ARQUIVOS!
Você DEVE analisar APENAS o CONTEÚDO VISUAL de cada imagem.

Lista de arquivos (apenas para retorno): ${imageNames.join(", ")}

COMO IDENTIFICAR A ORDEM CORRETA:

1. CAPA (primeira página):
   - Título grande e destacado
   - Arte diferenciada, mais elaborada
   - Logo da obra ou do capítulo
   - Geralmente tem cores mais vibrantes
   - Pode ter o nome do autor

2. PÁGINAS INTERNAS (ordem sequencial):
   - Siga a CONTINUIDADE DA NARRATIVA VISUAL
   - Balões de fala devem formar uma conversa coerente
   - Expressões dos personagens devem progredir naturalmente
   - Ações físicas devem ter sequência lógica (ex: pessoa se levantando → andando → chegando)
   - Mudanças de cenário devem fazer sentido
   - Se houver números de página, use-os apenas como referência secundária

3. PÁGINA FINAL (última página):
   - Pode ter "FIM", "TO BE CONTINUED", "CONTINUA..."
   - Créditos do autor/artista
   - Preview do próximo capítulo
   - Cena de fechamento/conclusão

INSTRUÇÕES DE ANÁLISE:
- Observe cada imagem CUIDADOSAMENTE
- Identifique personagens e suas posições
- Siga o fluxo da conversa e das ações
- A leitura geralmente é da direita para esquerda (manhwa) ou esquerda para direita (mangá)
- Procure continuidade visual entre as páginas

FORMATO DE RESPOSTA (OBRIGATÓRIO):
Retorne APENAS um JSON válido com os nomes EXATOS dos arquivos:
{"order": ["nome_exato_1.jpg", "nome_exato_2.png", ...]}

Use os nomes EXATAMENTE como foram fornecidos acima. NÃO invente novos nomes!`
      },
      ...images.map((img: { name: string; data: string }, index: number) => ({
        type: "text",
        text: `\n--- IMAGEM ${index + 1}: ${img.name} ---`
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
    
    console.log('Resposta da IA:', aiResponse);

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
      
      // Log para debug
      console.log('Nomes enviados:', imageNames);
      console.log('Nomes retornados pela IA:', parsedOrder.order);
      
      // Verificar se todos os nomes retornados existem nos enviados
      const invalidNames = parsedOrder.order?.filter((name: string) => !imageNames.includes(name)) || [];
      if (invalidNames.length > 0) {
        console.warn('AVISO: IA retornou nomes que não existem:', invalidNames);
      }
      
    } catch (e) {
      console.error('Erro ao parsear resposta da IA:', e);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar resposta da IA', rawResponse: aiResponse }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ order: parsedOrder.order || images.map((img: any) => img.name) }),
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
