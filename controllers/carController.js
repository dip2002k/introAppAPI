// controllers/carController.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create car
export const createCar = async (req, res) => {
  try {
    const { make, model, year, price, status } = req.body;

    if (!make || !model || !year || !price) {
      return res.status(400).json({ error: 'Make, model, year, and price are required' });
    }

    if (year < 1900 || year > new Date().getFullYear() + 1) {
      return res.status(400).json({ error: 'Please provide a valid year' });
    }

    if (price <= 0) {
      return res.status(400).json({ error: 'Price must be greater than 0' });
    }

    const car = await prisma.car.create({
      data: {
        make: make.trim(),
        model: model.trim(),
        year: parseInt(year),
        price: parseFloat(price),
        status: status || 'AVAILABLE'
      }
    });

    res.status(201).json({
      message: 'Car created successfully!',
      car
    });
  } catch (error) {
    console.error('Error creating car:', error);
    res.status(400).json({ error: 'Failed to create car' });
  }
};

// Get all cars with filtering, sorting, pagination
export const getCars = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      search = '',
      status = '',
      minPrice = '',
      maxPrice = ''
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    let where = {};
    
    if (search) {
      where.OR = [
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const cars = await prisma.car.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        sales: {
          include: {
            customer: {
              select: {
                firstname: true,
                lastname: true
              }
            }
          }
        }
      }
    });

    const total = await prisma.car.count({ where });

    res.json({
      cars,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ error: 'Failed to fetch cars' });
  }
};

// Get single car
export const getCarById = async (req, res) => {
  try {
    const { id } = req.params;

    const car = await prisma.car.findUnique({
      where: { carId: id },
      include: {
        sales: {
          include: {
            customer: {
              select: {
                firstname: true,
                lastname: true,
                email: true,
                phone: true
              }
            },
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

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    res.json(car);
  } catch (error) {
    console.error('Error fetching car:', error);
    res.status(500).json({ error: 'Failed to fetch car' });
  }
};

// Update car
export const updateCar = async (req, res) => {
  try {
    const { id } = req.params;
    const { make, model, year, price, status } = req.body;

    if (!make || !model || !year || !price || !status) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const car = await prisma.car.update({
      where: { carId: id },
      data: {
        make: make.trim(),
        model: model.trim(),
        year: parseInt(year),
        price: parseFloat(price),
        status: status
      }
    });

    res.json({
      message: 'Car updated successfully',
      car
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Car not found' });
    }
    console.error('Error updating car:', error);
    res.status(400).json({ error: 'Failed to update car' });
  }
};

// Delete car
export const deleteCar = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.car.delete({
      where: { carId: id }
    });

    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Car not found' });
    }
    console.error('Error deleting car:', error);
    res.status(500).json({ error: 'Failed to delete car' });
  }
};