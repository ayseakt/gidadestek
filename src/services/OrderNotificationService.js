// services/OrderNotificationService.js
const { Notification, User, Seller, FoodPackage, Order } = require('../models'); // Order eklendi

class OrderNotificationService {
  
  // 🎯 YENİ SİPARİŞ BİLDİRİMİ - Satıcıya gönder
  static async notifyNewOrder(order) {
    try {
      console.log('📨 Yeni sipariş bildirimi gönderiliyor...', order.order_id);
      
      // Satıcının user_id'sini bul
      const seller = await Seller.findByPk(order.seller_id, {
        attributes: ['seller_id', 'user_id', 'business_name']
      });
      
      if (!seller) {
        console.error('❌ Satıcı bulunamadı:', order.seller_id);
        return;
      }
      
      // Satıcıya bildirim gönder
      await Notification.sendToUser(seller.user_id, {
        type: 'order',
        relatedId: order.order_id,
        title: '🆕 Yeni Sipariş Alındı!',
        message: `Yeni bir sipariş aldınız! Sipariş #${order.order_id} - Toplam: ₺${order.total_amount}. Onay kodunuz: ${order.confirmationCode}`
      });
      
      console.log('✅ Satıcıya yeni sipariş bildirimi gönderildi');
      
    } catch (error) {
      console.error('❌ Yeni sipariş bildirimi gönderilirken hata:', error);
    }
  }
  
  // 🎯 SİPARİŞ DURUM DEĞİŞİKLİĞİ BİLDİRİMİ - Müşteriye gönder
  static async notifyOrderStatusChange(order, oldStatus, newStatus) {
    try {
      console.log('📦 Sipariş durum bildirimi gönderiliyor...', {
        orderId: order.order_id,
        oldStatus,
        newStatus
      });
      
      // Durum mesajlarını hazırla
      const statusMessages = {
        pending: {
          title: '⏳ Sipariş Beklemede',
          message: `Siparişiniz #${order.order_id} beklemede. Satıcı onayını bekliyoruz.`
        },
        confirmed: {
          title: '✅ Sipariş Onaylandı',
          message: `Harika! Siparişiniz #${order.order_id} onaylandı ve hazırlanmaya başlandı. Onay kodunuz: ${order.confirmationCode}`
        },
        ready: {
          title: '🎉 Sipariş Hazır!',
          message: `Siparişiniz #${order.order_id} hazır! Teslim almak için satıcıya onay kodunuzu (${order.confirmationCode}) gösterin.`
        },
        completed: {
          title: '🌟 Sipariş Tamamlandı',
          message: `Siparişiniz #${order.order_id} başarıyla teslim edildi. Deneyiminizi değerlendirmeyi unutmayın!`
        },
        cancelled: {
          title: '❌ Sipariş İptal Edildi',
          message: `Siparişiniz #${order.order_id} iptal edildi. ${order.cancellation_reason ? 'Sebep: ' + order.cancellation_reason : ''}`
        }
      };
      
      const notification = statusMessages[newStatus];
      if (!notification) {
        console.log('⚠️ Bilinmeyen durum için bildirim yok:', newStatus);
        return;
      }
      
      // Müşteriye bildirim gönder
      await Notification.sendToUser(order.user_id, {
        type: 'order',
        relatedId: order.order_id,
        title: notification.title,
        message: notification.message
      });
      
      console.log(`✅ Müşteriye ${newStatus} bildirimi gönderildi`);
      
    } catch (error) {
      console.error('❌ Durum değişikliği bildirimi gönderilirken hata:', error);
    }
  }
  
  // 🎯 YENİ PAKET BİLDİRİMİ - İlgilenen müşterilere gönder
  static async notifyNewPackage(foodPackage) {
    try {
      console.log('📦 Yeni paket bildirimi gönderiliyor...', foodPackage.package_id);
      
      // Bu satıcıdan daha önce sipariş vermiş müşterileri bul
      const previousCustomers = await User.findAll({
        include: [{
          model: Order,
          as: 'orders',
          where: {
            seller_id: foodPackage.seller_id,
            order_status: 'completed'
          },
          attributes: []
        }],
        attributes: ['user_id'],
        group: ['User.user_id']
      });
      
      if (previousCustomers.length === 0) {
        console.log('ℹ️ Bu satıcıdan sipariş vermiş müşteri yok');
        return;
      }
      
      // Satıcı bilgisini al
      const seller = await Seller.findByPk(foodPackage.seller_id, {
        attributes: ['business_name']
      });
      
      const userIds = previousCustomers.map(user => user.user_id);
      
      // Toplu bildirim gönder
      await Notification.sendBulk(userIds, {
        type: 'promo',
        relatedId: foodPackage.package_id,
        title: '🆕 Yeni Paket!',
        message: `${seller?.business_name || 'Sevdiğiniz satıcı'} yeni bir paket ekledi: ${foodPackage.package_name} - ₺${foodPackage.discounted_price}`
      });
      
      console.log(`✅ ${userIds.length} müşteriye yeni paket bildirimi gönderildi`);
      
    } catch (error) {
      console.error('❌ Yeni paket bildirimi gönderilirken hata:', error);
    }
  }
  
  // 🎯 ONAY KODU YENİLENDİ BİLDİRİMİ
  static async notifyCodeRegenerated(order) {
    try {
      await Notification.sendToUser(order.user_id, {
        type: 'order',
        relatedId: order.order_id,
        title: '🔄 Onay Kodu Yenilendi',
        message: `Sipariş #${order.order_id} için yeni onay kodunuz: ${order.confirmationCode}`
      });
      
      console.log('✅ Onay kodu yenilenme bildirimi gönderildi');
    } catch (error) {
      console.error('❌ Onay kodu bildirimi gönderilirken hata:', error);
    }
  }
  
  // 🎯 TOPLU PAZARLAMA BİLDİRİMİ
  static async sendMarketingNotification(userIds, data) {
    try {
      await Notification.sendBulk(userIds, {
        type: 'marketing',
        title: data.title,
        message: data.message
      });
      
      console.log(`✅ ${userIds.length} kullanıcıya pazarlama bildirimi gönderildi`);
    } catch (error) {
      console.error('❌ Pazarlama bildirimi gönderilirken hata:', error);
    }
  }
}

module.exports = OrderNotificationService;