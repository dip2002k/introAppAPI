// routes/employeeRoutes.js
const express = require('express');
const router = express.Router();
const {
  employeeSignup,
  employeeLogin,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
} = require('../controllers/employeeController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Public routes
router.post('/signup', employeeSignup);
router.post('/login', employeeLogin);

// Protected routes
router.get('/', authenticateToken, getEmployees);
router.get('/:id', authenticateToken, getEmployeeById);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), updateEmployee);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), deleteEmployee);

module.exports = router;
