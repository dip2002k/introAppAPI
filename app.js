const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/tags', require('./routes/tagRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Blog API is running!',
    endpoints: {
      users: '/api/users',
      posts: '/api/posts',
      tags: '/api/tags', 
      comments: '/api/comments',
      categories: '/api/categories'
    }
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;