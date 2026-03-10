import { Router, Request, Response } from 'express';
import { generateWeeklyPost } from '../services/content-generator';
import * as linkedin from '../services/linkedin';
import { query } from '../config/database';
import { logAudit } from '../utils/audit';
import { logger } from '../utils/logger';

const router = Router();

// n8n calls this endpoint to trigger weekly generation
router.post('/generate-and-publish', async (req: Request, res: Response) => {
  const authHeader = req.headers['x-webhook-secret'];
  if (authHeader !== process.env.WEBHOOK_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    logger.info('Weekly generation triggered by n8n');
    const result = await generateWeeklyPost();

    // Check if auto-publish is enabled
    const linkedinConfig = await query("SELECT value FROM app_settings WHERE key = 'linkedin_config'");
    const config = linkedinConfig.rows[0]?.value || {};

    if (config.publish_enabled && result.status !== 'review_pending') {
      const post = await query('SELECT * FROM posts_archive WHERE id = \$1', [result.postId]);
      const publishResult = await linkedin.publishPost(post.rows[0].body);

      if (publishResult.success) {
        await query(
          'UPDATE posts_archive SET status=\$1, linkedin_post_id=\$2, linkedin_post_url=\$3, published_at=NOW() WHERE id=\$4',
          ['published', publishResult.postId, publishResult.postUrl, result.postId]
        );
        await logAudit('auto_published', 'n8n', 'posts_archive', result.postId);
        return res.json({ ...result, published: true, linkedinPostId: publishResult.postId });
      } else {
        await query('UPDATE posts_archive SET status=\$1, error_message=\$2 WHERE id=\$3',
          ['queued', publishResult.error, result.postId]);
        await logAudit('auto_publish_failed', 'n8n', 'posts_archive', result.postId, { error: publishResult.error });
        return res.json({ ...result, published: false, error: publishResult.error });
      }
    }

    res.json({ ...result, published: false, reason: 'Auto-publish disabled or manual approval required' });
  } catch (err: any) {
    logger.error('Weekly generation failed', { error: err.message });
    await logAudit('generation_error', 'n8n', 'system', undefined, { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

export default router;
