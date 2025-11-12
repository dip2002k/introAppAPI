// routes/serviceRoutes.js
const express = require('express');
const router = express.Router();
const {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
  addCustomerToService
} = require('../controllers/serviceController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Public routes (read-only)
router.get('/', getServices);
router.get('/:id', getServiceById);

// Protected routes
router.post('/', authenticateToken, createService);
router.put('/:id', authenticateToken, updateService);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), deleteService);
router.post('/add-customer', authenticateToken, addCustomerToService);

module.exports = router;