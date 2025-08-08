import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schema
const settingSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string().min(1, 'Value is required'),
  category: z.string().optional(),
  isPublic: z.boolean().optional()
});

// Middleware for validation
const validateSetting = (req, res, next) => {
  try {
    req.body = settingSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ errors: error.errors });
  }
};

// GET /: List settings (paginated, filter by category, isPublic)
router.get('/', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  const { page = 1, limit = 10, category, isPublic } = req.query;

  const filters = {};
  if (category) filters.category = category;
  if (isPublic !== undefined) filters.isPublic = isPublic === 'true';

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [settings, total] = await Promise.all([
      prisma.setting.findMany({
        where: filters,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.setting.count({ where: filters })
    ]);

    res.json({
      settings,
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
});

// GET /:id: Get setting details
router.get('/:id', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  const { id } = req.params;
  try {
    const setting = await prisma.setting.findUnique({ where: { id } });
    if (!setting) return res.status(404).json({ error: 'Setting not found' });
    res.json(setting);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /: Create setting
router.post('/', authMiddleware, roleMiddleware(['ADMIN']), validateSetting, async (req, res) => {
  try {
    const newSetting = await prisma.setting.create({ data: req.body });
    res.status(201).json(newSetting);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /:id: Update setting
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN']), validateSetting, async (req, res) => {
  const { id } = req.params;
  try {
    const updatedSetting = await prisma.setting.update({
      where: { id },
      data: req.body
    });
    res.json(updatedSetting);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Setting not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /:id: Delete setting
router.delete('/:id', authMiddleware, roleMiddleware(['ADMIN']), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.setting.delete({ where: { id } });
    res.json({ message: 'Setting deleted' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Setting not found' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
