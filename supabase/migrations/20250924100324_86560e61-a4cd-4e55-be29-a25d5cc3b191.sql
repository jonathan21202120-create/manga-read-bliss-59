-- Inserir dados de teste de mangás para demonstração (sem ON CONFLICT)
INSERT INTO public.mangas (
  title,
  author,
  description,
  cover_url,
  genre,
  status,
  rating,
  year,
  adult_content
) 
SELECT 'One Piece', 'Eiichiro Oda', 'Monkey D. Luffy e sua tripulação em busca do tesouro lendário One Piece.', '/placeholder.svg', ARRAY['Ação', 'Aventura', 'Shounen'], 'Em andamento', 9.5, 1997, false
WHERE NOT EXISTS (SELECT 1 FROM public.mangas WHERE title = 'One Piece')

UNION ALL

SELECT 'Attack on Titan', 'Hajime Isayama', 'A humanidade luta pela sobrevivência contra titãs gigantes.', '/placeholder.svg', ARRAY['Ação', 'Drama', 'Horror'], 'Completo', 9.0, 2009, false
WHERE NOT EXISTS (SELECT 1 FROM public.mangas WHERE title = 'Attack on Titan')

UNION ALL

SELECT 'My Hero Academia', 'Kohei Horikoshi', 'Em um mundo de super poderes, um jovem sem quirk sonha em ser herói.', '/placeholder.svg', ARRAY['Ação', 'Shounen', 'Sobrenatural'], 'Em andamento', 8.8, 2014, false
WHERE NOT EXISTS (SELECT 1 FROM public.mangas WHERE title = 'My Hero Academia');