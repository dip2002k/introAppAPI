import express from 'express';
import {
  getCustomers,
  getCustomerById,
  customerSignup,
  customerLogin,
  updateCustomer,
  deleteCustomer
} from '../controllers/customerController.js';

const router = express.Router();

// Customer authentication routes
router.post('/signup', customerSignup);
router.post('/login', customerLogin);

// Customer management routes (for admin/employees)
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;