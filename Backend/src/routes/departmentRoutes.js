// src/routes/departmentRoutes.js
import express from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import prisma from '../config/prisma.js';
import { AppError, ValidationError } from '../utils/errors.js';
import { createAuditLog } from '../middleware/auditMiddleware.js';

const router = express.Router();

// Validation schemas
const departmentSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    managerId: z.string().uuid().optional(),
    parentId: z.string().uuid().optional(),
    isActive: z.boolean().optional(),
    description: z.string().optional(),
  }),
});

const updateDepartmentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid department ID'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    managerId: z.string().uuid().optional(),
    parentId: z.string().uuid().optional(),
    isActive: z.boolean().optional(),
    description: z.string().optional(),
  }),
});

const listDepartmentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    isActive: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
    parentId: z.string().uuid().optional(),
    search: z.string().optional(),
  }),
});

// GET / - List departments
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'HR', 'MANAGER'),
  validate(listDepartmentsSchema),
  async (req, res, next) => {
    try {
      const { page, limit, isActive, parentId, search } = req.validatedData.query;
      const skip = (page - 1) * limit;

      const where = {};
      if (isActive !== undefined) where.isActive = isActive;
      if (parentId) where.parentId = parentId;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [departments, total] = await Promise.all([
        prisma.department.findMany({
          where,
          skip,
          take: limit,
          include: {
            manager: { select: { id: true, firstName: true, lastName: true, email: true } },
            parent: { select: { id: true, name: true } },
            _count: { select: { employees: true, children: true } },
          },
          orderBy: { name: 'asc' },
        }),
        prisma.department.count({ where }),
      ]);

      await createAuditLog(req.user.id, 'READ', 'department', null, null, null, req);

      res.json({
        success: true,
        data: {
          departments,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /:id - Get department details
router.get('/:id', authenticate, authorize('ADMIN', 'HR', 'MANAGER'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, isActive: true } },
        employees: {
          where: { employmentStatus: 'ACTIVE' },
          select: { id: true, employeeId: true, firstName: true, lastName: true, email: true, employmentStatus: true },
        },
        positions: {
          select: { id: true, title: true, isActive: true, _count: { select: { employees: true } } },
        },
      },
    });

    if (!department) throw new AppError('Department not found', 404);

    await createAuditLog(req.user.id, 'READ', 'department', id, null, null, req);

    res.json({ success: true, data: { department } });
  } catch (error) {
    next(error);
  }
});

// POST / - Create department
router.post('/', authenticate, authorize('ADMIN', 'HR'), validate(departmentSchema), async (req, res, next) => {
  try {
    const { name, managerId, parentId, description } = req.validatedData.body;

    const existingDepartment = await prisma.department.findFirst({ where: { name } });
    if (existingDepartment) throw new ValidationError('Department name already exists');

    if (managerId) {
      const manager = await prisma.employee.findUnique({ where: { id: managerId } });
      if (!manager) throw new ValidationError('Manager not found');
    }

    if (parentId) {
      const parent = await prisma.department.findUnique({ where: { id: parentId } });
      if (!parent) throw new ValidationError('Parent department not found');
    }

    const department = await prisma.department.create({
      data: { name, managerId, parentId, description, isActive: true },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        parent: { select: { id: true, name: true } },
      },
    });

    await createAuditLog(req.user.id, 'CREATE', 'department', department.id, null, department, req);

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: { department },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /:id - Update department
router.put('/:id', authenticate, authorize('ADMIN', 'HR'), validate(updateDepartmentSchema), async (req, res, next) => {
  try {
    const { id } = req.validatedData.params;
    const { name, managerId, parentId, isActive, description } = req.validatedData.body;

    const existingDepartment = await prisma.department.findUnique({ where: { id } });
    if (!existingDepartment) throw new AppError('Department not found', 404);

    if (name && name !== existingDepartment.name) {
      const nameConflict = await prisma.department.findFirst({ where: { name } });
      if (nameConflict) throw new ValidationError('Department name already exists');
    }

    if (managerId) {
      const manager = await prisma.employee.findUnique({ where: { id: managerId } });
      if (!manager) throw new ValidationError('Manager not found');
    }

    if (parentId) {
      if (parentId === id) throw new ValidationError('Department cannot be its own parent');
      const parent = await prisma.department.findUnique({ where: { id: parentId } });
      if (!parent) throw new ValidationError('Parent department not found');
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(managerId !== undefined && { managerId }),
        ...(parentId !== undefined && { parentId }),
        ...(isActive !== undefined && { isActive }),
        ...(description !== undefined && { description }),
      },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        parent: { select: { id: true, name: true } },
      },
    });

    await createAuditLog(req.user.id, 'UPDATE', 'department', id, existingDepartment, department, req);

    res.json({ success: true, message: 'Department updated successfully', data: { department } });
  } catch (error) {
    next(error);
  }
});

// DELETE /:id - Soft delete department
router.delete('/:id', authenticate, authorize('ADMIN', 'HR'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingDepartment = await prisma.department.findUnique({
      where: { id },
      include: {
        employees: { where: { employmentStatus: 'ACTIVE' } },
        children: { where: { isActive: true } },
      },
    });

    if (!existingDepartment) throw new AppError('Department not found', 404);
    if (existingDepartment.employees.length > 0) throw new ValidationError('Cannot delete department with active employees');
    if (existingDepartment.children.length > 0) throw new ValidationError('Cannot delete department with active child departments');

    const department = await prisma.department.update({
      where: { id },
      data: { isActive: false },
    });

    await createAuditLog(req.user.id, 'DELETE', 'department', id, existingDepartment, department, req);

    res.json({ success: true, message: 'Department deleted successfully', data: { department } });
  } catch (error) {
    next(error);
  }
});

export default router;
