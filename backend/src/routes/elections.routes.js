import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getElectionDetail, listElections } from '../services/electionAdmin.service.js';
import { getElectionResults } from '../services/voting.service.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const elections = await listElections();
    res.json({ elections });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const election = await getElectionDetail(req.params.id);
    res.json(election);
  } catch (e) {
    next(e);
  }
});

router.get('/:id/results', async (req, res, next) => {
  try {
    const results = await getElectionResults(req.params.id);
    res.json(results);
  } catch (e) {
    next(e);
  }
});

export default router;
