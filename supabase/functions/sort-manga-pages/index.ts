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
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📚 DUAL-AI SORTING SYSTEM`);
    console.log(`📖 Obra: ${mangaTitle} | Capítulo: ${chapterNumber}`);
    console.log(`📊 Total de páginas: ${images?.length || 0}`);
    console.log(`${'='.repeat(70)}\n`);

    if (!images || images.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma imagem fornecida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('❌ LOVABLE_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'Serviço de IA não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair nomes dos arquivos
    const imageNames = images.map((img: { name: string; data: string }) => img.name);
    console.log('📋 Arquivos recebidos:', imageNames);

    // ========================================
    // 🎨 STAGE 1: VISUAL ANALYSIS AI
    // ========================================
    console.log('\n🎨 STAGE 1: Visual Analysis AI');
    console.log('─'.repeat(70));
    console.log('Analisando conteúdo visual individual de cada página...\n');

    const visualAnalysisPrompt = `Você é uma IA ESPECIALIZADA em análise visual de manga/manhwa.

**SUA TAREFA**: Analise cada uma das ${images.length} imagens fornecidas individualmente e extraia informações visuais DETALHADAS.

Para cada imagem, identifique:

1. **Tipo de página**:
   - "opening" = Página de abertura (título do capítulo, arte elaborada, logo)
   - "closing" = Página de encerramento ("FIM", "CONTINUA", créditos)
   - "content" = Página de conteúdo normal

2. **Personagens presentes**: Descreva os personagens visíveis (ex: "homem de cabelo preto", "mulher de vestido branco")

3. **Localização**: Onde se passa a cena (ex: "quarto escuro", "corredor iluminado", "floresta", "rua da cidade")

4. **Ação principal**: O que está acontecendo visualmente (ex: "personagem correndo", "dois personagens conversando", "cena de luta")

5. **Diálogos e textos**:
   - Existem balões de fala? (sim/não)
   - Se sim, transcreva EXATAMENTE o texto visível
   - Identifique o tipo: "pergunta", "resposta", "exclamação", "pensamento", "narração"
   - Posição dos balões: "topo", "meio", "baixo"

6. **Elementos visuais únicos**: Qualquer coisa marcante (efeitos de ação, flashbacks, mudança de tom, símbolos especiais)

7. **Tom emocional**: "calmo", "tenso", "dramático", "cômico", "ação intensa", etc.

**FORMATO DE RESPOSTA** (JSON):
{
  "analyses": [
    {
      "filename": "nome-do-arquivo.webp",
      "pageType": "opening|content|closing",
      "characters": ["descrição personagem 1", "descrição personagem 2"],
      "location": "descrição do local",
      "action": "descrição da ação",
      "dialogue": {
        "present": true/false,
        "texts": ["texto 1", "texto 2"],
        "type": "pergunta|resposta|exclamação|pensamento|narração",
        "position": "topo|meio|baixo"
      },
      "visualMarkers": "elementos únicos",
      "tone": "tom emocional"
    }
  ]
}

**REGRAS CRÍTICAS**:
- NÃO tente ordenar as páginas ainda
- NÃO use os nomes de arquivo como guia (são hashes aleatórios)
- Analise SOMENTE o conteúdo visual
- Seja EXTREMAMENTE detalhado nos diálogos
- Retorne o JSON válido

