-- Limpar URLs blob/file inválidas de avatares e páginas de mangá
-- Estas URLs não funcionam no ambiente publicado

-- Limpar avatar_url das profiles
UPDATE profiles 
SET avatar_url = NULL 
WHERE avatar_url LIKE 'blob:%' OR avatar_url LIKE 'file:%';

-- Limpar pages_urls dos chapters
UPDATE chapters
SET pages_urls = (
  SELECT array_agg(url)
  FROM unnest(pages_urls) AS url
  WHERE url NOT LIKE 'blob:%' AND url NOT LIKE 'file:%'
)
WHERE EXISTS (
  SELECT 1 FROM unnest(pages_urls) AS url
  WHERE url LIKE 'blob:%' OR url LIKE 'file:%'
);

-- Opcional: Deletar chapters sem páginas válidas após limpeza
DELETE FROM chapters 
WHERE pages_urls IS NULL OR array_length(pages_urls, 1) = 0;