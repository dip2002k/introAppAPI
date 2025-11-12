import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Customer Signup
export const customerSignup = async (req, res) => {
  try {
    const { customerId, firstname, lastname, phone, address, email, password } = req.body;

    // Validation
    if (!customerId || !firstname || !lastname || !phone || !address || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Email format validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if customer ID already exists
    const existingCustomerId = await prisma.customer.findUnique({
      where: { customerId }
    });

    if (existingCustomerId) {
      return res.status(400).json({ error: 'Customer ID already exists. Please choose a different one.' });
    }

    // Check if email already exists
    const existingEmail = await prisma.customer.findUnique({
      where: { email }
    });

    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        customerId: customerId.trim(),
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        phone: phone.trim(),
        address: address.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword
      },
      select: {
        customerId: true,
        firstname: true,
        lastname: true,
        phone: true,
        address: true,
        email: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'Customer account created successfully!',
      customer
    });
  } catch (error) {
    console.error('Error during customer signup:', error);
    res.status(400).json({ error: 'Failed to create customer account' });
  }
};

// Customer Login
export const customerLogin = async (req, res) => {
  try {
    const { customerId, password } = req.body;

    if (!customerId || !password) {
      return res.status(400).json({ error: 'Customer ID and password are required' });
    }

    // Find customer by customerId
    const customer = await prisma.customer.findUnique({
      where: { customerId },
      select: {
        customerId: true,
        firstname: true,
        lastname: true,
        email: true,
        password: true
      }
    });

    if (!customer) {
      return res.status(401).json({ error: 'Invalid Customer ID or password' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid Customer ID or password' });
    }

    // Remove password from response
    const { password: _, ...customerWithoutPassword } = customer;

    res.json({
      message: 'Login successful!',
      customer: customerWithoutPassword
    });
  } catch (error) {
    console.error('Error during customer login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Get all customers (for admin/employees)
export const getCustomers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      search = '' 
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause for search
    const where = search ? {
      OR: [
        { customerId: { contains: search, mode: 'insensitive' } },
        { firstname: { contains: search, mode: 'insensitive' } },
        { lastname: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    // Get customers with pagination (exclude passwords)
    const customers = await prisma.customer.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        [sortBy]: sortOrder
      },
      select: {
        customerId: true,
        firstname: true,
        lastname: true,
        phone: true,
        address: true,
        email: true,
        createdAt: true,
        sales: {
          include: {
            employee: {
              select: {
                fname: true,
                lname: true
              }
            }
          }
        }
      }
    });

    // Get total count for pagination
    const total = await prisma.customer.count({ where });
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      customers,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

// Get single customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    const customer = await prisma.customer.findUnique({
      where: { customerId: id },
      select: {
        customerId: true,
        firstname: true,
        lastname: true,
        phone: true,
        address: true,
        email: true,
        createdAt: true,
        sales: {
          include: {
            employee: {
              select: {
                fname: true,
                lname: true
              }
            },
            car: {
              select: {
                make: true,
                model: true,
                year: true
              }
            }
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

// Update customer profile (customer can update their own profile)
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstname, lastname, phone, address, email } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    // Validation
    if (!firstname || !lastname || !phone || !address || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Email format validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    // Check if email exists for other customers
    const existingEmail = await prisma.customer.findFirst({
      where: {
        email,
        customerId: { not: id }
      }
    });

    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists for another customer' });
    }

    const customer = await prisma.customer.update({
      where: { customerId: id },
      data: {
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        phone: phone.trim(),
        address: address.trim(),
        email: email.toLowerCase().trim()
      },
      select: {
        customerId: true,
        firstname: true,
        lastname: true,
        phone: true,
        address: true,
        email: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Customer profile updated successfully',
      customer
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Customer not found' });
    }
    console.error('Error updating customer:', error);
    res.status(400).json({ error: 'Failed to update customer profile' });
  }
};

// Delete customer
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    await prisma.customer.delete({
      where: { customerId: id }
    });

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Customer not found' });
    }
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
};