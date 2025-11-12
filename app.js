// app.js
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Your SvelteKit frontend
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/cars', require('./routes/carRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Car Dealership API is running!',
    timestamp: new Date().toISOString(),
    endpoints: {
      customers: '/api/customers',
      employees: '/api/employees', 
      cars: '/api/cars',
      sales: '/api/sales',
      services: '/api/services',
     
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