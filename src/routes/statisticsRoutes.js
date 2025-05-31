const express = require('express');
const router = express.Router();

const statisticsController = require('../controllers/statisticsController');
console.log('statisticsController:', statisticsController);

const authenticateToken = require('../middleware/authMiddleware');

// ✅ DÜZELTME: Route yolları prefix olmadan
// /api/statistics zaten server.js'de tanımlı
router.get('/general', authenticateToken, statisticsController.getGeneralStatistics);
router.get('/period/:period', authenticateToken, statisticsController.getPeriodStatistics);
router.get('/charts/:type', authenticateToken, statisticsController.getChartData);
router.get('/detailed/:sellerId', authenticateToken, statisticsController.getDetailedStatistics);
// ✅ YENİ: Frontend'in beklediği route
router.get('/my-stats', authenticateToken, statisticsController.getGeneralStatistics);


module.exports = router;