// models/Notification.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    notification_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'user_id'
      }
    },
    notification_type: {
      type: DataTypes.ENUM('order', 'promo', 'system', 'marketing'),
      allowNull: false,
      defaultValue: 'order'
    },
    related_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true, // Order ID, Package ID vs.
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    is_read: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'notifications',
    timestamps: false, // created_at'i manuel yönetiyoruz
    
    // 🎯 Scopes - Farklı bildirim türleri için
    scopes: {
      unread: {
        where: { is_read: 0 }
      },
      orders: {
        where: { notification_type: 'order' }
      },
      recent: {
        order: [['created_at', 'DESC']],
        limit: 50
      }
    }
  });

  // 🎯 INSTANCE METHODS
  
  // Bildirimi okundu olarak işaretle
  Notification.prototype.markAsRead = async function() {
    this.is_read = 1;
    return await this.save();
  };

  // Bildirim metnini formatla (emoji vs ekleyebilirsin)
  Notification.prototype.getFormattedMessage = function() {
    const typeEmojis = {
      'order': '📦',
      'promo': '🎉',
      'system': '⚙️',
      'marketing': '📢'
    };
    
    return `${typeEmojis[this.notification_type] || '📌'} ${this.message}`;
  };

  // 🎯 STATIC METHODS
  
  // Kullanıcıya bildirim gönder
  Notification.sendToUser = async function(userId, data) {
    console.log('📨 Bildirim gönderiliyor:', { userId, ...data });
    
    try {
      const notification = await this.create({
        user_id: userId,
        notification_type: data.type || 'order',
        related_id: data.relatedId || null,
        title: data.title,
        message: data.message
      });
      
      console.log('✅ Bildirim başarıyla oluşturuldu:', notification.notification_id);
      
      // Burada gerçek zamanlı bildirim gönderebilirsin (Socket.io vs.)
      // await this.sendRealTimeNotification(userId, notification);
      
      return notification;
    } catch (error) {
      console.error('❌ Bildirim gönderilirken hata:', error);
      throw error;
    }
  };

  // Toplu bildirim gönder
  Notification.sendBulk = async function(userIds, data) {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      notification_type: data.type || 'order',
      related_id: data.relatedId || null,
      title: data.title,
      message: data.message,
      created_at: new Date()
    }));
    
    return await this.bulkCreate(notifications);
  };

  // Kullanıcının okunmamış bildirim sayısı
  Notification.getUnreadCount = async function(userId) {
    return await this.count({
      where: {
        user_id: userId,
        is_read: 0
      }
    });
  };

  // Kullanıcının bildirimlerini getir
  Notification.getUserNotifications = async function(userId, options = {}) {
    const { limit = 20, offset = 0, type = null } = options;
    
    const whereClause = { user_id: userId };
    if (type) whereClause.notification_type = type;
    
    return await this.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['user_id'],
          include: [{
            model: sequelize.models.UserProfile,
            as: 'profile',
            attributes: ['name']
          }]
        }
      ]
    });
  };

  // Eski bildirimleri temizle (30 günden eski)
  Notification.cleanup = async function() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const deletedCount = await this.destroy({
      where: {
        created_at: {
          [sequelize.Sequelize.Op.lt]: thirtyDaysAgo
        },
        is_read: 1 // Sadece okunmuş olanları sil
      }
    });
    
    console.log(`🧹 ${deletedCount} eski bildirim temizlendi`);
    return deletedCount;
  };

  // 🎯 ASSOCIATIONS
  Notification.associate = function(models) {
    // User ile many-to-one ilişki
    Notification.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // Order ile many-to-one ilişki (eğer order bildirimi ise)
    Notification.belongsTo(models.Order, {
      foreignKey: 'related_id',
      as: 'relatedOrder',
      constraints: false // Esnek ilişki
    });

    // FoodPackage ile many-to-one ilişki (eğer paket bildirimi ise)
    Notification.belongsTo(models.FoodPackage, {
      foreignKey: 'related_id',
      as: 'relatedPackage',
      constraints: false // Esnek ilişki
    });
  };

  return Notification;
};