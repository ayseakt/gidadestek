const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const multer = require('multer');
const upload = multer();
const authMiddleware = require('../middleware/authMiddleware');

// Auth middleware'i tüm route'lara uygula
router.use(authMiddleware);

// ⭐ Paket oluşturma (resimlerle birlikte)
router.post('/create', packageController.upload.array('images', 5), packageController.createPackage);

// ⭐ RESİM YÖNETİMİ ROUTE'LARI
router.post('/:packageId/images', packageController.upload.single('image'), packageController.addPackageImage);
router.delete('/:packageId/images/:imageId', packageController.deletePackageImage);
router.patch('/:packageId/images/:imageId/set-primary', packageController.setPrimaryImage);

// ⭐ SPESIFIK ROUTE'LAR (parametre içeren route'lardan ÖNCE)
router.get('/all-active', packageController.getAllActivePackagesForShopping);
router.get('/all-active-with-categories', packageController.getAllActivePackagesWithCategories);
router.get('/active', packageController.getActivePackages);
router.get('/active-with-categories', packageController.getActivePackagesWithCategories);
router.get('/history', packageController.getPackageHistory);
router.get('/my-packages', packageController.getMyPackages);
router.get('/my-packages-with-categories', packageController.getMyPackagesWithCategories);

// ⭐ PARAMETRE İÇEREN ROUTE'LAR (en sonda)
router.put('/:id', packageController.upload.none(), packageController.updatePackage);
router.post('/:id/cancel', packageController.cancelPackage);
router.get('/:id', packageController.getPackageById);
router.get('/:id/with-category', packageController.getPackageByIdWithCategory);

module.exports = router;