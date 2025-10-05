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
    
    const content = [
      {
        type: "text",
        text: `TAREFA CRÍTICA: ORGANIZAR PÁGINAS DE MANHWA/MANGA POR ANÁLISE VISUAL

📖 Obra: ${mangaTitle} - Capítulo ${chapterNumber}
🔢 Total de páginas: ${images.length}

⚠️ REGRA #1: IGNORE COMPLETAMENTE OS NOMES DOS ARQUIVOS! 
Analise SOMENTE o conteúdo visual de cada imagem.

🎯 SEU OBJETIVO:
Organize as páginas na ordem CORRETA de leitura, seguindo a narrativa visual e textual.

📋 COMO IDENTIFICAR A ORDEM:

1️⃣ PRIMEIRA PÁGINA (Capa/Abertura):
   ✓ Título grande e centralizado do capítulo
   ✓ Arte mais elaborada ou diferenciada
   ✓ Pode ter logo da obra
   ✓ Geralmente sem diálogo ou com texto introdutório
   ✓ Cores mais vibrantes ou destaque visual

2️⃣ PÁGINAS INTERNAS (Sequência narrativa):
   
   CONTINUIDADE DE DIÁLOGO:
   • Leia os balões de fala em SEQUÊNCIA
   • Uma conversa deve fluir naturalmente entre páginas
   • Se alguém faz uma pergunta, a resposta vem na página seguinte
   • Diálogos interrompidos continuam na próxima página
   
   CONTINUIDADE DE AÇÃO:
   • Personagem começando um movimento → completando o movimento
   • Personagem entrando em cena → interagindo → saindo
   • Sequência de combate: golpe → impacto → reação
   • Mudanças de expressão: neutro → surpreso → reagindo
   
   CONTINUIDADE DE CENÁRIO:
   • Mesma localização deve permanecer agrupada
   • Transições visuais: interior → exterior, dia → noite
   • Mudanças de cena devem fazer sentido cronológico
   
   LÓGICA TEMPORAL:
   • Causa vem antes do efeito
   • Preparação antes da ação
   • Ação antes da consequência

3️⃣ ÚLTIMA PÁGINA (Fechamento):
   ✓ Pode ter "FIM", "CONTINUA...", "TO BE CONTINUED"
   ✓ Créditos do autor/artista
   ✓ Preview do próximo capítulo
   ✓ Cena de conclusão/gancho narrativo
   ✓ Arte de encerramento ou fade out

🔍 METODOLOGIA DE ANÁLISE:

PASSO 1: Identifique a primeira e última página
PASSO 2: Encontre sequências de diálogo conectadas
PASSO 3: Agrupe páginas por cena/localização
PASSO 4: Ordene as cenas cronologicamente
PASSO 5: Dentro de cada cena, ordene por fluxo de ação
PASSO 6: Verifique se há continuidade visual entre todas as transições

📐 DIREÇÃO DE LEITURA:
• Manhwa (Coreano): Esquerda → Direita, Cima → Baixo
• Manga (Japonês): Direita → Esquerda, Cima → Baixo
• Webtoon vertical: Cima → Baixo

❌ NÃO FAÇA:
• Não se baseie em nomes de arquivo
• Não assuma ordem alfabética
• Não ignore continuidade narrativa
• Não separe páginas de uma mesma cena

✅ SAÍDA OBRIGATÓRIA:
Retorne APENAS um JSON válido:
{"order": ["nome_exato_1.webp", "nome_exato_2.webp", ...]}

Use os nomes EXATOS: ${imageNames.join(", ")}

🧠 ANALISE CADA IMAGEM CUIDADOSAMENTE E CONSTRUA A NARRATIVA VISUAL COMPLETA!

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
