# Runbook d'exploitation - The Event LinkedIn

## Demarrage
```bash
cd /opt/the-event-linkedin
docker compose up -d
docker compose ps  # Verifier que tout est healthy
```

## Arret
```bash
docker compose down  # Arret propre
# Les donnees sont persistees dans les volumes Docker
```

## Incident: Backend ne repond pas
1. Verifier les logs: `docker compose logs backend --tail 100`
2. Verifier la DB: `docker compose exec postgres pg_isready`
3. Redemarrer: `docker compose restart backend`

## Incident: n8n ne declenche pas le workflow
1. Verifier n8n: `docker compose logs n8n --tail 50`
2. Acceder a l'interface n8n et verifier que le workflow est actif
3. Verifier les variables d'environnement n8n
4. Declencher manuellement depuis le CRM (bouton "Generer")

## Incident: Publication LinkedIn echoue
1. Verifier le statut LinkedIn dans le CRM > Parametres
2. Si token expire: reconnecter via le bouton LinkedIn
3. Si 429 (rate limit): attendre et retenter
4. Le post est conserve en file d'attente, jamais perdu

## Incident: Base de donnees corrompue
1. Arreter les services: `docker compose stop backend n8n`
2. Lister les backups: `docker compose exec backup ls /backups/`
3. Restaurer: `docker compose exec backup /usr/local/bin/restore.sh FICHIER`
4. Redemarrer: `docker compose start backend n8n`

## Rotation des secrets
1. Generer de nouveaux secrets: `openssl rand -hex 32`
2. Mettre a jour .env
3. Redemarrer: `docker compose up -d`
Note: Changer ENCRYPTION_KEY invalide les tokens OAuth stockes.
Reconnecter LinkedIn apres rotation.

## Mise a jour
```bash
# Sauvegarder
docker compose exec backup /usr/local/bin/backup.sh
# Mettre a jour
git pull
docker compose build
docker compose up -d
# Verifier
curl https://DOMAIN/api/health
```

## Export des donnees
Via le CRM > Posts > Export CSV/JSON
Ou directement:
```bash
docker compose exec postgres pg_dump -U theevent theevent_linkedin > export.sql
```
