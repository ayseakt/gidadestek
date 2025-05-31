// controllers/NotificationController.js
const { Notification, User, Order, FoodPackage, Seller } = require('../models');
const OrderNotificationService = require('../services/OrderNotificationService');

class NotificationController {
  
  // 📱 KULLANICI BİLDİRİMLERİNİ GETİR
  static async getUserNotifications(req, res) {
    try {
      const userId = req.user.user_id; // Auth middleware'den geliyor
      const { 
        page = 1, 
        limit = 20, 
        type = null, 
        unreadOnly = false 
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      console.log('📱 Kullanıcı bildirimleri getiriliyor:', {
        userId,
        page,
        limit,
        type,
        unreadOnly
      });
      
      // Where koşullarını hazırla
      const whereClause = { user_id: userId };
      if (type) whereClause.notification_type = type;
      if (unreadOnly === 'true') whereClause.is_read = 0;
      
      // Bildirimleri getir
      const notifications = await Notification.findAndCountAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['user_id'],
            include: [{
              model: require('../models').UserProfile,
              as: 'profile',
              attributes: ['name'],
              required: false
            }]
          }
        ]
      });
      
      // Okunmamış bildirim sayısı
      const unreadCount = await Notification.getUnreadCount(userId);
      
      res.json({
        success: true,
        data: {
          notifications: notifications.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(notifications.count / limit),
            totalCount: notifications.count,
            hasNext: (page * limit) < notifications.count,
            hasPrev: page > 1
          },
          unreadCount
        }
      });
      
    } catch (error) {
      console.error('❌ Bildirimler getirilirken hata:', error);
      res.status(500).json({
        success: false,
        message: 'Bildirimler getirilemedi',
        error: error.message
      });
    }
  }
  
  // 🔔 OKUNMAMIŞ BİLDİRİM SAYISI
  static async getUnreadCount(req, res) {
    try {
      const userId = req.user.user_id;
      
      const unreadCount = await Notification.getUnreadCount(userId);
      
      res.json({
        success: true,
        data: { unreadCount }
      });
      
    } catch (error) {
      console.error('❌ Okunmamış bildirim sayısı alınırken hata:', error);
      res.status(500).json({
        success: false,
        message: 'Bildirim sayısı alınamadı',
        error: error.message
      });
    }
  }
  
  // ✅ BİLDİRİMİ OKUNDU OLARAK İŞARETLE
  static async markAsRead(req, res) {
    try {
      const userId = req.user.user_id;
      const { notificationId } = req.params;
      
      console.log('✅ Bildirim okundu olarak işaretleniyor:', {
        userId,
        notificationId
      });
      
      // Bildirimi bul ve kullanıcının bildirimi olduğunu kontrol et
      const notification = await Notification.findOne({
        where: {
          notification_id: notificationId,
          user_id: userId
        }
      });
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Bildirim bulunamadı'
        });
      }
      
      // Zaten okunmuşsa
      if (notification.is_read) {
        return res.json({
          success: true,
          message: 'Bildirim zaten okunmuş',
          data: notification
        });
      }
      
      // Okundu olarak işaretle
      await notification.markAsRead();
      
      res.json({
        success: true,
        message: 'Bildirim okundu olarak işaretlendi',
        data: notification
      });
      
    } catch (error) {
      console.error('❌ Bildirim okundu işaretlenirken hata:', error);
      res.status(500).json({
        success: false,
        message: 'Bildirim güncellenemedi',
        error: error.message
      });
    }
  }
  
  // ✅ TÜM BİLDİRİMLERİ OKUNDU OLARAK İŞARETLE
  static async markAllAsRead(req, res) {
    try {
      const userId = req.user.user_id;
      const { type = null } = req.body; // İsteğe bağlı: sadece belirli tip
      
      console.log('✅ Tüm bildirimler okundu olarak işaretleniyor:', {
        userId,
        type
      });
      
      const whereClause = {
        user_id: userId,
        is_read: 0
      };
      
      if (type) whereClause.notification_type = type;
      
      const [updatedCount] = await Notification.update(
        { is_read: 1 },
        { where: whereClause }
      );
      
      res.json({
        success: true,
        message: `${updatedCount} bildirim okundu olarak işaretlendi`,
        data: { updatedCount }
      });
      
    } catch (error) {
      console.error('❌ Toplu okundu işaretleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Bildirimler güncellenemedi',
        error: error.message
      });
    }
  }
  
  // 🗑️ BİLDİRİMİ SİL
  static async deleteNotification(req, res) {
    try {
      const userId = req.user.user_id;
      const { notificationId } = req.params;
      
      console.log('🗑️ Bildirim siliniyor:', {
        userId,
        notificationId
      });
      
      const notification = await Notification.findOne({
        where: {
          notification_id: notificationId,
          user_id: userId
        }
      });
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Bildirim bulunamadı'
        });
      }
      
      await notification.destroy();
      
      res.json({
        success: true,
        message: 'Bildirim başarıyla silindi'
      });
      
    } catch (error) {
      console.error('❌ Bildirim silinirken hata:', error);
      res.status(500).json({
        success: false,
        message: 'Bildirim silinemedi',
        error: error.message
      });
    }
  }
  
  // 🗑️ TÜM OKUNMUŞ BİLDİRİMLERİ SİL
  static async deleteReadNotifications(req, res) {
    try {
      const userId = req.user.user_id;
      
      console.log('🗑️ Okunmuş bildirimler siliniyor:', userId);
      
      const deletedCount = await Notification.destroy({
        where: {
          user_id: userId,
          is_read: 1
        }
      });
      
      res.json({
        success: true,
        message: `${deletedCount} okunmuş bildirim silindi`,
        data: { deletedCount }
      });
      
    } catch (error) {
      console.error('❌ Okunmuş bildirimler silinirken hata:', error);
      res.status(500).json({
        success: false,
        message: 'Bildirimler silinemedi',
        error: error.message
      });
    }
  }
  
  // 📊 BİLDİRİM İSTATİSTİKLERİ
  static async getNotificationStats(req, res) {
    try {
      const userId = req.user.user_id;
      
      console.log('📊 Bildirim istatistikleri getiriliyor:', userId);
      
      // Tip başına sayım
      const stats = await Notification.findAll({
        where: { user_id: userId },
        attributes: [
          'notification_type',
          [Notification.sequelize.fn('COUNT', '*'), 'total'],
          [Notification.sequelize.fn('SUM', 
            Notification.sequelize.case()
              .when({ is_read: 0 }, 1)
              .else(0)
          ), 'unread']
        ],
        group: ['notification_type'],
        raw: true
      });
      
      // Son 7 günlük aktivite
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentActivity = await Notification.findAll({
        where: {
          user_id: userId,
          created_at: {
            [Notification.sequelize.Op.gte]: weekAgo
          }
        },
        attributes: [
          [Notification.sequelize.fn('DATE', Notification.sequelize.col('created_at')), 'date'],
          [Notification.sequelize.fn('COUNT', '*'), 'count']
        ],
        group: [Notification.sequelize.fn('DATE', Notification.sequelize.col('created_at'))],
        order: [[Notification.sequelize.fn('DATE', Notification.sequelize.col('created_at')), 'DESC']],
        raw: true
      });
      
      res.json({
        success: true,
        data: {
          byType: stats,
          recentActivity: recentActivity
        }
      });
      
    } catch (error) {
      console.error('❌ Bildirim istatistikleri alınırken hata:', error);
      res.status(500).json({
        success: false,
        message: 'İstatistikler alınamadı',
        error: error.message
      });
    }
  }
  
  // 🎯 ADMIN: TOPLU BİLDİRİM GÖNDER
  static async sendBulkNotification(req, res) {
    try {
      // Admin kontrolü (middleware'de yapılmalı)
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Bu işlem için yetkiniz yok'
        });
      }
      
      const { 
        userIds, 
        title, 
        message, 
        type = 'marketing',
        targetGroup = null // 'all', 'active_users', 'recent_customers' vs.
      } = req.body;
      
      console.log('📢 Toplu bildirim gönderiliyor:', {
        userIds: userIds?.length || 'Tüm kullanıcılar',
        title,
        type,
        targetGroup
      });
      
      let finalUserIds = userIds;
      
      // Hedef grup belirlenmişse kullanıcıları bul
      if (targetGroup && !userIds) {
        switch (targetGroup) {
          case 'all':
            const allUsers = await User.findAll({ attributes: ['user_id'] });
            finalUserIds = allUsers.map(u => u.user_id);
            break;
            
          case 'active_users':
            // Son 30 gün içinde sipariş vermiş kullanıcılar
            const activeUsers = await User.findAll({
              include: [{
                model: Order,
                as: 'orders',
                where: {
                  order_date: {
                    [User.sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                  }
                },
                attributes: []
              }],
              attributes: ['user_id'],
              group: ['User.user_id']
            });
            finalUserIds = activeUsers.map(u => u.user_id);
            break;
            
          case 'recent_customers':
            // Son 7 gün içinde sipariş vermiş kullanıcılar
            const recentUsers = await User.findAll({
              include: [{
                model: Order,
                as: 'orders',
                where: {
                  order_date: {
                    [User.sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  }
                },
                attributes: []
              }],
              attributes: ['user_id'],
              group: ['User.user_id']
            });
            finalUserIds = recentUsers.map(u => u.user_id);
            break;
        }
      }
      
      if (!finalUserIds || finalUserIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Hedef kullanıcı bulunamadı'
        });
      }
      
      // Bildirimi gönder
      await OrderNotificationService.sendMarketingNotification(finalUserIds, {
        title,
        message,
        type
      });
      
      res.json({
        success: true,
        message: `${finalUserIds.length} kullanıcıya bildirim gönderildi`,
        data: {
          sentCount: finalUserIds.length,
          targetGroup
        }
      });
      
    } catch (error) {
      console.error('❌ Toplu bildirim gönderilirken hata:', error);
      res.status(500).json({
        success: false,
        message: 'Toplu bildirim gönderilemedi',
        error: error.message
      });
    }
  }
  
  // 🔧 ADMIN: ESKİ BİLDİRİMLERİ TEMİZLE
  static async cleanupOldNotifications(req, res) {
    try {
      // Admin kontrolü
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Bu işlem için yetkiniz yok'
        });
      }
      
      console.log('🧹 Eski bildirimler temizleniyor...');
      
      const deletedCount = await Notification.cleanup();
      
      res.json({
        success: true,
        message: `${deletedCount} eski bildirim temizlendi`,
        data: { deletedCount }
      });
      
    } catch (error) {
      console.error('❌ Bildirim temizliği sırasında hata:', error);
      res.status(500).json({
        success: false,
        message: 'Bildirimler temizlenemedi',
        error: error.message
      });
    }
  }
  
  // 🎯 BİLDİRİM DETAYI - İlgili siparişi/paketi de getir
  static async getNotificationDetail(req, res) {
    try {
      const userId = req.user.user_id;
      const { notificationId } = req.params;
      
      console.log('📋 Bildirim detayı getiriliyor:', {
        userId,
        notificationId
      });
      
      const notification = await Notification.findOne({
        where: {
          notification_id: notificationId,
          user_id: userId
        },
        include: [
          {
            model: Order,
            as: 'relatedOrder',
            required: false,
            include: [
              {
                model: Seller,
                as: 'seller',
                attributes: ['seller_id', 'business_name']
              }
            ]
          },
          {
            model: FoodPackage,
            as: 'relatedPackage',
            required: false,
            include: [
              {
                model: Seller,
                as: 'seller',
                attributes: ['seller_id', 'business_name']
              }
            ]
          }
        ]
      });
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Bildirim bulunamadı'
        });
      }
      
      // Otomatik okundu işaretle
      if (!notification.is_read) {
        await notification.markAsRead();
      }
      
      res.json({
        success: true,
        data: notification
      });
      
    } catch (error) {
      console.error('❌ Bildirim detayı alınırken hata:', error);
      res.status(500).json({
        success: false,
        message: 'Bildirim detayı alınamadı',
        error: error.message
      });
    }
  }
  
  // 🎯 BİLDİRİM TERCİHLERİNİ GÜNCELLE (gelecek için)
  static async updateNotificationPreferences(req, res) {
    try {
      const userId = req.user.user_id;
      const { 
        enableOrderNotifications = true,
        enablePromoNotifications = true,
        enableMarketingNotifications = false,
        enableSystemNotifications = true 
      } = req.body;
      
      // Kullanıcı tercihleri tablosu gerekebilir (şimdilik basit response)
      console.log('⚙️ Bildirim tercihleri güncelleniyor:', {
        userId,
        enableOrderNotifications,
        enablePromoNotifications,
        enableMarketingNotifications,
        enableSystemNotifications
      });
      
      // Bu kısım için ayrı bir UserNotificationPreferences modeli oluşturulabilir
      
      res.json({
        success: true,
        message: 'Bildirim tercihleri güncellendi',
        data: {
          enableOrderNotifications,
          enablePromoNotifications,
          enableMarketingNotifications,
          enableSystemNotifications
        }
      });
      
    } catch (error) {
      console.error('❌ Bildirim tercihleri güncellenirken hata:', error);
      res.status(500).json({
        success: false,
        message: 'Tercihler güncellenemedi',
        error: error.message
      });
    }
  }
}

module.exports = NotificationController;