import { Router } from 'express';
import {
  assertFreshFaceVerification,
  authenticateOrganizer,
  issueOrganizerToken,
  issueVoterToken,
  getFacultyOptions,
  registerStudentAccount,
  recordBadgeAuth,
  validateStudentCode,
  verifyEnrollment,
} from '../services/auth.service.js';
import { extractFacultyScopeFromTitle, getElectionDetail } from '../services/electionAdmin.service.js';

const router = Router();

router.get('/faculties', (_req, res) => {
  res.json({ faculties: getFacultyOptions() });
});

router.post('/badge', async (req, res, next) => {
  try {
    const { studentCode, electionId, faceVerified, faceVerifiedAt } = req.body;
    if (!studentCode || electionId == null) {
      return res.status(400).json({ error: 'studentCode and electionId are required' });
    }

    const normalized = validateStudentCode(studentCode);
    assertFreshFaceVerification({ faceVerified, faceVerifiedAt });
    const enrollment = await verifyEnrollment(normalized);
    const election = await getElectionDetail(electionId);
    const requiredFaculty = extractFacultyScopeFromTitle(election.title);

    if (requiredFaculty && enrollment.faculty && enrollment.faculty.toUpperCase() !== requiredFaculty) {
      await recordBadgeAuth({
        studentCode: normalized,
        electionId,
        success: false,
        source: enrollment.source,
        ipAddress: req.ip,
      });
      return res.status(403).json({
        error: `Student is not eligible for faculty-scoped election (${requiredFaculty})`,
        code: 'FACULTY_NOT_ELIGIBLE',
      });
    }

    if (!enrollment.enrolled) {
      await recordBadgeAuth({
        studentCode: normalized,
        electionId,
        success: false,
        source: enrollment.source,
        ipAddress: req.ip,
      });
      return res.status(403).json({ error: 'Student is not eligible', code: 'NOT_ELIGIBLE' });
    }

    const session = issueVoterToken({ studentCode: normalized, electionId });
    await recordBadgeAuth({
      studentCode: normalized,
      electionId,
      voterHash: session.voterHash,
      success: true,
      source: enrollment.source,
      ipAddress: req.ip,
    });

    res.json({
      token: session.token,
      electionId: session.electionId,
      voterHash: session.voterHash,
      enrollmentSource: enrollment.source,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });
  } catch (e) {
    next(e);
  }
});

router.post('/admin/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const organizer = await authenticateOrganizer(email, password);
    if (!organizer) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = issueOrganizerToken({ email: organizer.email, role: organizer.role });
    res.json({ token, role: organizer.role });
  } catch (e) {
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const organizer = await authenticateOrganizer(email, password);
    if (!organizer) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = issueOrganizerToken({ email: organizer.email, role: organizer.role });
    res.json({ token, role: organizer.role });
  } catch (e) {
    next(e);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, faculty } = req.body;
    if (!email || !password || !faculty) {
      return res.status(400).json({ error: 'email, password, and faculty are required' });
    }

    const account = await registerStudentAccount({ email, password, faculty });
    res.status(201).json({
      success: true,
      userId: account.id,
      faculty: account.faculty,
      role: account.role,
      message: 'Account created successfully.',
    });
  } catch (e) {
    next(e);
  }
});

export default router;
