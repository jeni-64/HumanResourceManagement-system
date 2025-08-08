import express from 'express';
import { z } from 'zod';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Validation Schemas
const jobApplicationSchema = z.object({
  jobPostingId: z.string().uuid('Invalid job posting ID'),
  firstName: z.string().min(1, 'First name is required'),
  email: z.string().email('Invalid email'),
  status: z.enum(['APPLIED', 'UNDER_REVIEW', 'INTERVIEW', 'REJECTED', 'HIRED']).optional(),
});

const listSchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val)) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(parseInt(val), 100) : 10)),
  jobPostingId: z.string().uuid('Invalid job posting ID').optional(),
  status: z.enum(['APPLIED', 'UNDER_REVIEW', 'INTERVIEW', 'REJECTED', 'HIRED']).optional(),
});

// Middleware
const validateJobApplication = (req, res, next) => {
  const result = jobApplicationSchema.safeParse(req.body);
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

// GET / - List applications
router.get('/', authMiddleware, roleMiddleware(['ADMIN', 'HR']), validateList, async (req, res) => {
  const { page, limit, jobPostingId, status } = req.validatedData;
  const filters = {};
  if (jobPostingId) filters.jobPostingId = jobPostingId;
  if (status) filters.status = status;

  try {
    // Placeholder (replace with Prisma)
    const applications = [];
    const total = 0;

    res.json({
      success: true,
      data: {
        applications,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /:id - Get application details
router.get('/:id', authMiddleware, roleMiddleware(['ADMIN', 'HR']), async (req, res) => {
  const { id } = req.params;
  try {
    // Placeholder (replace with Prisma)
    const application = { id, jobPostingId: 'uuid', firstName: 'John', email: 'john@example.com', status: 'APPLIED' };
    if (!application) return res.status(404).json({ error: 'Application not found' });

    res.json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST / - Create application (public)
router.post('/', validateJobApplication, async (req, res) => {
  const { jobPostingId, firstName, email, status = 'APPLIED' } = req.validatedData;
  try {
    // Placeholder (replace with Prisma)
    const newApplication = { id: 'uuid', jobPostingId, firstName, email, status };

    res.status(201).json({ success: true, data: newApplication });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /:id - Update application
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN', 'HR']), validateJobApplication, async (req, res) => {
  const { id } = req.params;
  const { jobPostingId, firstName, email, status } = req.validatedData;
  try {
    // Placeholder (replace with Prisma)
    const updatedApplication = { id, jobPostingId, firstName, email, status };

    res.json({ success: true, data: updatedApplication });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /:id - Delete application
router.delete('/:id', authMiddleware, roleMiddleware(['ADMIN', 'HR']), async (req, res) => {
  const { id } = req.params;
  try {
    // Placeholder (replace with Prisma)
    res.json({ success: true, message: 'Application deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
