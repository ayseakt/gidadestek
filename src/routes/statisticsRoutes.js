const express = require('express');
const router = express.Router();
// Gerekli controller veya model import'ları

// "/api/statistics/my-stats" endpoint'ini ekleyin
router.get('/my-stats', async (req, res) => {
  try {
    // Gerçek uygulamanızda burada veritabanından veri çekersiniz
    // Şimdilik örnek veri dönelim
    res.json({
      totalPackages: 10,
      activePackages: 5,
      completedPackages: 3,
      cancelledPackages: 2,
      totalEarnings: 1500,
      ratings: {
        average: 4.5,
        count: 8
      }
    });
  } catch (error) {
    console.error('İstatistik verisi alma hatası:', error);
    res.status(500).json({ error: 'İstatistik verileri alınamadı' });
  }
});

module.exports = router;