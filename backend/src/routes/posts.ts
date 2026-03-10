import { Router, Response } from 'express';
import { query } from '../config/database';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';
import { generateWeeklyPost } from '../services/content-generator';
import * as linkedin from '../services/linkedin';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { status, search, service, limit = '50', offset = '0' } = req.query;
  let sql = 'SELECT * FROM posts_archive WHERE deleted_at IS NULL';
  const params: any[] = [];
  let i = 1;

  if (status) { sql += ' AND status = \$' + i++; params.push(status); }
  if (search) { sql += ' AND body ILIKE \$' + i++; params.push('%' + search + '%'); }
  if (service) { sql += ' AND \$' + i++ + ' = ANY(service_tags)'; params.push(service); }

  sql += ' ORDER BY generated_at DESC LIMIT \$' + i++ + ' OFFSET \$' + i++;
  params.push(parseInt(limit as string, 10), parseInt(offset as string, 10));

  const result = await query(sql, params);
  const countResult = await query('SELECT COUNT(*) FROM posts_archive WHERE deleted_at IS NULL');
  res.json({ posts: result.rows, total: parseInt(countResult.rows[0].count, 10) });
});

router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const result = await query('SELECT * FROM posts_archive WHERE id = \$1 AND deleted_at IS NULL', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
  res.json(result.rows[0]);
});

router.post('/generate', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await generateWeeklyPost();
    await logAudit('manual_generation', req.user!.email, 'posts_archive', result.postId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/approve', requireAuth, async (req: AuthRequest, res: Response) => {
  await query('UPDATE posts_archive SET status = \$1, approved_by = \$2, approved_at = NOW() WHERE id = \$3',
    ['approved', req.user!.email, req.params.id]);
  await logAudit('post_approved', req.user!.email, 'posts_archive', req.params.id);
  res.json({ ok: true });
});

router.post('/:id/publish', requireAuth, async (req: AuthRequest, res: Response) => {
  const postResult = await query('SELECT * FROM posts_archive WHERE id = \$1 AND deleted_at IS NULL', [req.params.id]);
  if (postResult.rows.length === 0) return res.status(404).json({ error: 'Post not found' });

  const post = postResult.rows[0];
  const result = await linkedin.publishPost(post.body);

  if (result.success) {
    await query('UPDATE posts_archive SET status=\$1, linkedin_post_id=\$2, linkedin_post_url=\$3, published_at=NOW() WHERE id=\$4',
      ['published', result.postId, result.postUrl, req.params.id]);
    await logAudit('post_published', req.user!.email, 'posts_archive', req.params.id, { linkedinPostId: result.postId });
  } else {
    await query('UPDATE posts_archive SET status=\$1, error_message=\$2, retry_count=retry_count+1 WHERE id=\$3',
      ['failed', result.error, req.params.id]);
    await logAudit('post_publish_failed', req.user!.email, 'posts_archive', req.params.id, { error: result.error });
  }
  res.json(result);
});

router.post('/:id/queue', requireAuth, async (req: AuthRequest, res: Response) => {
  await query('UPDATE posts_archive SET status = \$1 WHERE id = \$2', ['queued', req.params.id]);
  res.json({ ok: true });
});

router.post('/:id/clone', requireAuth, async (req: AuthRequest, res: Response) => {
  const orig = await query('SELECT * FROM posts_archive WHERE id = \$1', [req.params.id]);
  if (orig.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  const p = orig.rows[0];
  const ins = await query(
    `INSERT INTO posts_archive (title, hook, body, cta, hashtags, status, service_tags, theme_tags, language, notes)
     VALUES (\$1,\$2,\$3,\$4,\$5,'draft',\$6,\$7,\$8,\$9) RETURNING id`,
    [p.title + ' (copie)', p.hook, p.body, p.cta, p.hashtags, p.service_tags, p.theme_tags, p.language, 'Clone de ' + p.id]
  );
  res.json({ id: ins.rows[0].id });
});

router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const { title, hook, body, cta, hashtags, notes, status } = req.body;
  await query('UPDATE posts_archive SET title=\$1,hook=\$2,body=\$3,cta=\$4,hashtags=\$5,notes=\$6,status=COALESCE(\$7,status) WHERE id=\$8',
    [title, hook, body, cta, hashtags, notes, status, req.params.id]);
  await logAudit('post_updated', req.user!.email, 'posts_archive', req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  await query('UPDATE posts_archive SET deleted_at = NOW() WHERE id = \$1', [req.params.id]);
  await logAudit('post_deleted', req.user!.email, 'posts_archive', req.params.id);
  res.json({ ok: true });
});

export default router;
