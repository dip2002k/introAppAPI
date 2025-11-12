// controllers/serviceController.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create service
export const createService = async (req, res) => {
  try {
    const { serviceType, description, cost, customerIds } = req.body;

    if (!serviceType || !description || !cost) {
      return res.status(400).json({ error: 'Service type, description, and cost are required' });
    }

    if (cost <= 0) {
      return res.status(400).json({ error: 'Cost must be greater than 0' });
    }

    const service = await prisma.service.create({
      data: {
        serviceType,
        description: description.trim(),
        cost: parseFloat(cost),
        customers: customerIds ? {
          create: customerIds.map(customerId => ({
            customer: { connect: { customerId } }
          }))
        } : undefined
      },
      include: {
        customers: {
          include: {
            customer: {
              select: {
                customerId: true,
                firstname: true,
                lastname: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Service created successfully!',
      service
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(400).json({ error: 'Failed to create service' });
  }
};

// Get all services
export const getServices = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'serviceDate', 
      sortOrder = 'desc',
      serviceType = '',
      minCost = '',
      maxCost = ''
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    let where = {};
    
    if (serviceType) where.serviceType = serviceType;
    
    if (minCost || maxCost) {
      where.cost = {};
      if (minCost) where.cost.gte = parseFloat(minCost);
      if (maxCost) where.cost.lte = parseFloat(maxCost);
    }

    const services = await prisma.service.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        customers: {
          include: {
            customer: {
              select: {
                customerId: true,
                firstname: true,
                lastname: true,
                phone: true
              }
            }
          }
        }
      }
    });

    const total = await prisma.service.count({ where });

    res.json({
      services,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

// Get single service
export const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { serviceId: id },
      include: {
        customers: {
          include: {
            customer: {
              select: {
                customerId: true,
                firstname: true,
                lastname: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
};

// Update service
export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceType, description, cost, customerIds } = req.body;

    if (!serviceType || !description || !cost) {
      return res.status(400).json({ error: 'Service type, description, and cost are required' });
    }

    // Update service and customer relationships
    const service = await prisma.service.update({
      where: { serviceId: id },
      data: {
        serviceType,
        description: description.trim(),
        cost: parseFloat(cost),
        ...(customerIds && {
          customers: {
            deleteMany: {}, // Remove existing relationships
            create: customerIds.map(customerId => ({
              customer: { connect: { customerId } }
            }))
          }
        })
      },
      include: {
        customers: {
          include: {
            customer: {
              select: {
                customerId: true,
                firstname: true,
                lastname: true
              }
            }
          }
        }
      }
    });

    res.json({
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Service not found' });
    }
    console.error('Error updating service:', error);
    res.status(400).json({ error: 'Failed to update service' });
  }
};

// Delete service
export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.service.delete({
      where: { serviceId: id }
    });

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Service not found' });
    }
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
};

// Add customer to service (many-to-many relationship)
export const addCustomerToService = async (req, res) => {
  try {
    const { serviceId, customerId } = req.body;

    if (!serviceId || !customerId) {
      return res.status(400).json({ error: 'Service ID and Customer ID are required' });
    }

    const customerService = await prisma.customerService.create({
      data: {
        serviceId,
        customerId
      },
      include: {
        service: true,
        customer: {
          select: {
            firstname: true,
            lastname: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Customer added to service successfully',
      customerService
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Customer is already associated with this service' });
    }
    console.error('Error adding customer to service:', error);
    res.status(400).json({ error: 'Failed to add customer to service' });
  }
};