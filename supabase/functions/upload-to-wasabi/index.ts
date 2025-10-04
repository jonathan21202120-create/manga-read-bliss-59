import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3@3";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configurações de segurança
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const ALLOWED_FOLDERS = ['manga-covers', 'manga-pages', 'avatars', 'uploads'];

// Rate limiting
const uploadRateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const MAX_UPLOADS_PER_MINUTE = 10;

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const userLimit = uploadRateLimit.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    uploadRateLimit.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: MAX_UPLOADS_PER_MINUTE - 1 };
  }

  if (userLimit.count >= MAX_UPLOADS_PER_MINUTE) {
    return { allowed: false, remaining: 0 };
  }

  userLimit.count++;
  uploadRateLimit.set(userId, userLimit);
  return { allowed: true, remaining: MAX_UPLOADS_PER_MINUTE - userLimit.count };
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 100);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificação de autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      console.error('User not authenticated');
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting check
    const rateLimitCheck = checkRateLimit(user.id);
    if (!rateLimitCheck.allowed) {
      console.warn(`Rate limit exceeded for user ${user.id}`);
      return new Response(
        JSON.stringify({ 
          error: 'Limite de uploads excedido', 
          message: 'Muitos uploads. Aguarde antes de tentar novamente.',
          retryAfter: 60 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '60',
            'X-RateLimit-Remaining': String(rateLimitCheck.remaining)
          } 
        }
      );
    }

    // Verificar se o usuário tem perfil (qualquer usuário autenticado pode fazer upload)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Perfil não encontrado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse do form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';
    
    if (!file) {
      console.error('No file provided in request');
      return new Response(JSON.stringify({ error: 'Nenhum arquivo enviado' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validar tipo de arquivo
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      console.warn(`Invalid file type: ${file.type}`);
      return new Response(
        JSON.stringify({ 
          error: 'Tipo de arquivo inválido', 
          message: `Apenas ${ALLOWED_IMAGE_TYPES.join(', ')} são permitidos` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar tamanho do arquivo
    if (file.size > MAX_FILE_SIZE || file.size <= 0) {
      console.warn(`File size invalid: ${file.size} bytes`);
      return new Response(
        JSON.stringify({ 
          error: 'Tamanho de arquivo inválido', 
          message: `O arquivo deve ter menos de ${MAX_FILE_SIZE / 1024 / 1024}MB` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar pasta de destino
    if (!ALLOWED_FOLDERS.includes(folder)) {
      console.error(`Invalid folder: ${folder}`);
      return new Response(
        JSON.stringify({ 
          error: 'Pasta inválida', 
          message: `A pasta deve ser uma de: ${ALLOWED_FOLDERS.join(', ')}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Configurar cliente S3 para Cloudflare R2
    const accessKey = Deno.env.get('CLOUDFLARE_R2_ACCESS_KEY');
    const secretKey = Deno.env.get('CLOUDFLARE_R2_SECRET_KEY');
    const endpoint = Deno.env.get('CLOUDFLARE_R2_ENDPOINT') || 'https://953ea806465dfaba8f3f01d3a9afe99f.r2.cloudflarestorage.com';
    const bucket = Deno.env.get('CLOUDFLARE_R2_BUCKET') || 'culto-do-demonio-celestial';
    
    console.log('Configurando R2 com:', {
      endpoint,
      bucket,
      hasAccessKey: !!accessKey,
      hasSecretKey: !!secretKey,
    });

    if (!accessKey || !secretKey) {
      console.error('Credenciais R2 não encontradas');
      return new Response(JSON.stringify({ error: 'Credenciais R2 não configuradas' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const s3Client = new S3Client({
      endpoint,
      region: 'auto',
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true,
    });

    // Gerar nome único e seguro para o arquivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const sanitizedName = sanitizeFilename(file.name);
    const fileExtension = sanitizedName.split('.').pop()?.toLowerCase() || 'jpg';
    
    // Validar extensão
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    if (!validExtensions.includes(fileExtension)) {
      return new Response(
        JSON.stringify({ 
          error: 'Extensão de arquivo inválida', 
          message: 'Apenas jpg, jpeg, png e webp são permitidos' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const fileName = `${folder}/${timestamp}_${randomString}.${fileExtension}`;
    
    console.log(`Uploading file: ${fileName}, size: ${file.size} bytes, type: ${file.type}`);

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload para Cloudflare R2
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Construir URL pública usando o domínio customizado com o nome do bucket
    const publicUrl = `https://arquivos.culto-demoniaco.online/${bucket}/${fileName}`;

    console.log(`Arquivo enviado com sucesso: ${publicUrl}`);

    return new Response(
      JSON.stringify({ url: publicUrl, path: fileName }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro no upload:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
