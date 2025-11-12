// controllers/employeeController.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt.js';

const prisma = new PrismaClient();

// Employee Signup
export const employeeSignup = async (req, res) => {
  try {
    const { employeeId, fname, lname, phone, role, password } = req.body;

    // Validation
    if (!employeeId || !fname || !lname || !phone || !role || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if employee ID exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeId }
    });

    if (existingEmployee) {
      return res.status(400).json({ error: 'Employee ID already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create employee
    const employee = await prisma.employee.create({
      data: {
        employeeId: employeeId.trim(),
        fname: fname.trim(),
        lname: lname.trim(),
        phone: phone.trim(),
        role: role,
        password: hashedPassword
      },
      select: {
        employeeId: true,
        fname: true,
        lname: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'Employee account created successfully!',
      employee
    });
  } catch (error) {
    console.error('Error during employee signup:', error);
    res.status(400).json({ error: 'Failed to create employee account' });
  }
};

// Employee Login
export const employeeLogin = async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
      return res.status(400).json({ error: 'Employee ID and password are required' });
    }

    const employee = await prisma.employee.findUnique({
      where: { employeeId }
    });

    if (!employee) {
      return res.status(401).json({ error: 'Invalid Employee ID or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, employee.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid Employee ID or password' });
    }

    // Generate JWT token
    const token = generateToken({
      employeeId: employee.employeeId,
      role: employee.role
    });

    const { password: _, ...employeeWithoutPassword } = employee;

    res.json({
      message: 'Login successful!',
      token,
      employee: employeeWithoutPassword
    });
  } catch (error) {
    console.error('Error during employee login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Get all employees
export const getEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = search ? {
      OR: [
        { employeeId: { contains: search, mode: 'insensitive' } },
        { fname: { contains: search, mode: 'insensitive' } },
        { lname: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const employees = await prisma.employee.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      select: {
        employeeId: true,
        fname: true,
        lname: true,
        phone: true,
        role: true,
        createdAt: true,
        sales: {
          include: {
            customer: {
              select: {
                firstname: true,
                lastname: true
              }
            },
            car: {
              select: {
                make: true,
                model: true
              }
            }
          }
        }
      }
    });

    const total = await prisma.employee.count({ where });

    res.json({
      employees,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

// Get single employee
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { employeeId: id },
      select: {
        employeeId: true,
        fname: true,
        lname: true,
        phone: true,
        role: true,
        createdAt: true,
        sales: {
          include: {
            customer: {
              select: {
                firstname: true,
                lastname: true,
                email: true
              }
            },
            car: {
              select: {
                make: true,
                model: true,
                year: true,
                price: true
              }
            }
          }
        }
      }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
};

// Update employee
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { fname, lname, phone, role } = req.body;

    if (!fname || !lname || !phone || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const employee = await prisma.employee.update({
      where: { employeeId: id },
      data: {
        fname: fname.trim(),
        lname: lname.trim(),
        phone: phone.trim(),
        role: role
      },
      select: {
        employeeId: true,
        fname: true,
        lname: true,
        phone: true,
        role: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Employee updated successfully',
      employee
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Employee not found' });
    }
    console.error('Error updating employee:', error);
    res.status(400).json({ error: 'Failed to update employee' });
  }
};

// Delete employee
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.employee.delete({
      where: { employeeId: id }
    });

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Employee not found' });
    }
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
};