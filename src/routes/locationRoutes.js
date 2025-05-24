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

// ✅ YENİ: Varsayılan adres ayarlama endpoint'i (PATCH metodu ile)
// Frontend'in beklediği format: PATCH /api/locations/{id} 
// is_default: true gönderilir
router.patch('/:id', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const locationId = req.params.id;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Kullanıcı bulunamadı' 
      });
    }

    console.log('Varsayılan adres ayarlama isteği:', { userId, locationId, body: req.body });

    // Mevcut updateLocation fonksiyonunu kullan - is_default: true gönder
    const updatedBody = {
      ...req.body,
      is_default: true
    };

    // req.body'yi güncelle
    req.body = updatedBody;

    // Mevcut updateLocation controller'ını çağır
    return await locationController.updateLocation(req, res);

  } catch (error) {
    console.error('Varsayılan adres ayarlama hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Varsayılan adres ayarlanırken bir hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;