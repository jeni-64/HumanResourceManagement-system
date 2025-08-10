// src/routes/employeeRoutes.js
import express from 'express';
import { z } from 'zod';
import { authenticate, authorize, authorizeEmployee } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { createAuditLog } from '../middleware/auditMiddleware.js';
import { ValidationError, AppError } from '../utils/errors.js';
import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Validation schemas
const employeeSchema = z.object({
  body: z.object({
    employeeId: z.string().min(1, 'Employee ID is required'),
    firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
    email: z.string().email('Invalid email format'),
    phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone format').optional(),
    dateOfBirth: z.string().datetime('Invalid date format').optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional(),
    nationality: z.string().max(50, 'Nationality too long').optional(),
    address: z.string().max(500, 'Address too long').optional(),
    city: z.string().max(100, 'City too long').optional(),
    state: z.string().max(100, 'State too long').optional(),
    country: z.string().max(100, 'Country too long').optional(),
    zipCode: z.string().max(20, 'ZIP code too long').optional(),
    middleName: z.string().max(50, 'Middle name too long').optional(),
    departmentId: z.string().uuid('Invalid department ID').optional(),
    positionId: z.string().uuid('Invalid position ID').optional(),
    managerId: z.string().uuid('Invalid manager ID').optional(),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'CONSULTANT']).default('FULL_TIME'),
    hireDate: z.string().datetime('Invalid hire date format'),
    baseSalary: z.number().min(0, 'Salary must be positive').optional(),
    employmentStatus: z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE', 'PROBATION']).default('ACTIVE'),
  }),
});

const updateEmployeeSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required').max(50, 'First name too long').optional(),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long').optional(),
    email: z.string().email('Invalid email format').optional(),
    phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone format').optional(),
    dateOfBirth: z.string().datetime('Invalid date format').optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional(),
    nationality: z.string().max(50, 'Nationality too long').optional(),
    address: z.string().max(500, 'Address too long').optional(),
    city: z.string().max(100, 'City too long').optional(),
    state: z.string().max(100, 'State too long').optional(),
    country: z.string().max(100, 'Country too long').optional(),
    zipCode: z.string().max(20, 'ZIP code too long').optional(),
    middleName: z.string().max(50, 'Middle name too long').optional(),
    departmentId: z.string().uuid('Invalid department ID').optional(),
    positionId: z.string().uuid('Invalid position ID').optional(),
    managerId: z.string().uuid('Invalid manager ID').optional(),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'CONSULTANT']).optional(),
    employmentStatus: z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE', 'PROBATION']).optional(),
    baseSalary: z.number().min(0, 'Salary must be positive').optional(),
  }),
});

const listSchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val)) : 1)),
    limit: z.string().optional().transform((val) => (val ? Math.min(parseInt(val), 100) : 10)),
    search: z.string().optional(),
    departmentId: z.string().uuid('Invalid department ID').optional(),
    employmentStatus: z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE', 'PROBATION']).optional(),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'CONSULTANT']).optional(),
  }),
});

const idSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid employee ID'),
  }),
});

// GET /api/employees - Get all employees with pagination
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'HR', 'MANAGER'),
  validate(listSchema),
  async (req, res, next) => {
    try {
      const { page, limit, search, departmentId, employmentStatus, employmentType } = req.validatedData.query;
      
      const filters = {};
      if (departmentId) filters.departmentId = departmentId;
      if (employmentStatus) filters.employmentStatus = employmentStatus;
      if (employmentType) filters.employmentType = employmentType;
      
      // Add search functionality
      if (search) {
        filters.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { employeeId: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Role-based filtering for managers
      const userRole = req.user.role.toUpperCase();
      if (userRole === 'MANAGER' && req.user.employee) {
        const subordinates = await prisma.employee.findMany({
          where: { managerId: req.user.employee.id },
          select: { id: true },
        });
        const subordinateIds = subordinates.map(sub => sub.id);
        subordinateIds.push(req.user.employee.id); // Include self
        
        filters.id = { in: subordinateIds };
      }

      const [employees, total] = await Promise.all([
        prisma.employee.findMany({
          where: filters,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { firstName: 'asc' },
          include: {
            department: {
              select: { id: true, name: true },
            },
            position: {
              select: { id: true, title: true, level: true },
            },
            manager: {
              select: { id: true, firstName: true, lastName: true },
            },
            user: {
              select: { id: true, email: true, role: true, isActive: true },
            },
          },
        }),
        prisma.employee.count({ where: filters }),
      ]);

      await createAuditLog(req.user.id, 'READ', 'employees', null, null, null, req);
      
      res.json({
        status: 'success',
        data: {
          employees,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / limit)
          }
        },
      });
    } catch (error) {
      logger.error('Error fetching employees', { 
        error: error.message, 
        stack: error.stack,
        userId: req.user?.id 
      });
      next(new AppError('Failed to fetch employees', 500, null, 'SERVER_ERROR'));
    }
  }
);

