// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');

// Middleware'ler - dosya yollarını kontrol edin
const authMiddleware = require('../middleware/authMiddleware'); // Tam dosya adıyla
// const adminMiddleware = require('../middlewares/admin'); // Bu dosya yoksa yoruma alın

// 🔐 Tüm route'lar authentication gerektirir
router.use(authMiddleware);

// 📱 KULLANICI BİLDİRİM ROUTE'LARI

/**
 * @route   GET /api/notifications
 * @desc    Kullanıcının bildirimlerini getir
 * @access  Private
 * @query   page, limit, type, unreadOnly
 */
router.get('/', NotificationController.getUserNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Okunmamış bildirim sayısını getir
 * @access  Private
 */
router.get('/unread-count', NotificationController.getUnreadCount);

/**
 * @route   GET /api/notifications/stats
 * @desc    Bildirim istatistiklerini getir
 * @access  Private
 */
router.get('/stats', NotificationController.getNotificationStats);

/**
 * @route   GET /api/notifications/:notificationId
 * @desc    Bildirim detayını getir (otomatik okundu işaretle)
 * @access  Private
 */
router.get('/:notificationId', NotificationController.getNotificationDetail);

/**
 * @route   PUT /api/notifications/:notificationId/read
 * @desc    Bildirimi okundu olarak işaretle
 * @access  Private
 */
router.put('/:notificationId/read', NotificationController.markAsRead);

/**
 * @route   PUT /api/notifications/mark-all-read
 * @desc    Tüm bildirimleri okundu olarak işaretle
 * @access  Private
 * @body    type (opsiyonel - belirli tip bildirimleri için)
 */
router.put('/mark-all-read', NotificationController.markAllAsRead);

/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    Bildirimi sil
 * @access  Private
 */
router.delete('/:notificationId', NotificationController.deleteNotification);

/**
 * @route   DELETE /api/notifications/read
 * @desc    Tüm okunmuş bildirimleri sil
 * @access  Private
 */
router.delete('/read', NotificationController.deleteReadNotifications);

/**
 * @route   PUT /api/notifications/preferences
 * @desc    Bildirim tercihlerini güncelle
 * @access  Private
 */
router.put('/preferences', NotificationController.updateNotificationPreferences);

// 🎯 ADMİN ROUTE'LARI (Admin middleware gerekir)
// Admin middleware dosyanız yoksa bu kısımları yoruma alın

/**
 * @route   POST /api/notifications/admin/bulk-send
 * @desc    Toplu bildirim gönder
 * @access  Admin
 * @body    userIds[], title, message, type, targetGroup
 */
// router.post('/admin/bulk-send', adminMiddleware, NotificationController.sendBulkNotification);

/**
 * @route   POST /api/notifications/admin/cleanup
 * @desc    Eski bildirimleri temizle
 * @access  Admin
 */
// router.post('/admin/cleanup', adminMiddleware, NotificationController.cleanupOldNotifications);

module.exports = router;