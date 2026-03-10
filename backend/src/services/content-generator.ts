import { query } from '../config/database';
import { generateContent } from './openrouter';
import { logAudit } from '../utils/audit';
import { logger } from '../utils/logger';

const ANGLES = [
  'service', 'client_problem', 'social_proof', 'seasonality',
  'corporate', 'private_event', 'staffing', 'experience',
  'quality', 'call_to_action',
];

function getSeasonContext(): string {
  const month = new Date().getMonth();
  const seasons: Record<number, string> = {
    0: 'January - New year, fresh start',
    1: 'February - Corporate season',
    2: 'March - Spring, trade shows',
    3: 'April - Team building',
    4: 'May - Outdoor, garden parties',
    5: 'June - End of corporate season',
    6: 'July - Summer, festivals',
    7: 'August - Back-to-business prep',
    8: 'September - Back to business, kick-offs',
    9: 'October - Autumn, evening events',
    10: 'November - Holiday season approaching',
    11: 'December - Christmas, receptions',
  };
  return seasons[month] || '';
}

function selectAngle(recentAngles: string[]): string {
  const available = ANGLES.filter(a => !recentAngles.slice(0, 3).includes(a));
  if (available.length === 0) return ANGLES[Math.floor(Math.random() * ANGLES.length)];
  return available[Math.floor(Math.random() * available.length)];
}

function selectServices(allServices: any[]): any[] {
  const active = allServices.filter((s: any) => s.is_active);
  const count = Math.random() > 0.6 ? 2 : 1;
  return active.sort(() => Math.random() - 0.5).slice(0, count);
}

export async function generateWeeklyPost(): Promise<{ postId: string; status: string; content: any }> {
  const promptResult = await query('SELECT * FROM editorial_prompts WHERE is_active = true ORDER BY created_at DESC LIMIT 1');
  if (promptResult.rows.length === 0) throw new Error('No active editorial prompt found');
  const prompt = promptResult.rows[0];

  const servicesResult = await query('SELECT * FROM services_catalog WHERE is_active = true');
  const allServices = servicesResult.rows;

  const recentResult = await query(
    'SELECT hook, body, theme_tags, service_tags, generated_at FROM posts_archive WHERE deleted_at IS NULL ORDER BY generated_at DESC LIMIT 10'
  );
  const recentPosts = recentResult.rows;
  const recentAngles = recentPosts.flatMap((p: any) => p.theme_tags || []);

  const angle = selectAngle(recentAngles);
  const selectedServices = selectServices(allServices);

  const userPrompt = prompt.user_prompt_template
    .replace('{{date}}', new Date().toLocaleDateString('fr-BE'))
    .replace('{{angle}}', angle)
    .replace('{{services}}', selectedServices.map((s: any) => s.name + ': ' + s.description).join('\n'))
    .replace('{{season_context}}', getSeasonContext())
    .replace('{{recent_posts}}', recentPosts.map((p: any, i: number) =>
      'Post ' + (i+1) + ': ' + (p.hook || p.body.substring(0, 100)) + '...'
    ).join('\n'))
    .replace('{{services_catalog}}', allServices.map((s: any) => '- ' + s.name + ': ' + s.description).join('\n'));

  logger.info('Generating weekly post', { angle, services: selectedServices.map((s: any) => s.slug) });
  const result = await generateContent(prompt.system_prompt, userPrompt);

  let parsed: any;
  try { parsed = JSON.parse(result.content); }
  catch { throw new Error('AI response was not valid JSON'); }

  const body = parsed.body || '';
  const editorialConfig = await query("SELECT value FROM app_settings WHERE key = 'editorial_config'");
  const config = editorialConfig.rows[0]?.value || {};

  let similarityScore = 0;
  if (recentPosts.length > 0) {
    const simResult = await query(
      "SELECT MAX(similarity(body, $1)) as max_sim FROM posts_archive WHERE deleted_at IS NULL AND generated_at > NOW() - INTERVAL '90 days'",
      [body]
    );
    similarityScore = parseFloat(simResult.rows[0]?.max_sim || '0');
  }

  const manualApproval = config.manual_approval || false;
  const status = manualApproval ? 'review_pending' : 'generated';

  const insertResult = await query(
    `INSERT INTO posts_archive
     (title, hook, body, cta, hashtags, status, service_tags, theme_tags, language, generation_model, generation_meta, similarity_score, approval_required, hook_variants, short_version, scheduled_for)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, NOW()) RETURNING id`,
    [parsed.title||'Post LinkedIn', parsed.hook||'', body, parsed.cta||'', parsed.hashtags||[], status,
     parsed.service_tags||selectedServices.map((s:any)=>s.slug), parsed.theme_tags||[angle], 'en', result.model,
     JSON.stringify({usage:result.usage,cost:result.cost,angle,prompt_version:prompt.version}),
     similarityScore, manualApproval, JSON.stringify(parsed.hook_variants||[]), parsed.short_version||'']
  );

  const postId = insertResult.rows[0].id;
  await logAudit('post_generated', 'system', 'posts_archive', postId, { angle, model: result.model, similarity: similarityScore });
  logger.info('Weekly post generated', { postId, status, similarity: similarityScore });
  return { postId, status, content: parsed };
}
