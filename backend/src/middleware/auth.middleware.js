import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function requireAuth(roles = []) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const payload = jwt.verify(token, config.jwtSecret);
      req.user = payload;
      if (roles.length && !roles.includes(payload.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

export function requireVoterForElection(req, res, next) {
  const electionId = Number(req.body?.electionId ?? req.query?.electionId);
  if (req.user.role !== 'Voter') {
    return res.status(403).json({ error: 'Voter token required' });
  }
  if (req.user.electionId !== electionId) {
    return res.status(403).json({ error: 'Token is not valid for this election' });
  }
  next();
}
