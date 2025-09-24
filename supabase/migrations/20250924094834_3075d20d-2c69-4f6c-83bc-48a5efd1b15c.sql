-- Fix function search path mutable warning by setting search_path
CREATE OR REPLACE FUNCTION set_conteudo_adulto()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.idade >= 18 THEN
    NEW.conteudo_adulto = COALESCE(NEW.conteudo_adulto, TRUE);
  ELSE
    NEW.conteudo_adulto = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;