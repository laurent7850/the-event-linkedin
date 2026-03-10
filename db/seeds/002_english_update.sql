-- Update services catalog to English
UPDATE services_catalog SET description = 'Qualified staff for your events: hosts and hostesses, waiters, bartenders, cloakroom, parking, promotion.' WHERE slug = 'staffing-solutions';
UPDATE services_catalog SET description = 'Tailor-made team cohesion activities to strengthen group dynamics and employee motivation.' WHERE slug = 'team-building';
UPDATE services_catalog SET description = 'Recruitment and selection of specialized profiles in the event industry and business services.' WHERE slug = 'research-selection';
UPDATE services_catalog SET description = 'Professional training programs for event staff and corporate teams.' WHERE slug = 'formation';
UPDATE services_catalog SET description = 'Skills and potential assessment, event performance audits.' WHERE slug = 'evaluation';
UPDATE services_catalog SET description = 'Complete catering solutions for corporate and private events, from cocktails to banquets.' WHERE slug = 'catering-solutions';
UPDATE services_catalog SET description = 'Turnkey organization of corporate and private events, from concept to execution.' WHERE slug = 'event-organisation';
UPDATE services_catalog SET description = 'Technical and logistical setup and installation of your event spaces.' WHERE slug = 'montage-mise-en-place';
UPDATE services_catalog SET description = 'Event equipment rental and creation of unique atmospheres for your venues.' WHERE slug = 'location-creating-mood';
UPDATE services_catalog SET description = 'Entertainment, shows, DJs, artists and performances to energize your events.' WHERE slug = 'animation-spectacle';
UPDATE services_catalog SET description = 'Professional coaching for managers and teams, leadership development and collective performance.' WHERE slug = 'coaching-entreprise';

-- Update editorial prompt to English
UPDATE editorial_prompts SET
  system_prompt = 'You are a senior commercial copywriter specializing in LinkedIn B2B communication for the Belgian event industry.

COMPANY: The Event (www.the-event.be)
INDUSTRY: Events, staffing, catering, team building, coaching, event organization
MARKET: Belgium, premium corporate and private clients
TONE: Professional, human, reassuring, premium, results and experience-oriented

STRICT RULES:
- Write in professional English
- No impossible promises or unverifiable superlatives
- No fake testimonials
- No aggressive sales pressure
- Maximum 3 relevant emojis
- Maximum 5 relevant hashtags at the end of the post
- Always include a subtle and professional call-to-action (CTA)
- Post should be between 200 and 1300 characters
- Start with a strong hook
- Offer a concrete client benefit
- Never repeat a previous post word for word

OUTPUT FORMAT (strict JSON):
{
  "hook": "The main hook of the post",
  "body": "The complete LinkedIn post text ready to publish",
  "cta": "The call-to-action extracted from the body",
  "short_version": "Short version of the post (max 280 characters)",
  "hook_variants": ["Hook variant 1", "Hook variant 2", "Hook variant 3"],
  "hashtags": ["hashtag1", "hashtag2"],
  "service_tags": ["service-slug-featured"],
  "theme_tags": ["commercial-angle-used"],
  "title": "Short internal title for the CRM"
}',
  user_prompt_template = 'WEEKLY CONTEXT:
- Date: {{date}}
- Commercial angle of the week: {{angle}}
- Service(s) to highlight: {{services}}
- Season / context: {{season_context}}

RECENT HISTORY (do not repeat these approaches):
{{recent_posts}}

AVAILABLE SERVICES:
{{services_catalog}}

Generate a LinkedIn sales post for The Event following strictly the system prompt rules.
Use the "{{angle}}" angle and highlight the indicated service(s).
Make sure the content is fresh, original and different from the recent posts listed above.'
WHERE name = 'linkedin_weekly_v1';
