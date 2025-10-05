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
    const { images } = await req.json();
    
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

    // Preparar conteúdo para o modelo de visão
    const content = [
      {
        type: "text",
        text: `Você receberá uma lista de imagens de páginas de quadrinho ou manhwa.
Analise o conteúdo visual de cada imagem para identificar a ordem correta.
- A capa normalmente tem título grande, logotipo da obra ou cor diferente.
- Páginas internas costumam ter balões de fala e podem conter números pequenos nos cantos (inferior ou superior).
- Páginas com 'fim', 'to be continued' ou créditos são finais.

Retorne APENAS um JSON válido no formato:
{"order": ["nome1.jpg", "nome2.jpg", ...]}

A ordem deve ser da primeira página (capa) até a última (final).
Se não houver números visíveis, use a coerência visual (sequência de balões, personagens, e continuidade de cenas).`
      },
      ...images.map((img: { name: string; data: string }) => ({
        type: "image_url",
        image_url: {
          url: img.data // Base64 data URL
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
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: content
          }
        ]
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
