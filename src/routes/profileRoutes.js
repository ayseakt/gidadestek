// profileRoutes.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/ProfileController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer yapılandırması için uploads klasörünü kontrol et ve oluştur
const uploadDir = path.join(__dirname, '../uploads/profile');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer yapılandırması - profil resimleri için
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Dosya adını userId + timestamp + uzantı olarak ayarla
    const userId = req.user.id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `profile_${userId}_${timestamp}${ext}`);
  }
});

// Sadece resim dosyaları kabul et
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Yalnızca .jpeg, .jpg ve .png uzantılı dosyalar kabul edilmektedir.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB maksimum dosya boyutu
  }
});

// Tüm route'ları auth middleware ile koru
router.use(authMiddleware);

// Profil bilgilerini getir
router.get('/', profileController.getProfile);

// Profil bilgilerini güncelle
router.put('/update', profileController.updateProfile);

// Şifre değiştir
router.post('/change-password', profileController.changePassword);

// Profil resmi yükle
router.post('/upload-picture', upload.single('profilePicture'), profileController.uploadProfilePicture);
// Satıcı profili rotalarını ekleyin
router.get('/seller', profileController.getSellerProfile);
router.put('/seller/update', profileController.updateSellerProfile);

module.exports = router;