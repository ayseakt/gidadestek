// middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Yükleme klasörlerini oluştur
const createUploadDirs = () => {
  const dirs = [
    './uploads',
    './uploads/profile',
    './uploads/packages'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Dizin oluşturuldu: ${dir}`);
    }
  });
};

createUploadDirs();

// Profil resmi yükleme yapılandırması
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profile');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `user-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

// Paket resmi yükleme yapılandırması
const packageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/packages');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `package-${uniqueSuffix}${ext}`);
  }
});

// Dosya filtreleme
const fileFilter = (req, file, cb) => {
  // Sadece görselleri kabul et
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Yalnızca resim dosyaları yüklenebilir.'), false);
  }
};

module.exports = {
  profile: multer({
    storage: profileStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
  }),
  package: multer({
    storage: packageStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
  })
};