NOMES DOS ARQUIVOS (para referência):
${imageNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}`;

    const visualAnalysisMessages = [{
      role: 'user',
      content: [
        { type: 'text', text: visualAnalysisPrompt },
        ...images.map((img: { name: string; data: string }) => ({
          type: 'image_url',
          image_url: { url: img.data }
        }))
      ]
    }];

    const visualResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: visualAnalysisMessages,
        temperature: 0.2
      })
    });

    if (!visualResponse.ok) {
      const errorText = await visualResponse.text();
      console.error('❌ Visual Analysis AI falhou:', errorText);
      throw new Error('Análise visual falhou');
    }

    const visualData = await visualResponse.json();
    const visualContent = visualData.choices?.[0]?.message?.content || '';
    
    // Extrair JSON da resposta
    const jsonMatch = visualContent.match(/\{[\s\S]*\}/);
    const visualAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(visualContent);
    
    console.log('✅ Análise visual concluída');
    console.log(`📊 ${visualAnalysis.analyses?.length || 0} páginas analisadas`);
    
    // Log resumido
    visualAnalysis.analyses?.forEach((analysis: any, i: number) => {
      console.log(`  ${i + 1}. ${analysis.filename}: [${analysis.pageType}] ${analysis.action}`);
    });

    // ========================================
    // 📖 STAGE 2: NARRATIVE ORDERING AI
    // ========================================
    console.log('\n📖 STAGE 2: Narrative Ordering AI');
    console.log('─'.repeat(70));
    console.log('Determinando sequência narrativa correta...\n');

    const narrativePrompt = `Você é uma IA ESPECIALIZADA em sequenciamento narrativo de manga/manhwa.

**INFORMAÇÕES DA OBRA**:
📖 Título: "${mangaTitle}"
📗 Capítulo: ${chapterNumber}
📊 Total de páginas: ${images.length}

**DADOS DA ANÁLISE VISUAL** (feita por outra IA):
${JSON.stringify(visualAnalysis, null, 2)}

**SUA TAREFA CRÍTICA**:
Use os dados de análise visual + as imagens fornecidas para determinar a ordem CORRETA de leitura.

**METODOLOGIA OBRIGATÓRIA**:

1️⃣ **IDENTIFICAR PRIMEIRA PÁGINA**:
   - Procure por: título do capítulo, arte de abertura, logo, número do capítulo
   - pageType: "opening" é forte indicador
   - Geralmente tem pouco ou nenhum diálogo

2️⃣ **IDENTIFICAR ÚLTIMA PÁGINA**:
   - Procure por: "FIM", "CONTINUA", "TO BE CONTINUED", créditos
   - pageType: "closing" é forte indicador
   - Pode ter preview do próximo capítulo

3️⃣ **ORGANIZAR PÁGINAS INTERMEDIÁRIAS**:
   
   A. **CONTINUIDADE DE DIÁLOGO** (prioridade máxima):
      - Perguntas DEVEM vir antes de respostas
      - Diálogos incompletos devem continuar na próxima página
      - Conversas entre personagens devem fluir naturalmente
      
      Exemplo correto:
        Página A: "O que você está fazendo aqui?"
        Página B: "Vim te salvar!"
   
   B. **CONTINUIDADE DE AÇÃO**:
      - Ações devem progredir temporalmente: preparação → execução → resultado
      - Causa deve vir antes do efeito
      
      Exemplo correto:
        Página A: [personagem prepara soco]
        Página B: [soco em movimento]
        Página C: [impacto no alvo]
   
   C. **CONTINUIDADE DE CENÁRIO**:
      - Mantenha cenas no mesmo local juntas
      - Transições devem ser lógicas: quarto → corredor → sala
      - Progressão temporal: dia → tarde → noite

4️⃣ **VALIDAÇÃO CRUZADA**:
   - Verifique se todos os diálogos fazem sentido na ordem escolhida
   - Confirme que ações têm progressão lógica
   - Garanta que não há saltos temporais estranhos

**CÁLCULO DE CONFIANÇA**:
- **0.95-1.0**: Certeza absoluta, todas as transições perfeitas, primeira/última claras
- **0.85-0.94**: Muito confiante, pequenas ambiguidades resolvidas
- **0.70-0.84**: Confiante, mas com incertezas em 1-2 páginas
- **0.50-0.69**: Múltiplas ordens possíveis, escolhi a mais provável
- **< 0.50**: Não consigo determinar ordem correta com confiança

