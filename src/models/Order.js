// models/Order.js - Düzeltilmiş Onay Kodu Sistemi
const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    order_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'user',
        key: 'user_id'
      }
    },
    seller_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'sellers',
        key: 'seller_id'
      }
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        isFloat: true
      }
    },
    order_status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'ready', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'pending'
    },
    order_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    pickup_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    pickup_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cancellation_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    
    // 🔑 ONAY KODU SİSTEMİ - NULL değer kabul etmez
    confirmationCode: { 
      type: DataTypes.STRING(6), 
      unique: true,
      allowNull: false, // NULL olamaz
      validate: {
        len: [6, 6], // Tam 6 karakter olmalı
        isNumeric: true // Sadece rakam olmalı
      }
    },
    codeGeneratedAt: { 
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    codeUsedAt: {
      type: DataTypes.DATE,
      allowNull: true // Kod kullanıldığında set edilecek
    },
    codeUsedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true, // Kodu kim kullandı (seller_id)
      references: {
        model: 'sellers',
        key: 'seller_id'
      }
    },
    isCodeExpired: {
      type: DataTypes.VIRTUAL,
      get() {
        // Kod 24 saat sonra expires olsun
        const expirationTime = 24 * 60 * 60 * 1000; // 24 saat
        const now = new Date();
        const generatedAt = new Date(this.codeGeneratedAt);
        return (now - generatedAt) > expirationTime;
      }
    }
  }, {
    tableName: 'orders',
    timestamps: true,
    createdAt: 'order_date',
    updatedAt: 'updated_at',
    
    // 🎯 HOOKS - Sipariş işlemleri
    hooks: {
      beforeValidate: async (order, options) => {
        console.log('🔍 beforeValidate hook çalışıyor...');
        
        // Eğer confirmationCode yoksa üret
        if (!order.confirmationCode) {
          console.log('🔑 confirmationCode üretiliyor...');
          order.confirmationCode = await generateUniqueConfirmationCode(Order);
          order.codeGeneratedAt = new Date();
          
          console.log('✅ Onay kodu üretildi:', {
            code: order.confirmationCode,
            generatedAt: order.codeGeneratedAt
          });
        }
      },
      
      beforeCreate: async (order, options) => {
        console.log('🔍 beforeCreate hook çalışıyor...');
        
        // Double check - eğer hala yoksa üret
        if (!order.confirmationCode) {
          console.log('⚠️ beforeCreate\'te confirmationCode eksik, üretiliyor...');
          order.confirmationCode = await generateUniqueConfirmationCode(Order);
          order.codeGeneratedAt = new Date();
        }
        
        console.log('🔑 beforeCreate tamamlandı:', {
          orderId: order.order_id,
          code: order.confirmationCode,
          generatedAt: order.codeGeneratedAt
        });
      },
      
      afterCreate: (order, options) => {
        console.log('✅ Sipariş başarıyla oluşturuldu:', {
          orderId: order.order_id,
          confirmationCode: order.confirmationCode,
          userId: order.user_id,
          sellerId: order.seller_id
        });
      },
      
      afterUpdate: (order, options) => {
        // Durum değişikliklerini logla
        if (order.changed('order_status')) {
          console.log('📦 Sipariş durumu değişti:', {
            orderId: order.order_id,
            code: order.confirmationCode,
            oldStatus: order._previousDataValues.order_status,
            newStatus: order.order_status
          });
        }
      }
    }
  });

  // 🎯 ONAY KODU ÜRETİM FONKSİYONU (Benzersizlik garantili)
  async function generateUniqueConfirmationCode(OrderModel) {
    console.log('🎲 Benzersiz onay kodu üretiliyor...');
    
    let code;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      // 6 haneli rastgele sayı üret (100000 - 999999)
      code = Math.floor(100000 + Math.random() * 900000).toString();
      
      console.log(`🎲 Deneme ${attempts + 1}: Kod ${code} kontrol ediliyor...`);
      
      try {
        // Veritabanında bu kodun var olup olmadığını kontrol et
        const existingOrder = await OrderModel.findOne({
          where: { confirmationCode: code }
        });
        
        if (!existingOrder) {
          isUnique = true;
          console.log(`✅ Benzersiz kod bulundu: ${code}`);
        } else {
          console.log(`❌ Kod ${code} zaten kullanımda`);
        }
      } catch (error) {
        console.error('❌ Kod kontrolü sırasında hata:', error);
      }
      
      attempts++;
    }

    if (!isUnique) {
      const errorMsg = 'Benzersiz onay kodu üretilemedi. Lütfen tekrar deneyin.';
      console.error('❌', errorMsg);
      throw new Error(errorMsg);
    }

    console.log(`🎉 Benzersiz kod üretildi: ${code} (${attempts} denemede)`);
    return code;
  }

  // 🎯 INSTANCE METHODS
  
  // Onay kodunu yenile
  Order.prototype.regenerateConfirmationCode = async function() {
    console.log('🔄 Onay kodu yenileniyor...', this.order_id);
    
    this.confirmationCode = await generateUniqueConfirmationCode(Order);
    this.codeGeneratedAt = new Date();
    this.codeUsedAt = null; // Önceki kullanım kaydını sıfırla
    this.codeUsedBy = null;
    
    console.log('🔄 Onay kodu yenilendi:', {
      orderId: this.order_id,
      newCode: this.confirmationCode
    });
    
    return await this.save();
  };

  // Siparişi onay kodu ile teslim et
  Order.prototype.deliverWithCode = async function(inputCode, sellerId) {
    console.log('🔍 Kod ile teslim işlemi başlatılıyor:', {
      orderId: this.order_id,
      inputCode,
      sellerId
    });
    
    // Kod doğrulama
    if (this.confirmationCode !== inputCode.toString()) {
      throw new Error('Onay kodu hatalı!');
    }

    // Kod daha önce kullanılmış mı?
    if (this.codeUsedAt) {
      throw new Error('Bu onay kodu daha önce kullanılmış!');
    }

    // Kod expired mı?
    if (this.isCodeExpired) {
      throw new Error('Onay kodu süresi dolmuş! Yeni kod talep edin.');
    }

    // Sipariş durumu uygun mu?
    if (this.order_status !== 'ready') {
      throw new Error('Sipariş henüz hazır değil!');
    }

    // Kodu kullan ve siparişi teslim et
    this.codeUsedAt = new Date();
    this.codeUsedBy = sellerId;
    this.order_status = 'completed';

    await this.save();

    console.log('✅ Sipariş başarıyla teslim edildi:', {
      orderId: this.order_id,
      code: this.confirmationCode,
      deliveredBy: sellerId,
      deliveredAt: this.codeUsedAt
    });

    return this;
  };

  // Kod durumunu kontrol et
  Order.prototype.getCodeStatus = function() {
    return {
      code: this.confirmationCode,
      isExpired: this.isCodeExpired,
      isUsed: !!this.codeUsedAt,
      usedAt: this.codeUsedAt,
      usedBy: this.codeUsedBy,
      generatedAt: this.codeGeneratedAt,
      canBeUsed: !this.isCodeExpired && !this.codeUsedAt && this.order_status === 'ready'
    };
  };

  // 🎯 STATIC METHODS

  // Onay kodu ile sipariş bul
  Order.findByConfirmationCode = function(code) {
    return this.findOne({
      where: { confirmationCode: code },
      include: [
        { 
          model: sequelize.models.User, 
          as: 'user',
          attributes: ['user_id', 'name', 'email', 'phone']
        },
        { 
          model: sequelize.models.Seller, 
          as: 'seller',
          attributes: ['seller_id', 'business_name',]
        },
        { 
          model: sequelize.models.OrderItem, 
          as: 'items',
          include: [
            {
              model: sequelize.models.Product,
              as: 'product',
              attributes: ['name', 'description']
            }
          ]
        }
      ]
    });
  };

  // Kod doğrulama ve sipariş getirme
  Order.validateAndGetByCode = async function(code) {
    const order = await this.findByConfirmationCode(code);
    
    if (!order) {
      throw new Error('Geçersiz onay kodu!');
    }

    const status = order.getCodeStatus();
    
    if (!status.canBeUsed) {
      if (status.isExpired) {
        throw new Error('Onay kodu süresi dolmuş!');
      }
      if (status.isUsed) {
        throw new Error('Bu onay kodu daha önce kullanılmış!');
      }
      if (order.order_status !== 'ready') {
        throw new Error('Sipariş henüz teslime hazır değil!');
      }
    }

    return order;
  };

  // Expired kodları temizle (cron job için)
  Order.cleanupExpiredCodes = async function() {
    const expiredOrders = await this.findAll({
      where: {
        order_status: ['pending', 'confirmed', 'ready'],
        codeGeneratedAt: {
          [sequelize.Sequelize.Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        codeUsedAt: null
      }
    });

    let cleanedCount = 0;
    for (const order of expiredOrders) {
      await order.regenerateConfirmationCode();
      cleanedCount++;
    }

    console.log(`🧹 ${cleanedCount} expired onay kodu yenilendi`);
    return cleanedCount;
  };

  // 🎯 ASSOCIATIONS
  Order.associate = function(models) {
    // User ile many-to-one ilişki
    Order.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // Seller ile many-to-one ilişki (sipariş sahibi)
    Order.belongsTo(models.Seller, {
      foreignKey: 'seller_id',
      as: 'seller'
    });

    // Seller ile many-to-one ilişki (kodu kullanan)
    Order.belongsTo(models.Seller, {
      foreignKey: 'codeUsedBy',
      as: 'deliveredBy'
    });

    // OrderItems ile one-to-many ilişki
    Order.hasMany(models.OrderItem, {
      foreignKey: 'order_id',
      as: 'items'
    });

    // OrderStatusHistory ile one-to-many ilişki
    Order.hasMany(models.OrderStatusHistory, {
      foreignKey: 'order_id',
      as: 'statusHistory'
    });
    Order.hasMany(models.Review, {
      foreignKey: 'order_id',
      as: 'reviews'
    });
  };

  return Order;
};