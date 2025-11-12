// routes/carRoutes.js
const express = require('express');
const router = express.Router();
const {
  createCar,
  getCars,
  getCarById,
  updateCar,
  deleteCar
} = require('../controllers/carController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Public routes (read-only)
router.get('/', getCars);
router.get('/:id', getCarById);

// Protected routes (admin only for write operations)
router.post('/', authenticateToken, authorizeRoles('ADMIN'), createCar);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), updateCar);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), deleteCar);

module.exports = router;