# The Event - LinkedIn Automation CRM

Systeme auto-heberge de generation et publication automatique de posts LinkedIn pour The Event (www.the-event.be).

## Architecture

```
┌─────────────┐     ┌──────────┐     ┌──────────┐
│   Traefik   │────▶│ Frontend │     │   n8n    │
│ (reverse    │────▶│  (React) │     │ (cron +  │
│  proxy+TLS) │────▶│          │     │ workflow)│
│             │────▶│ Backend  │◀────│          │
└─────────────┘     │ (Node.js)│     └──────────┘
                    └────┬─────┘
                         │
                    ┌────▼─────┐     ┌──────────┐
                    │PostgreSQL│     │  Backup  │
                    │          │◀────│  Runner  │
                    └──────────┘     └──────────┘
```

## Prerequis

- VPS Linux (Ubuntu 22.04+) avec 2 Go RAM minimum
- Docker et Docker Compose v2
- Nom de domaine pointe vers le VPS
- Compte LinkedIn Developer App (pour OAuth)
- Cle API OpenRouter

## Installation rapide

```bash
# 1. Cloner le projet
git clone <repo> /opt/the-event-linkedin
cd /opt/the-event-linkedin

# 2. Configurer
cp .env.example .env
nano .env  # Remplir tous les CHANGE_ME

# 3. Generer les secrets
openssl rand -hex 32  # Pour JWT_SECRET
openssl rand -hex 32  # Pour SESSION_SECRET
openssl rand -hex 16  # Pour ENCRYPTION_KEY
openssl rand -hex 32  # Pour N8N_ENCRYPTION_KEY
openssl rand -hex 32  # Pour BACKUP_ENCRYPTION_KEY

# 4. Lancer
docker compose up -d

# 5. Creer l'admin
docker compose exec backend node -e "
const bcrypt = require('bcryptjs');
bcrypt.hash('VOTRE_MOT_DE_PASSE', 12).then(h => console.log(h));
"
# Puis inserer dans la DB:
docker compose exec postgres psql -U theevent -d theevent_linkedin -c \
  "INSERT INTO admin_users (email, password_hash, display_name) VALUES ('admin@the-event.be', 'HASH_CI_DESSUS', 'Admin');"

# 6. Importer le workflow n8n
# Acceder a https://DOMAIN/n8n/
# Importer n8n/workflows/weekly-linkedin-post.json
# Configurer les variables d'environnement dans n8n
# Activer le workflow
```

## Configuration LinkedIn

1. Creer une app sur https://developer.linkedin.com/
2. Ajouter le produit "Share on LinkedIn" 
3. Configurer l'URL de callback OAuth : `https://DOMAIN/api/auth/linkedin/callback`
4. Copier Client ID et Client Secret dans .env
5. Se connecter via le CRM > Parametres > LinkedIn

## Structure du projet

```
├── backend/           # API Node.js TypeScript
│   ├── src/
│   │   ├── config/    # Database config
│   │   ├── middleware/ # Auth, security
│   │   ├── routes/    # API routes
│   │   ├── services/  # LinkedIn, OpenRouter, content generator
│   │   └── utils/     # Logger, crypto, audit
│   └── Dockerfile
├── frontend/          # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/
│   └── Dockerfile
├── db/
│   ├── migrations/    # Schema SQL
│   └── seeds/         # Donnees initiales
├── n8n/workflows/     # Workflow exportable
├── scripts/           # Backup, restore, init
├── traefik/           # Config reverse proxy
├── docker-compose.yml
├── docker-compose.staging.yml
└── .env.example
```

## Operations

### Backup
Les backups sont automatiques (cron Docker, par defaut 2h du matin).
```bash
# Backup manuel
docker compose exec backup /usr/local/bin/backup.sh

# Lister les backups
docker compose exec backup ls -lh /backups/

# Restaurer
docker compose exec backup /usr/local/bin/restore.sh theevent_20260310_020000.sql.gz.enc
```

### Logs
```bash
docker compose logs -f backend
docker compose logs -f n8n
docker compose logs -f postgres
```

### Sante
```bash
curl https://DOMAIN/api/health
docker compose ps
```

### Mise a jour
```bash
git pull
docker compose build
docker compose up -d
```

## Staging
```bash
docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d
```

## Flux hebdomadaire

1. **Jeudi, heure configuree** : n8n declenche le workflow
2. **Generation** : Backend appelle OpenRouter avec le prompt editorial
3. **Validation** : Verification longueur, similarite, coherence
4. **Sauvegarde** : Post enregistre en base (statut generated ou review_pending)
5. **Publication** : Si auto-publish actif et token LinkedIn valide, publication directe
6. **Fallback** : Si echec, le post est mis en file d'attente, jamais perdu
7. **CRM** : Tout est visible et editable dans l'interface admin

## Securite

Voir `docs/SECURITY-CHECKLIST.md` pour la checklist complete.
