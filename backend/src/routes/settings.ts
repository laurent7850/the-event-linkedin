import { Router, Response } from 'express';
import { query } from '../config/database';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/services', requireAuth, async (req: AuthRequest, res: Response) => {
  const result = await query('SELECT * FROM services_catalog ORDER BY name');
  res.json(result.rows);
});

router.put('/services/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, description, is_active } = req.body;
  await query('UPDATE services_catalog SET name=\$1, description=\$2, is_active=\$3 WHERE id=\$4',
    [name, description, is_active, req.params.id]);
  res.json({ ok: true });
});

router.get('/prompts', requireAuth, async (req: AuthRequest, res: Response) => {
  const result = await query('SELECT * FROM editorial_prompts ORDER BY created_at DESC');
  res.json(result.rows);
});

router.put('/prompts/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, system_prompt, user_prompt_template, is_active } = req.body;
  await query('UPDATE editorial_prompts SET name=\$1, system_prompt=\$2, user_prompt_template=\$3, is_active=\$4 WHERE id=\$5',
    [name, system_prompt, user_prompt_template, is_active, req.params.id]);
  res.json({ ok: true });
});

router.get('/settings', requireAuth, async (req: AuthRequest, res: Response) => {
  const result = await query('SELECT * FROM app_settings');
  const settings: Record<string, any> = {};
  result.rows.forEach((r: any) => { settings[r.key] = r.value; });
  res.json(settings);
});

router.put('/settings/:key', requireAuth, async (req: AuthRequest, res: Response) => {
  const { value } = req.body;
  await query('INSERT INTO app_settings (key, value) VALUES (\$1, \$2) ON CONFLICT (key) DO UPDATE SET value = \$2',
    [req.params.key, JSON.stringify(value)]);
  res.json({ ok: true });
});

router.get('/audit', requireAuth, async (req: AuthRequest, res: Response) => {
  const { limit = '100' } = req.query;
  const result = await query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT \$1',
    [parseInt(limit as string, 10)]);
  res.json(result.rows);
});

router.get('/dashboard', requireAuth, async (req: AuthRequest, res: Response) => {
  const [lastPublished, totalPosts, recentErrors, statusCounts, serviceCounts] = await Promise.all([
    query("SELECT * FROM posts_archive WHERE status = 'published' AND deleted_at IS NULL ORDER BY published_at DESC LIMIT 1"),
    query('SELECT COUNT(*) FROM posts_archive WHERE deleted_at IS NULL'),
    query("SELECT * FROM posts_archive WHERE status = 'failed' AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 5"),
    query("SELECT status, COUNT(*) FROM posts_archive WHERE deleted_at IS NULL GROUP BY status"),
    query("SELECT unnest(service_tags) as service, COUNT(*) FROM posts_archive WHERE deleted_at IS NULL GROUP BY service ORDER BY count DESC"),
  ]);

  res.json({
    lastPublished: lastPublished.rows[0] || null,
    totalPosts: parseInt(totalPosts.rows[0].count, 10),
    recentErrors: recentErrors.rows,
    statusCounts: statusCounts.rows,
    serviceCounts: serviceCounts.rows,
  });
});

router.get('/export', requireAuth, async (req: AuthRequest, res: Response) => {
  const { format = 'json' } = req.query;
  const result = await query('SELECT * FROM posts_archive WHERE deleted_at IS NULL ORDER BY generated_at DESC');
  if (format === 'csv') {
    const header = 'id,title,hook,status,generated_at,published_at\n';
    const rows = result.rows.map((r: any) =>
      [r.id, '"' + (r.title||'').replace(/"/g,'""') + '"', '"' + (r.hook||'').replace(/"/g,'""') + '"', r.status, r.generated_at, r.published_at].join(',')
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=posts-export.csv');
    res.send(header + rows);
  } else {
    res.json(result.rows);
  }
});

export default router;
