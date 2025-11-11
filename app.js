const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/customers', require('./routes/customerRoutes'));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Car Dealership API is running!',
    endpoints: {
      customers: '/api/customers',
      customer_signup: 'POST /api/customers/signup',
      customer_login: 'POST /api/customers/login',
      get_customers: 'GET /api/customers',
      get_customer: 'GET /api/customers/:id',
      update_customer: 'PUT /api/customers/:id',
      delete_customer: 'DELETE /api/customers/:id'
    }
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Car Dealership API running on http://localhost:${PORT}`);
});

module.exports = app;