**DETERMINAÇÃO DE STATUS**:
- Se confidence >= 0.85: "✅ Sequência coerente"
- Se confidence 0.70-0.84: "⚠️ Necessita reordenação"
- Se confidence < 0.70: "❌ Falha de contexto — mesclar instâncias novamente"

**FORMATO DE RESPOSTA** (JSON válido):
{
  "order": ["arquivo1.webp", "arquivo2.webp", "arquivo3.webp", ...],
  "confidence": 0.95,
  "status": "✅ Sequência coerente",
  "reasoning": "Explicação DETALHADA: Como identifiquei primeira página (ex: título em destaque), como organizei o meio (ex: seguindo diálogo entre personagem A e B, depois transição para cena de ação), como identifiquei última página (ex: créditos de tradução)",
  "warnings": ["qualquer ambiguidade ou incerteza encontrada"]
}

**REGRAS ABSOLUTAS**:
🚫 NUNCA ordene por nome de arquivo (são hashes aleatórios!)
🚫 NUNCA coloque resposta antes de pergunta
🚫 NUNCA inverta causa e efeito
🚫 NUNCA separe páginas da mesma conversa
✅ SEMPRE baseie na análise visual + conteúdo das imagens
✅ SEMPRE valide que diálogos fazem sentido na ordem
✅ SEMPRE explique seu raciocínio detalhadamente

ARQUIVOS DISPONÍVEIS (ordem atual, provavelmente INCORRETA):
${imageNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}

Agora analise as imagens e retorne a ordem correta!`;

    const narrativeMessages = [{
      role: 'user',
      content: [
        { type: 'text', text: narrativePrompt },
        ...images.map((img: { name: string; data: string }) => ({
          type: 'image_url',
          image_url: { url: img.data }
        }))
      ]
    }];

    const narrativeResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: narrativeMessages,
        temperature: 0.1
      })
    });

    if (!narrativeResponse.ok) {
      const errorText = await narrativeResponse.text();
      console.error('❌ Narrative Ordering AI falhou:', errorText);
      throw new Error('Ordenação narrativa falhou');
    }

    const narrativeData = await narrativeResponse.json();
    const narrativeContent = narrativeData.choices?.[0]?.message?.content || '';
    
    // Extrair JSON
    const narrativeJsonMatch = narrativeContent.match(/\{[\s\S]*\}/);
    const result = narrativeJsonMatch ? JSON.parse(narrativeJsonMatch[0]) : JSON.parse(narrativeContent);

    console.log('\n' + '='.repeat(70));
    console.log('📊 RESULTADO FINAL DO DUAL-AI SYSTEM');
    console.log('='.repeat(70));
    console.log(`🎯 Status: ${result.status}`);
    console.log(`📈 Confiança: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`💭 Raciocínio: ${result.reasoning}`);
    if (result.warnings?.length > 0) {
      console.log(`⚠️  Avisos: ${result.warnings.join(', ')}`);
    }
    console.log('\n📋 Ordem determinada:');
    result.order?.forEach((filename: string, i: number) => {
      console.log(`  ${i + 1}. ${filename}`);
    });
    console.log('='.repeat(70) + '\n');

    // Validação
    const invalidNames = result.order?.filter((name: string) => !imageNames.includes(name)) || [];
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

    const missingNames = imageNames.filter((name: string) => !result.order?.includes(name)) || [];
    if (missingNames.length > 0) {
      console.error('❌ ERRO: IA não incluiu todas as imagens:', missingNames);
      return new Response(
        JSON.stringify({
          error: 'IA não incluiu todas as imagens na ordem',
          missingNames,
          returnedNames: result.order
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        order: result.order,
        confidence: result.confidence,
        status: result.status,
        reasoning: result.reasoning,
        warnings: result.warnings || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        status: '❌ Falha de contexto — mesclar instâncias novamente'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
