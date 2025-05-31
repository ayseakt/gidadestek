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
app.use(express.json({ limit: '10mb' })); // JSON limit ekle
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

// ✅ API route'larını doğru sırada tanımla
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/seller-locations', locationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
// ✅ Test endpoint'i ekle
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API çalışıyor', timestamp: new Date().toISOString() });
});

// Ana sayfa
app.get('/', (req, res) => {
  res.send('SofraPay API çalışıyor! 🚀');
});
app.get('/api/statistics/debug', (req, res) => {
  console.log('🐛 Statistics Debug Route Çalıştı');
  res.json({
    success: true,
    message: 'Statistics routes çalışıyor',
    availableRoutes: [
      'GET /api/statistics/general',
      'GET /api/statistics/period/:period',
      'GET /api/statistics/charts/:type?period=30days'
    ],
    timestamp: new Date().toISOString()
  });
});

// ✅ API route debug middleware
app.use('/api/*', (req, res, next) => {
  console.log(`🔍 API Route not found: ${req.method} ${req.originalUrl}`);
  console.log('Available routes:');
  console.log('- GET /api/statistics/general');
  console.log('- GET /api/statistics/period/30days');
  console.log('- GET /api/statistics/charts/daily?period=30days');
  console.log('- POST /api/orders/create');
  console.log('- GET /api/orders/my-orders');
  console.log('- GET /api/orders/:orderId');
  console.log('- PATCH /api/orders/:orderId/cancel');
  
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'GET /api/statistics/general',
      'GET /api/statistics/period/:period',
      'GET /api/statistics/charts/:type',
      'POST /api/orders/create',
      'GET /api/orders/my-orders',
      'GET /api/orders/:orderId',
      'PATCH /api/orders/:orderId/cancel'
    ]
  });
});

// Genel hata yakalayıcı
app.use((err, req, res, next) => {
  console.error('❌ Server Hatası:', err.stack);
  
  // JSON response döndür, HTML değil
  res.status(500).json({
    success: false,
    message: 'Sunucu hatası oluştu',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler - JSON response
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: '404 - Sayfa bulunamadı',
    path: req.originalUrl
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
      console.log(`📌 Desteklenen HTTP metodları: GET, POST, PUT, DELETE, PATCH, OPTIONS`);
      console.log(`📌 API Endpoints:`);
      console.log(`   - POST http://localhost:${PORT}/api/orders/create`);
      console.log(`   - GET  http://localhost:${PORT}/api/orders/my-orders`);
      console.log(`   - GET  http://localhost:${PORT}/api/orders/:orderId`);
      console.log(`   - PATCH http://localhost:${PORT}/api/orders/:orderId/cancel`);
      console.log(`📌 Test endpoint: GET http://localhost:${PORT}/api/test`);
    });
  } catch (error) {
    console.error('❌ Server başlatma hatası:', error);
  }
};

startServer();