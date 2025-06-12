const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const statisticsController = require('../controllers/statisticsController');

// Satıcıya özel istatistikler (giriş gerektirir)
router.get('/general', authenticateToken, statisticsController.getGeneralStatistics);
router.get('/period/:period', authenticateToken, statisticsController.getPeriodStatistics);
router.get('/charts/:type', authenticateToken, statisticsController.getChartData);
router.get('/detailed/:sellerId', authenticateToken, statisticsController.getDetailedStatistics);
router.get('/my-stats', authenticateToken, statisticsController.getGeneralStatistics);

// SİSTEM GENELİ (herkese açık)
router.get('/', statisticsController.getStatistics);
router.get('/weekly-sales', statisticsController.getWeeklySales);
router.get('/category-distribution', statisticsController.getCategoryDistribution);
router.get('/monthly-trend', statisticsController.getMonthlyTrend);
router.get('/hourly-distribution', statisticsController.getHourlyDistribution);

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Statistics routes çalışıyor!',
    middlewareType: typeof authenticateToken,
    controllerFunctions: Object.keys(statisticsController)
  });
});

module.exports = router;