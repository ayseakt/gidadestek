const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config();
const { sequelize } = require('./models');

// Multer middleware
const upload = multer();

// ✅ CORS'u en üst sıraya al
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.options('*', cors());

// ✅ Body parser'ları CORS'dan sonra ekle
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Statik dosyalar
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Route dosyalarını import et
const locationRoutes = require('./routes/locationRoutes');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const packageRoutes = require('./routes/packageRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes'); 
const notificationRoutes = require('./routes/notificationRoutes');

// ✅ Route logging middleware (debug için)
app.use('/api/review', (req, res, next) => {
  console.log(`🔍 Review Route: ${req.method} ${req.originalUrl}`);
  console.log('📋 Headers:', req.headers.authorization ? 'Token var' : 'Token yok');
  next();
});

// ✅ API route'larını tanımla
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/seller-locations', locationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);

// ✅ Review route'ları - SADECE BU SATIRDA TANIMLA
app.use('/api/review', reviewRoutes);

// ✅ Test endpoint'i
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API çalışıyor', 
    timestamp: new Date().toISOString(),
    reviewEndpoint: '/api/review/my-reviews'
  });
});

// Ana sayfa
app.get('/', (req, res) => {
  res.send('SofraPay API çalışıyor! 🚀');
});

// ✅ Debug endpoint'i
app.get('/api/debug/routes', (req, res) => {
  res.json({
    success: true,
    message: 'Available routes',
    routes: {
      auth: '/api/auth/*',
      profile: '/api/profile/*',
      cart: '/api/cart/*',
      packages: '/api/packages/*',
      locations: '/api/locations/*',
      statistics: '/api/statistics/*',
      categories: '/api/categories/*',
      orders: '/api/orders/*',
      notifications: '/api/notifications/*',
      reviews: '/api/review/*'
    },
    reviewRoutes: [
      'POST /api/review/create',
      'GET /api/review/seller/:sellerId',
      'GET /api/review/my-reviews',
      'POST /api/review/:reviewId/response',
      'POST /api/review/:reviewId/helpful',
      'PATCH /api/review/:reviewId/visibility',
      'GET /api/review/reviewable-orders',
      'PUT /api/review/:reviewId',
      'DELETE /api/review/:reviewId'
    ]
  });
});

// ✅ 404 handler - en sona koy
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `404 - Route not found: ${req.method} ${req.originalUrl}`,
    suggestion: 'Check /api/debug/routes for available endpoints'
  });
});

// Genel hata yakalayıcı
app.use((err, req, res, next) => {
  console.error('❌ Server Hatası:', err.stack);
  
  res.status(500).json({
    success: false,
    message: 'Sunucu hatası oluştu',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

const PORT = process.env.PORT || 5051;

const startServer = async () => {
  try {
    await sequelize.sync({ force: false });
    console.log('✅ Database tabloları senkronize edildi');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server ${PORT} portunda çalışıyor`);
      console.log(`📌 CORS: http://localhost:3000 için etkinleştirildi`);
      console.log(`📌 Review API Endpoints:`);
      console.log(`   - GET  http://localhost:${PORT}/api/review/my-reviews`);
      console.log(`   - POST http://localhost:${PORT}/api/review/create`);
      console.log(`   - GET  http://localhost:${PORT}/api/review/seller/:sellerId`);
      console.log(`📌 Debug endpoint: GET http://localhost:${PORT}/api/debug/routes`);
      console.log(`📌 Test endpoint: GET http://localhost:${PORT}/api/test`);
    });
  } catch (error) {
    console.error('❌ Server başlatma hatası:', error);
  }
};

startServer();