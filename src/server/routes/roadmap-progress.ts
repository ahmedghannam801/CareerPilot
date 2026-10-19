import { Request, Response, Router } from 'express';
function getReqUserId(req: Request): string | undefined {
  const custom = req.headers['x-user-id'] as string;
  if (custom && custom.trim()) return custom.trim();
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.substring(7);
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        if (payload.sub) return payload.sub;
      }
    } catch {}
  }
  return undefined;
}
import { getSupabaseClient } from '../db/supabase.js';

export const roadmapProgressRouter = Router();

function getClient() { return getSupabaseClient(); }

roadmapProgressRouter.post('/enroll', async (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { roadmapId, phaseId } = req.body;
    const supabase = getClient();
    if (!supabase) return res.status(503).json({ error: 'DB unavailable' });
    const { error } = await supabase.from('user_roadmap_enrollments').upsert({
      user_id: userId,
      roadmap_id: roadmapId,
      phase_id: phaseId || null,
      enrolled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,roadmap_id' });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, enrolled: true });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

roadmapProgressRouter.get('/enrollments', async (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const supabase = getClient();
    if (!supabase) return res.status(503).json({ error: 'DB unavailable' });
    const { data, error } = await supabase.from('user_roadmap_enrollments').select('*').eq('user_id', userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, enrollments: data || [] });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

roadmapProgressRouter.post('/:nodeId/progress', async (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { completed, progressPercentage } = req.body;
    const supabase = getClient();
    if (!supabase) return res.status(503).json({ error: 'DB unavailable' });
    const { error } = await supabase.from('weekly_learning_plans').upsert({
      user_id: userId,
      plan_id: req.params.nodeId,
      progress_percentage: progressPercentage || (completed ? 100 : 0),
      completed: completed || false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,plan_id' });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, progress: { nodeId: req.params.nodeId, completed, progressPercentage } });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});

roadmapProgressRouter.get('/:nodeId/progress', async (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const supabase = getClient();
    if (!supabase) return res.status(503).json({ error: 'DB unavailable' });
    const { data } = await supabase.from('weekly_learning_plans').select('*').eq('user_id', userId).eq('plan_id', req.params.nodeId).single();
    return res.json({ success: true, progress: data || { progress_percentage: 0, completed: false } });
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
});
