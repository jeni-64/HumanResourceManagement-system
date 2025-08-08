import express from 'express';
import { z } from 'zod';
import { checkRole, validateRequest, checkOwnership } from '../middleware/index.js';
import OnboardingTask from '../models/OnboardingTask.js'; // Assuming this is where the model is

const router = express.Router();

// Validation schemas
const onboardingTaskSchema = z.object({
  templateId: z.string().uuid('Invalid template ID').optional(),
  employeeId: z.string().uuid('Invalid employee ID'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], {
    errorMap: () => ({ message: 'Invalid status' }),
  }).optional(),
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
});

const onboardingTaskUpdateSchema = z.object({
  templateId: z.string().uuid('Invalid template ID').optional(),
  employeeId: z.string().uuid('Invalid employee ID').optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], {
    errorMap: () => ({ message: 'Invalid status' }),
  }).optional(),
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
});

// Middleware for role-based access
const adminOrHr = checkRole(['ADMIN', 'HR']);
const adminHrOrEmployee = checkRole(['ADMIN', 'HR', 'EMPLOYEE']);

// GET /: List tasks (paginated, filter by employeeId, status)
router.get('/', adminHrOrEmployee, async (req, res) => {
  try {
    const { page = 1, limit = 10, employeeId, status } = req.query;
    const filters = {};

    // Restrict EMPLOYEE to their own tasks
    if (req.user.role === 'EMPLOYEE') {
      filters.employeeId = req.user.id;
    } else if (employeeId) {
      filters.employeeId = employeeId;
    }

    if (status) filters.status = status;

    const tasks = await OnboardingTask.find(filters)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await OnboardingTask.countDocuments(filters);

    res.json({
      data: tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id: Get task details (ADMIN, HR, EMPLOYEE for own)
router.get('/:id', adminHrOrEmployee, checkOwnership('OnboardingTask', 'EMPLOYEE', 'employeeId'), async (req, res) => {
  try {
    const task = await OnboardingTask.findById(req.params.id).lean();
    if (!task) {
      return res.status(404).json({ error: 'Onboarding task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /: Create task
router.post('/', adminOrHr, validateRequest(onboardingTaskSchema), async (req, res) => {
  try {
    const task = new OnboardingTask(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /:id: Update task
router.put('/:id', adminOrHr, validateRequest(onboardingTaskUpdateSchema), async (req, res) => {
  try {
    const task = await OnboardingTask.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!task) {
      return res.status(404).json({ error: 'Onboarding task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /:id: Delete task
router.delete('/:id', adminOrHr, async (req, res) => {
  try {
    const task = await OnboardingTask.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Onboarding task not found' });
    }
    res.json({ message: 'Onboarding task deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
