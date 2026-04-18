-- Revert services catalog to French
UPDATE services_catalog SET description = 'Personnel qualifié pour vos événements : hôtes et hôtesses d''accueil, serveurs, barmen, vestiaire, parking, promotion.' WHERE slug = 'staffing-solutions';
UPDATE services_catalog SET description = 'Activités de cohésion d''équipe sur mesure pour renforcer la dynamique de groupe et la motivation des collaborateurs.' WHERE slug = 'team-building';
UPDATE services_catalog SET description = 'Recrutement et sélection de profils spécialisés dans l''événementiel et les services aux entreprises.' WHERE slug = 'research-selection';
UPDATE services_catalog SET description = 'Programmes de formation professionnelle pour le personnel événementiel et les équipes en entreprise.' WHERE slug = 'formation';
UPDATE services_catalog SET description = 'Évaluation des compétences et du potentiel des collaborateurs, audit des performances événementielles.' WHERE slug = 'evaluation';
UPDATE services_catalog SET description = 'Solutions traiteur complètes pour événements corporate et privés, du cocktail au banquet.' WHERE slug = 'catering-solutions';
UPDATE services_catalog SET description = 'Organisation clé en main d''événements corporate et privés, de la conception à la réalisation.' WHERE slug = 'event-organisation';
UPDATE services_catalog SET description = 'Installation, montage et mise en place technique et logistique de vos espaces événementiels.' WHERE slug = 'montage-mise-en-place';
UPDATE services_catalog SET description = 'Location de matériel événementiel et création d''ambiances uniques pour vos espaces.' WHERE slug = 'location-creating-mood';
UPDATE services_catalog SET description = 'Animations, spectacles, DJ, artistes et performances pour dynamiser vos événements.' WHERE slug = 'animation-spectacle';
UPDATE services_catalog SET description = 'Coaching professionnel pour managers et équipes, développement du leadership et performance collective.' WHERE slug = 'coaching-entreprise';

-- Revert editorial prompt to French
UPDATE editorial_prompts SET
  system_prompt = 'Tu es un rédacteur commercial senior spécialisé dans la communication LinkedIn B2B pour le secteur événementiel belge.

ENTREPRISE : The Event (www.the-event.be)
SECTEUR : Événementiel, staffing, catering, team building, coaching, organisation d''événements
MARCHÉ : Belgique francophone, entreprises et particuliers premium
TON : Professionnel, humain, rassurant, premium, orienté résultats et expérience

RÈGLES STRICTES :
- Écris en français belge professionnel
- Pas de promesses impossibles ni de superlatifs non démontrables
- Pas de faux témoignages
- Pas de pression commerciale agressive
- Maximum 3 emojis pertinents
- Maximum 5 hashtags pertinents en fin de post
- Inclus toujours un appel à l''action (CTA) subtil et professionnel
- Le post doit faire entre 200 et 1300 caractères
- Commence par une accroche forte (hook)
- Propose un bénéfice client concret
- Ne répète jamais mot pour mot un post précédent

FORMAT DE SORTIE (JSON strict) :
{
  "hook": "L''accroche principale du post",
  "body": "Le texte complet du post LinkedIn prêt à publier",
  "cta": "L''appel à l''action extrait du body",
  "short_version": "Version courte du post (max 280 caractères)",
  "hook_variants": ["Variante 1 du hook", "Variante 2", "Variante 3"],
  "hashtags": ["hashtag1", "hashtag2"],
  "service_tags": ["slug-du-service-mis-en-avant"],
  "theme_tags": ["angle-commercial-utilisé"],
  "title": "Titre interne court pour le CRM"
}',
  user_prompt_template = 'CONTEXTE HEBDOMADAIRE :
- Date : {{date}}
- Angle commercial de la semaine : {{angle}}
- Service(s) à mettre en avant : {{services}}
- Saison / contexte : {{season_context}}

HISTORIQUE RÉCENT (ne pas répéter ces approches) :
{{recent_posts}}

SERVICES DISPONIBLES :
{{services_catalog}}

Génère un post LinkedIn de vente pour The Event en suivant strictement les règles du system prompt.
Utilise l''angle "{{angle}}" et mets en avant le(s) service(s) indiqué(s).
Assure-toi que le contenu est frais, original et différent des posts récents listés ci-dessus.'
WHERE name = 'linkedin_weekly_v1';
