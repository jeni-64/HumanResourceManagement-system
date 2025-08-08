import express from 'express';
import { z } from 'zod';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Validation Schemas
const interviewSchema = z.object({
  applicationId: z.string().uuid('Invalid application ID'),
  scheduledAt: z.string().datetime('Invalid date format'),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
});

const listSchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val)) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(parseInt(val), 100) : 10)),
  applicationId: z.string().uuid('Invalid application ID').optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
});

// Middleware
const validateInterview = (req, res, next) => {
  const result = interviewSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.format() });
  req.validatedData = result.data;
  next();
};

const validateList = (req, res, next) => {
  const result = listSchema.safeParse(req.query);
  if (!result.success) return res.status(400).json({ error: result.error.format() });
  req.validatedData = result.data;
  next();
};

// GET / - List interviews
router.get('/', authMiddleware, roleMiddleware(['ADMIN', 'HR']), validateList, async (req, res) => {
  const { page, limit, applicationId, status } = req.validatedData;
  const filters = {};
  if (applicationId) filters.applicationId = applicationId;
  if (status) filters.status = status;

  try {
    // Placeholder (replace with Prisma)
    const interviews = [];
    const total = 0;

    res.json({
      success: true,
      data: { interviews, total, page, limit },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /:id - Get interview details
router.get('/:id', authMiddleware, roleMiddleware(['ADMIN', 'HR']), async (req, res) => {
  const { id } = req.params;
  try {
    // Placeholder (replace with Prisma)
    const interview = { id, applicationId: 'uuid', scheduledAt: '2025-08-01T10:00:00Z' };
    if (!interview) return res.status(404).json({ error: 'Interview not found' });

    res.json({
      success: true,
      data: interview,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST / - Create interview
router.post('/', authMiddleware, roleMiddleware(['ADMIN', 'HR']), validateInterview, async (req, res) => {
  const { applicationId, scheduledAt, status = 'SCHEDULED' } = req.validatedData;
  try {
    // Placeholder (replace with Prisma)
    const newInterview = { id: 'uuid', applicationId, scheduledAt, status };

    res.status(201).json({
      success: true,
      data: newInterview,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /:id - Update interview
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN', 'HR']), validateInterview, async (req, res) => {
  const { id } = req.params;
  const { applicationId, scheduledAt, status } = req.validatedData;
  try {
    // Placeholder (replace with Prisma)
    const updatedInterview = { id, applicationId, scheduledAt, status };

    res.json({
      success: true,
      data: updatedInterview,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /:id - Delete interview
router.delete('/:id', authMiddleware, roleMiddleware(['ADMIN', 'HR']), async (req, res) => {
  const { id } = req.params;
  try {
    // Placeholder (replace with Prisma)
    res.json({
      success: true,
      message: 'Interview deleted',
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
