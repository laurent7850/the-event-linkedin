-- The Event - Services Catalog Seed Data
INSERT INTO services_catalog (slug, name, description, source_url) VALUES
('staffing-solutions', 'Staffing Solutions', 'Personnel qualifié pour vos événements : hôtes et hôtesses d''accueil, serveurs, barmen, vestiaire, parking, promotion.', 'https://www.the-event.be'),
('team-building', 'Team Building', 'Activités de cohésion d''équipe sur mesure pour renforcer la dynamique de groupe et la motivation des collaborateurs.', 'https://www.the-event.be'),
('research-selection', 'Research & Selection', 'Recrutement et sélection de profils spécialisés dans l''événementiel et les services aux entreprises.', 'https://www.the-event.be'),
('formation', 'Formation', 'Programmes de formation professionnelle pour le personnel événementiel et les équipes en entreprise.', 'https://www.the-event.be'),
('evaluation', 'Évaluation', 'Évaluation des compétences et du potentiel des collaborateurs, audit des performances événementielles.', 'https://www.the-event.be'),
('catering-solutions', 'Catering Solutions', 'Solutions traiteur complètes pour événements corporate et privés, du cocktail au banquet.', 'https://www.the-event.be'),
('event-organisation', 'Event Organisation', 'Organisation clé en main d''événements corporate et privés, de la conception à la réalisation.', 'https://www.the-event.be'),
('montage-mise-en-place', 'Montage & Mise en place', 'Installation, montage et mise en place technique et logistique de vos espaces événementiels.', 'https://www.the-event.be'),
('location-creating-mood', 'Location & Creating Mood', 'Location de matériel événementiel et création d''ambiances uniques pour vos espaces.', 'https://www.the-event.be'),
('animation-spectacle', 'Animation & Art du spectacle', 'Animations, spectacles, DJ, artistes et performances pour dynamiser vos événements.', 'https://www.the-event.be'),
('coaching-entreprise', 'Coaching en entreprise', 'Coaching professionnel pour managers et équipes, développement du leadership et performance collective.', 'https://www.the-event.be')
ON CONFLICT (slug) DO NOTHING;

-- Default editorial prompt
INSERT INTO editorial_prompts (name, version, system_prompt, user_prompt_template, is_active) VALUES
('linkedin_weekly_v1', '1.0',
'Tu es un rédacteur commercial senior spécialisé dans la communication LinkedIn B2B pour le secteur événementiel belge.

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

'CONTEXTE HEBDOMADAIRE :
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
Assure-toi que le contenu est frais, original et différent des posts récents listés ci-dessus.',
true)
ON CONFLICT DO NOTHING;
