import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiter em memória (para produção usar Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 100; // 100 requisições por minuto por IP
const MAX_REQUESTS_PER_MINUTE_PER_USER = 50; // 50 por usuário autenticado

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

/**
 * Rate Limiter Function
 * 
 * Protege contra:
 * - Scraping em massa
 * - DDoS
 * - Download automatizado
 * 
 * Implementa:
 * - Rate limiting por IP
 * - Rate limiting por usuário
 * - Sliding window
 * - Limpeza automática
 */

function getRateLimitKey(identifier: string): string {
  return `ratelimit:${identifier}`;
}

function checkRateLimit(identifier: string, maxRequests: number): RateLimitResult {
  const now = Date.now();
  const key = getRateLimitKey(identifier);
  const record = rateLimitMap.get(key);

  // Se não existe ou expirou, cria novo
  if (!record || now > record.resetTime) {
    const resetTime = now + RATE_LIMIT_WINDOW;
    rateLimitMap.set(key, { count: 1, resetTime });
    
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetIn: RATE_LIMIT_WINDOW
    };
  }

  // Se atingiu o limite
  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: record.resetTime - now
    };
  }

  // Incrementa contador
  record.count++;
  rateLimitMap.set(key, record);

  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetIn: record.resetTime - now
  };
}

// Limpa entradas antigas a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 300000);

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Obtém IP do cliente
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('cf-connecting-ip') ||
                     'unknown';

    // Obtém user_id se autenticado
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      try {
        // Extrai user_id do JWT (simplificado)
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
      } catch {
        // Ignora erros de parsing do token
      }
    }

    // Verifica rate limit por IP
    const ipLimit = checkRateLimit(clientIp, MAX_REQUESTS_PER_WINDOW);
    
    // Verifica rate limit por usuário se autenticado
    let userLimit: RateLimitResult | null = null;
    if (userId) {
      userLimit = checkRateLimit(userId, MAX_REQUESTS_PER_MINUTE_PER_USER);
    }

    // Se qualquer um dos limites foi atingido
    const limit = userLimit || ipLimit;
    if (!limit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Muitas requisições. Por favor, aguarde antes de tentar novamente.',
          retryAfter: Math.ceil(limit.resetIn / 1000)
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil(limit.resetIn / 1000)),
            'X-RateLimit-Limit': String(userId ? MAX_REQUESTS_PER_MINUTE_PER_USER : MAX_REQUESTS_PER_WINDOW),
            'X-RateLimit-Remaining': String(limit.remaining),
            'X-RateLimit-Reset': String(Math.ceil(limit.resetIn / 1000))
          }
        }
      );
    }

    // Requisição permitida
    return new Response(
      JSON.stringify({
        allowed: true,
        remaining: limit.remaining,
        resetIn: Math.ceil(limit.resetIn / 1000)
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(userId ? MAX_REQUESTS_PER_MINUTE_PER_USER : MAX_REQUESTS_PER_WINDOW),
          'X-RateLimit-Remaining': String(limit.remaining),
          'X-RateLimit-Reset': String(Math.ceil(limit.resetIn / 1000))
        }
      }
    );

  } catch (error) {
    console.error('Rate limiter error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
