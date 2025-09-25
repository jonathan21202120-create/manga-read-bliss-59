-- Confirmar email do usuário para permitir login imediato
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email = 'bruno.burno554252@gmail.co' AND email_confirmed_at IS NULL;