const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const multer = require('multer'); // multer require edilmeli
require('dotenv').config();
const { sequelize } = require('./models'); // Burada models'ten sadece sequelize almalısınız

// Multer middleware
const upload = multer();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS ayarlarını genişletilmiş hali - PATCH metodunu da ekliyoruz
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // ✅ PATCH eklendi
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.options('*', cors());

// Statik dosyalar
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route dosyalarını import et
const locationRoutes = require('./routes/locationRoutes');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const packageRoutes = require('./routes/packageRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes'); // 🔴 EKSİK OLAN ROUTE!

// Sadece JSON endpointleri için body parser kullan
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/cart', cartRoutes); // 🔴 EKSİK OLAN ROUTE TANIMI!

// FormData ile çalışan endpointler için body parser KULLANMA!
app.use('/api/packages', packageRoutes);

app.use('/api/locations', locationRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/seller-locations', locationRoutes);

app.get('/', (req, res) => {
  res.send('SofraPay API çalışıyor! 🚀');
});

app.use((err, req, res, next) => {
  console.error('Hata:', err.stack);
  res.status(500).send('Bir şeyler ters gitti!');
});

app.use((req, res) => {
  res.status(404).send('Sayfa bulunamadı');
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
    });
  } catch (error) {
    console.error('❌ Server başlatma hatası:', error);
  }
};
startServer();