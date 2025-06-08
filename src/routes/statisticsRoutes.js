const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const statisticsController = require('../controllers/statisticsController');
console.log('statisticsController:', statisticsController);

// ✅ DÜZELTME: authMiddleware direkt fonksiyon export ediyor
const authenticateToken = require('../middleware/authMiddleware');

// Debug: middleware tipini kontrol et
console.log('authenticateToken type:', typeof authenticateToken);

// ✅ DÜZELTME: Route yolları prefix olmadan
// /api/statistics zaten server.js'de tanımlı
router.get('/general', authenticateToken, statisticsController.getGeneralStatistics);
router.get('/period/:period', authenticateToken, statisticsController.getPeriodStatistics);
router.get('/charts/:type', authenticateToken, statisticsController.getChartData);
router.get('/detailed/:sellerId', authenticateToken, statisticsController.getDetailedStatistics);

// ✅ YENİ: Frontend'in beklediği route
router.get('/my-stats', authenticateToken, statisticsController.getGeneralStatistics);

// Test route - middleware olmadan
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Statistics routes çalışıyor!',
    middlewareType: typeof authenticateToken,
    controllerFunctions: Object.keys(statisticsController)
  });
});

module.exports = router;