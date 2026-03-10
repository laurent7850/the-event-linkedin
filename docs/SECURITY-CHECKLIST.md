# Checklist Securite - The Event LinkedIn

## Secrets
- [ ] Tous les secrets dans .env, jamais dans le code
- [ ] .env absent de Git (.gitignore)
- [ ] JWT_SECRET >= 64 caracteres aleatoires
- [ ] SESSION_SECRET >= 64 caracteres aleatoires
- [ ] ENCRYPTION_KEY >= 32 caracteres
- [ ] Mots de passe admin hashes avec bcrypt (cost 12+)
- [ ] Tokens OAuth chiffres en base (AES-256-GCM)
- [ ] Rotation des secrets documentee

## Reseau
- [ ] PostgreSQL sur reseau Docker interne uniquement
- [ ] Seul Traefik expose les ports 80/443
- [ ] Firewall VPS (ufw) actif
- [ ] HTTPS avec Let's Encrypt
- [ ] Headers de securite (HSTS, X-Frame-Options, etc.)

## Conteneurs
- [ ] Images stables (alpine, versions fixees)
- [ ] Utilisateurs non-root dans les conteneurs
- [ ] Healthchecks sur chaque service
- [ ] restart: unless-stopped
- [ ] Limites memoire configurees

## Application
- [ ] Rate limiting sur /api/ (200/15min)
- [ ] Rate limiting sur /api/auth/login (10/15min)
- [ ] Validation des entrees (express-validator)
- [ ] Protection CSRF
- [ ] Cookies httpOnly, secure, sameSite
- [ ] CORS restrictif (origin = APP_URL)
- [ ] Helmet (headers securite)
- [ ] Pas d'exposition de stack traces en production
- [ ] Audit trail sur actions sensibles

## Donnees
- [ ] Backups chiffres automatiques
- [ ] Retention configurable
- [ ] Procedure de restauration testee
- [ ] Suppression logique (soft delete)
- [ ] Pas de donnees personnelles inutiles

## LinkedIn
- [ ] OAuth 2.0 officiel uniquement
- [ ] Gestion expiration token
- [ ] Fallback brouillon si echec
- [ ] Journalisation sans fuite de secret
- [ ] Retry exponentiel sur 429/5xx

## Monitoring
- [ ] Endpoint /api/health
- [ ] Logs structures JSON
- [ ] Alertes sur erreurs critiques
- [ ] Verification reguliere des backups
