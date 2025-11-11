-- Aggiunge campo email_verified alla tabella users
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

-- Aggiorna utenti esistenti (opzionale: metti TRUE se vuoi che siano già verificati)
-- UPDATE users SET email_verified = TRUE;
