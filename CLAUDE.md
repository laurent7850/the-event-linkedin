# The-event LinkedIn

## Description
Outil de gestion et planification d'événements LinkedIn.

## Stack
- **Frontend** : React
- **Backend** : Node.js
- **Base de données** : PostgreSQL
- **Workflows** : n8n
- **Reverse proxy** : Traefik (SSL Let's Encrypt)
- **Déploiement** : Docker Compose multi-services

## Services Docker
- Traefik (reverse proxy + SSL)
- PostgreSQL
- n8n (workflows automatisés)
- Backend (Node.js)
- Frontend (React)

## Commandes
```bash
docker compose up -d       # Démarrer tous les services
docker compose down        # Arrêter
docker compose logs -f     # Logs
```
