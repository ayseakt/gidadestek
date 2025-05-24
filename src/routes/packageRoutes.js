const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const multer = require('multer');
const upload = multer();
const authMiddleware = require('../middleware/authMiddleware');

// Auth middleware'i tüm route'lara uygula
router.use(authMiddleware);

// Paket oluşturma
router.post('/', upload.none(), packageController.createPackage);
// Tüm aktif paketleri getir (alışveriş için - tüm satıcılardan)
router.get('/all-active', packageController.getAllActivePackagesForShopping);

// ⭐ Önemli: Spesifik route'lar parametre içeren route'lardan ÖNCE tanımlanmalı
// Aktif paketleri getir
router.get('/active', packageController.getActivePackages);

// Geçmiş paketleri getir
router.get('/history', packageController.getPackageHistory);

// ⭐ Frontend'in beklediği ana endpoint
router.get('/my-packages', packageController.getMyPackages);

// ⭐ EKSİK ROUTE'LAR - Frontend bu endpoint'leri kullanıyor
router.put('/:id', upload.none(), packageController.updatePackage);
router.post('/:id/cancel', packageController.cancelPackage);

// ⭐ Belirli paket detayı (en sonda olmalı - çünkü /:id şeklinde)
router.get('/:id', packageController.getPackageById);

module.exports = router;