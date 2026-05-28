import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  castVote,
  getVoteReceipt,
  getVoteStatus,
  revealVote,
} from '../services/voting.service.js';

const router = Router();

router.get('/status', requireAuth(['Voter']), async (req, res, next) => {
  try {
    const electionId = Number(req.query.electionId ?? req.user.electionId);
    if (req.user.electionId !== electionId) {
      return res.status(403).json({ error: 'Token is not valid for this election' });
    }
    const status = await getVoteStatus(electionId, req.user.voterHash);
    res.json(status);
  } catch (e) {
    next(e);
  }
});

router.get('/receipt', requireAuth(['Voter']), async (req, res, next) => {
  try {
    const electionId = Number(req.query.electionId ?? req.user.electionId);
    if (req.user.electionId !== electionId) {
      return res.status(403).json({ error: 'Token is not valid for this election' });
    }
    const receipt = await getVoteReceipt(electionId, req.user.voterHash);
    res.json(receipt);
  } catch (e) {
    next(e);
  }
});

/**
 * Body: { electionId, commitment } from browser (preferred)
 *   or { electionId, candidateId, nonce } computed server-side but NOT stored.
 */
router.post('/', requireAuth(['Voter']), async (req, res, next) => {
  try {
    const { electionId, commitment, candidateId, nonce } = req.body;
    if (electionId == null) {
      return res.status(400).json({ error: 'electionId is required' });
    }
    if (req.user.electionId !== Number(electionId)) {
      return res.status(403).json({ error: 'Token is not valid for this election' });
    }

    const result = await castVote({
      electionId,
      voterHash: req.user.voterHash,
      commitment,
      candidateId,
      nonce,
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

/** After voting closes — only the voter can unlock their count contribution. */
router.post('/reveal', requireAuth(['Voter']), async (req, res, next) => {
  try {
    const { electionId, candidateId, nonce } = req.body;
    if (electionId == null || candidateId == null || !nonce) {
      return res.status(400).json({ error: 'electionId, candidateId, and nonce are required' });
    }
    if (req.user.electionId !== Number(electionId)) {
      return res.status(403).json({ error: 'Token is not valid for this election' });
    }

    const result = await revealVote({
      electionId,
      voterHash: req.user.voterHash,
      candidateId,
      nonce,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
