// controllers/saleController.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create sale
export const createSale = async (req, res) => {
  try {
    const { customerId, employeeId, carId, totalPrice, status } = req.body;

    if (!customerId || !employeeId || !carId || !totalPrice) {
      return res.status(400).json({ error: 'Customer, employee, car, and total price are required' });
    }

    if (totalPrice <= 0) {
      return res.status(400).json({ error: 'Total price must be greater than 0' });
    }

    // Check if car is available
    const car = await prisma.car.findUnique({
      where: { carId: carId }
    });

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    if (car.status !== 'AVAILABLE') {
      return res.status(400).json({ error: 'Car is not available for sale' });
    }

    // Create sale and update car status
    const [sale] = await prisma.$transaction([
      prisma.sale.create({
        data: {
          customerId,
          employeeId,
          carId,
          totalPrice: parseFloat(totalPrice),
          status: status || 'COMPLETED'
        },
        include: {
          customer: {
            select: {
              firstname: true,
              lastname: true
            }
          },
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
      }),
      prisma.car.update({
        where: { carId: carId },
        data: { status: 'SOLD' }
      })
    ]);

    res.status(201).json({
      message: 'Sale created successfully!',
      sale
    });
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(400).json({ error: 'Failed to create sale' });
  }
};

// Get all sales
export const getSales = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'saleDate', 
      sortOrder = 'desc',
      customerId = '',
      employeeId = '',
      status = ''
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    let where = {};
    
    if (customerId) where.customerId = customerId;
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    const sales = await prisma.sale.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        customer: {
          select: {
            firstname: true,
            lastname: true,
            email: true
          }
        },
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
    });

    const total = await prisma.sale.count({ where });

    res.json({
      sales,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
};

// Get single sale
export const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await prisma.sale.findUnique({
      where: { saleId: id },
      include: {
        customer: {
          select: {
            firstname: true,
            lastname: true,
            email: true,
            phone: true,
            address: true
          }
        },
        employee: {
          select: {
            fname: true,
            lname: true,
            phone: true
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
    });

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    res.json(sale);
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({ error: 'Failed to fetch sale' });
  }
};

// Update sale
export const updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalPrice, status } = req.body;

    if (!totalPrice || !status) {
      return res.status(400).json({ error: 'Total price and status are required' });
    }

    const sale = await prisma.sale.update({
      where: { saleId: id },
      data: {
        totalPrice: parseFloat(totalPrice),
        status: status
      },
      include: {
        customer: {
          select: {
            firstname: true,
            lastname: true
          }
        },
        employee: {
          select: {
            fname: true,
            lname: true
          }
        },
        car: true
      }
    });

    res.json({
      message: 'Sale updated successfully',
      sale
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Sale not found' });
    }
    console.error('Error updating sale:', error);
    res.status(400).json({ error: 'Failed to update sale' });
  }
};

// Delete sale
export const deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await prisma.sale.findUnique({
      where: { saleId: id },
      include: { car: true }
    });

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    // Return car to available status if sale is deleted
    await prisma.$transaction([
      prisma.sale.delete({
        where: { saleId: id }
      }),
      prisma.car.update({
        where: { carId: sale.carId },
        data: { status: 'AVAILABLE' }
      })
    ]);

    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Sale not found' });
    }
    console.error('Error deleting sale:', error);
    res.status(500).json({ error: 'Failed to delete sale' });
  }
};