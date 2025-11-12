// routes/saleRoutes.js
const express = require('express');
const router = express.Router();
const {
  createSale,
  getSales,
  getSaleById,
  updateSale,
  deleteSale
} = require('../controllers/saleController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes protected (sales involve sensitive data)
router.post('/', authenticateToken, createSale);
router.get('/', authenticateToken, getSales);
router.get('/:id', authenticateToken, getSaleById);
router.put('/:id', authenticateToken, updateSale);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), deleteSale);

module.exports = router;