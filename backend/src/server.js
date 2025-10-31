require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const app = express();

// ============================================
// MIDDLEWARE SETUP
// ============================================

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL,
        /\.azurestaticapps\.net$/,  // Allow Azure Static Web Apps
        /\.azurewebsites\.net$/      // Allow Azure App Service
      ]
    : 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// ROUTES
// ============================================

// Import routes
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const swapRoutes = require('./routes/swapRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/swap-requests', swapRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SlotSwapper API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`\n🔐 Auth endpoints:`);
      console.log(`   POST http://localhost:${PORT}/api/auth/register`);
      console.log(`   POST http://localhost:${PORT}/api/auth/login`);
      console.log(`   GET  http://localhost:${PORT}/api/auth/me`);
      console.log(`\n📅 Event endpoints:`);
      console.log(`   POST   http://localhost:${PORT}/api/events`);
      console.log(`   GET    http://localhost:${PORT}/api/events`);
      console.log(`   GET    http://localhost:${PORT}/api/events/swappable/marketplace`);
      console.log(`   GET    http://localhost:${PORT}/api/events/:id`);
      console.log(`   PATCH  http://localhost:${PORT}/api/events/:id`);
      console.log(`   DELETE http://localhost:${PORT}/api/events/:id`);
      console.log(`\n🔄 Swap Request endpoints:`);
      console.log(`   POST   http://localhost:${PORT}/api/swap-requests`);
      console.log(`   GET    http://localhost:${PORT}/api/swap-requests/incoming`);
      console.log(`   GET    http://localhost:${PORT}/api/swap-requests/outgoing`);
      console.log(`   POST   http://localhost:${PORT}/api/swap-requests/:id/respond`);
      console.log(`   DELETE http://localhost:${PORT}/api/swap-requests/:id`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();