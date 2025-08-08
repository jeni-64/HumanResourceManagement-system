import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schema
const trainingProgramSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  isActive: z.boolean().optional()
});

// Middleware for validation
const validateTrainingProgram = (req, res, next) => {
  try {
    req.body = trainingProgramSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ errors: error.errors });
  }
};

// GET /: List programs (paginated, filter by isActive)
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']),
  async (req, res) => {
    const { page = 1, limit = 10, isActive } = req.query;
    const filters = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    try {
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [programs, total] = await Promise.all([
        prisma.trainingProgram.findMany({
          where: filters,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.trainingProgram.count({ where: filters })
      ]);

      res.json({
        programs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// GET /:id: Get program details
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']),
  async (req, res) => {
    const { id } = req.params;
    try {
      const program = await prisma.trainingProgram.findUnique({ where: { id } });
      if (!program) return res.status(404).json({ error: 'Program not found' });
      res.json(program);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /: Create program
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['ADMIN', 'HR']),
  validateTrainingProgram,
  async (req, res) => {
    try {
      const newProgram = await prisma.trainingProgram.create({ data: req.body });
      res.status(201).json(newProgram);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// PUT /:id: Update program
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['ADMIN', 'HR']),
  validateTrainingProgram,
  async (req, res) => {
    const { id } = req.params;
    try {
      const updatedProgram = await prisma.trainingProgram.update({
        where: { id },
        data: req.body
      });
      res.json(updatedProgram);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Program not found' });
      }
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// DELETE /:id: Soft delete program (set isActive = false)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['ADMIN', 'HR']),
  async (req, res) => {
    const { id } = req.params;
    try {
      const program = await prisma.trainingProgram.update({
        where: { id },
        data: { isActive: false }
      });
      res.json({ message: 'Program deactivated', program });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Program not found' });
      }
      res.status(500).json({ error: 'Server error' });
    }
  }
);

export default router;