// GET /api/employees/:id - Get single employee
router.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'),
  authorizeEmployee,
  validate(idSchema),
  async (req, res, next) => {
    try {
      const { id } = req.validatedData.params;
      
      const employee = await prisma.employee.findUnique({
        where: { id },
        include: {
          department: {
            select: { id: true, name: true },
          },
          position: {
            select: { id: true, title: true, level: true, description: true },
          },
          manager: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          subordinates: {
            select: { id: true, firstName: true, lastName: true, position: { select: { title: true } } },
            where: { employmentStatus: 'ACTIVE' },
          },
          user: {
            select: { id: true, email: true, role: true, isActive: true, lastLoginAt: true },
          },
          attendanceRecords: {
            select: { id: true, date: true, status: true },
            orderBy: { date: 'desc' },
            take: 10,
          },
          leaveRequests: {
            select: { id: true, startDate: true, endDate: true, status: true, policy: { select: { name: true, leaveType: true } } },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      if (!employee) {
        throw new AppError('Employee not found', 404, null, 'NOT_FOUND');
      }

      await createAuditLog(req.user.id, 'READ', 'employees', id, null, null, req);
      res.json({ status: 'success', data: employee });
    } catch (error) {
      logger.error('Error fetching employee', { 
        error: error.message, 
        id: req.params.id,
        userId: req.user?.id 
      });
      next(error);
    }
  }
);

// POST /api/employees - Create employee
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'HR'),
  validate(employeeSchema),
  async (req, res, next) => {
    try {
      const employeeData = req.validatedData.body;

      // Check if employee ID already exists
      const existingEmployee = await prisma.employee.findUnique({
        where: { employeeId: employeeData.employeeId },
      });

      if (existingEmployee) {
        throw new ValidationError('Employee ID already exists', null, 'DUPLICATE_EMPLOYEE_ID');
      }

      // Check if email already exists
      const existingEmail = await prisma.employee.findUnique({
        where: { email: employeeData.email },
      });

      if (existingEmail) {
        throw new ValidationError('Email already exists', null, 'DUPLICATE_EMAIL');
      }

      // Validate department exists if provided
      if (employeeData.departmentId) {
        const department = await prisma.department.findUnique({
          where: { id: employeeData.departmentId, isActive: true },
        });
        if (!department) {
          throw new ValidationError('Department not found', null, 'DEPARTMENT_NOT_FOUND');
        }
      }

      // Validate position exists if provided
      if (employeeData.positionId) {
        const position = await prisma.position.findUnique({
          where: { id: employeeData.positionId, isActive: true },
        });
        if (!position) {
          throw new ValidationError('Position not found', null, 'POSITION_NOT_FOUND');
        }
      }

      // Validate manager exists if provided
      if (employeeData.managerId) {
        const manager = await prisma.employee.findUnique({
          where: { id: employeeData.managerId, employmentStatus: 'ACTIVE' },
        });
        if (!manager) {
          throw new ValidationError('Manager not found', null, 'MANAGER_NOT_FOUND');
        }
      }

      const newEmployee = await prisma.employee.create({
        data: {
          ...employeeData,
          dateOfBirth: employeeData.dateOfBirth ? new Date(employeeData.dateOfBirth) : null,
          hireDate: new Date(employeeData.hireDate),
          createdById: req.user.id,
        },
        include: {
          department: { select: { id: true, name: true } },
          position: { select: { id: true, title: true, level: true } },
          manager: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      await createAuditLog(req.user.id, 'CREATE', 'employees', newEmployee.id, null, newEmployee, req);
      res.status(201).json({ status: 'success', data: newEmployee });
    } catch (error) {
      logger.error('Error creating employee', { 
        error: error.message,
        userId: req.user?.id 
      });
      next(error);
    }
  }
);

// PUT /api/employees/:id - Update employee
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'HR'),
  validate(idSchema.merge(updateEmployeeSchema)),
  async (req, res, next) => {
    try {
      const { id } = req.validatedData.params;
      const updateData = req.validatedData.body;

      const existingEmployee = await prisma.employee.findUnique({
        where: { id },
      });

      if (!existingEmployee) {
        throw new AppError('Employee not found', 404, null, 'NOT_FOUND');
      }

      // Check email uniqueness if email is being updated
      if (updateData.email && updateData.email !== existingEmployee.email) {
        const existingEmail = await prisma.employee.findUnique({
          where: { email: updateData.email },
        });
        if (existingEmail) {
          throw new ValidationError('Email already exists', null, 'DUPLICATE_EMAIL');
        }
      }

      // Validate department exists if provided
      if (updateData.departmentId) {
        const department = await prisma.department.findUnique({
          where: { id: updateData.departmentId, isActive: true },
        });
        if (!department) {
          throw new ValidationError('Department not found', null, 'DEPARTMENT_NOT_FOUND');
        }
      }

      // Validate position exists if provided
      if (updateData.positionId) {
        const position = await prisma.position.findUnique({
          where: { id: updateData.positionId, isActive: true },
        });
        if (!position) {
          throw new ValidationError('Position not found', null, 'POSITION_NOT_FOUND');
        }
      }

      // Validate manager exists if provided and prevent self-management
      if (updateData.managerId) {
        if (updateData.managerId === id) {
          throw new ValidationError('Employee cannot be their own manager', null, 'INVALID_MANAGER');
        }
        const manager = await prisma.employee.findUnique({
          where: { id: updateData.managerId, employmentStatus: 'ACTIVE' },
        });
        if (!manager) {
          throw new ValidationError('Manager not found', null, 'MANAGER_NOT_FOUND');
        }
      }

      // Process date fields
      const processedData = { ...updateData };
      if (updateData.dateOfBirth) {
        processedData.dateOfBirth = new Date(updateData.dateOfBirth);
      }

      const updatedEmployee = await prisma.employee.update({
        where: { id },
        data: {
          ...processedData,
          updatedById: req.user.id,
        },
        include: {
          department: { select: { id: true, name: true } },
          position: { select: { id: true, title: true, level: true } },
          manager: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      await createAuditLog(req.user.id, 'UPDATE', 'employees', id, existingEmployee, updatedEmployee, req);
      res.json({ status: 'success', data: updatedEmployee });
    } catch (error) {
      logger.error('Error updating employee', { 
        error: error.message, 
        id: req.params.id,
        userId: req.user?.id 
      });
      next(error);
    }
  }
);

// DELETE /api/employees/:id - Soft delete employee (set employment status to TERMINATED)
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN', 'HR'),
  validate(idSchema),
  async (req, res, next) => {
    try {
      const { id } = req.validatedData.params;
      
      const existingEmployee = await prisma.employee.findUnique({
        where: { id },
        include: {
          subordinates: {
            where: { employmentStatus: 'ACTIVE' },
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      if (!existingEmployee) {
        throw new AppError('Employee not found', 404, null, 'NOT_FOUND');
      }

      if (existingEmployee.employmentStatus === 'TERMINATED') {
        throw new ValidationError('Employee is already terminated', null, 'ALREADY_TERMINATED');
      }

      // Check if employee has active subordinates
      if (existingEmployee.subordinates.length > 0) {
        throw new ValidationError(
          'Cannot terminate employee with active subordinates. Please reassign subordinates first.',
          null,
          'HAS_ACTIVE_SUBORDINATES'
        );
      }

      const terminatedEmployee = await prisma.employee.update({
        where: { id },
        data: {
          employmentStatus: 'TERMINATED',
          terminationDate: new Date(),
          updatedById: req.user.id,
        },
      });

      // Also deactivate associated user account if exists
      if (existingEmployee.userId) {
        await prisma.user.update({
          where: { id: existingEmployee.userId },
          data: { isActive: false },
        });
      }

      await createAuditLog(req.user.id, 'DELETE', 'employees', id, existingEmployee, terminatedEmployee, req);
      res.json({ 
        status: 'success', 
        message: 'Employee terminated successfully',
        data: terminatedEmployee 
      });
    } catch (error) {
      logger.error('Error deleting employee', { 
        error: error.message, 
        id: req.params.id,
        userId: req.user?.id 
      });
      next(error);
    }
  }
);

export default router;