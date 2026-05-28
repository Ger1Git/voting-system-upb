import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  organizerCloseVoting,
  organizerCreateElection,
  organizerOpenVoting,
  organizerPublishResults,
} from '../services/electionAdmin.service.js';

const router = Router();

router.use(requireAuth(['Admin', 'Organizer']));

/** Organizer: create election pool and candidates — cannot read or alter votes. */
router.post('/elections', async (req, res, next) => {
  try {
    const { title, startTime, endTime, candidates } = req.body;
    if (!title || startTime == null || endTime == null) {
      return res.status(400).json({ error: 'title, startTime, endTime are required' });
    }
    const result = await organizerCreateElection({
      title,
      startTime: Number(startTime),
      endTime: Number(endTime),
      candidates: candidates ?? [],
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/elections/:id/open', async (req, res, next) => {
  try {
    const result = await organizerOpenVoting(req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/elections/:id/close', async (req, res, next) => {
  try {
    const result = await organizerCloseVoting(req.params.id);
    res.json({
      ...result,
      message: 'Voting closed. Students reveal their own ballots; organizer cannot tally.',
    });
  } catch (e) {
    next(e);
  }
});

/** Only opens public result view — totals already computed from voter reveals on chain. */
router.post('/elections/:id/publish', async (req, res, next) => {
  try {
    const result = await organizerPublishResults(req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
