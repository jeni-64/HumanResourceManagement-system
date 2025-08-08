import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, roleMiddleware, employeeOwnRecordMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schema
const trainingRecordSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  programId: z.string().uuid('Invalid program ID')
});

// Middleware for validation
const validateTrainingRecord = (req, res, next) => {
  try {
    req.body = trainingRecordSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ errors: error.errors });
  }
};

// GET /: List records (paginated, filter by employeeId, programId)
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['ADMIN', 'HR', 'EMPLOYEE']),
  employeeOwnRecordMiddleware('trainingRecord'),
  async (req, res) => {
    const { page = 1, limit = 10, employeeId, programId } = req.query;
    const filters = {};
    if (employeeId) filters.employeeId = employeeId;
    if (programId) filters.programId = programId;

    try {
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [records, total] = await Promise.all([
        prisma.trainingRecord.findMany({
          where: filters,
          include: {
            employee: { select: { firstName: true, lastName: true, employeeId: true } },
            program: { select: { name: true, isActive: true } }
          },
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.trainingRecord.count({ where: filters })
      ]);

      res.json({
        records,
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

// GET /:id: Get record details
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['ADMIN', 'HR', 'EMPLOYEE']),
  employeeOwnRecordMiddleware('trainingRecord'),
  async (req, res) => {
    const { id } = req.params;
    try {
      const record = await prisma.trainingRecord.findUnique({
        where: { id },
        include: {
          employee: { select: { firstName: true, lastName: true, employeeId: true } },
          program: { select: { name: true, isActive: true } }
        }
      });

      if (!record) return res.status(404).json({ error: 'Record not found' });

      res.json(record);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /: Create record
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['ADMIN', 'HR']),
  validateTrainingRecord,
  async (req, res) => {
    try {
      const newRecord = await prisma.trainingRecord.create({ data: req.body });
      res.status(201).json(newRecord);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// PUT /:id: Update record
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['ADMIN', 'HR']),
  validateTrainingRecord,
  async (req, res) => {
    const { id } = req.params;
    try {
      const updatedRecord = await prisma.trainingRecord.update({
        where: { id },
        data: req.body
      });
      res.json(updatedRecord);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Record not found' });
      }
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// DELETE /:id: Delete record
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['ADMIN', 'HR']),
  async (req, res) => {
    const { id } = req.params;
    try {
      await prisma.trainingRecord.delete({ where: { id } });
      res.json({ message: 'Training record deleted' });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Record not found' });
      }
      res.status(500).json({ error: 'Server error' });
    }
  }
);

export default router;
