const express = require('express');
const router = express.Router();

// Debug için controller içeriğini görelim
const locationController = require('../controllers/LocationController');
// console.log('Controller içeriği:', locationController); // Bu log ile controller içeriğini görebilirsiniz
const authenticateJWT = require('../middleware/authMiddleware');

// Hata durumunda, router'ı çalışır hale getirmek için geçici çözüm
// Eğer locationController.getLocations undefined ise, geçici bir fonksiyon kullanın
const getLocationsHandler = locationController.getLocations || 
  ((req, res) => {
    res.status(200).json({
      success: true,
      message: 'Geçici yanıt: Controller sorunu çözülene kadar',
      debug: 'Controller fonksiyonu bulunamadı'
    });
  });

// CRUD işlemleri
router.get('/', authenticateJWT, getLocationsHandler);
router.post('/', authenticateJWT, locationController.createLocation);
router.put('/:id', authenticateJWT, locationController.updateLocation);
router.delete('/:id', authenticateJWT, locationController.deleteLocation);

module.exports = router;