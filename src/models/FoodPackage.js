// models/FoodPackage.js
module.exports = (sequelize, DataTypes) => {
  const FoodPackage = sequelize.define('FoodPackage', {
    package_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    seller_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    category_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    package_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Paket adı boş olamaz' },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    original_price: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
      validate: {
        min: 0,
        isFloat: true,
      },
    },
    discounted_price: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
      validate: {
        min: 0,
        isFloat: true,
        isLessThanOriginal(value) {
          if (this.original_price && value >= this.original_price) {
            throw new Error('İndirimli fiyat, normal fiyattan düşük olmalıdır.');
          }
        },
      },
    },
    quantity_available: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: {
        min: 1,
        isInt: true,
      },
    },
    pickup_start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    pickup_end_time: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isAfterStart(value) {
          if (this.pickup_start_time && value <= this.pickup_start_time) {
            throw new Error('Teslim alma bitiş saati, başlangıç saatinden sonra olmalıdır.');
          }
        },
      },
    },
    available_from: {
      type: DataTypes.DATE,
      allowNull: true
    },
    available_until: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_active: {
      type: DataTypes.TINYINT(1),
      allowNull: true,
      defaultValue: 1
    },
    cancellation_reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW
    },
  }, {
    tableName: 'food_packages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      afterCreate: async (foodPackage, options) => {
        console.log('✅ Yeni paket oluşturuldu:', {
          packageId: foodPackage.package_id,
          packageName: foodPackage.package_name,
          sellerId: foodPackage.seller_id,
          price: foodPackage.discounted_price
        });
        
        // 🎯 YENİ PAKET BİLDİRİMİ GÖNDER
        try {
          const OrderNotificationService = require('../services/OrderNotificationService');
          await OrderNotificationService.notifyNewPackage(foodPackage);
        } catch (error) {
          console.error('❌ Yeni paket bildirimi gönderilemedi:', error);
          // Bildirim hatası paketi iptal etmez
        }
      },
      
      afterUpdate: async (foodPackage, options) => {
        // Paket aktif hale geldiğinde bildirim gönder
        if (foodPackage.changed('is_active') && foodPackage.is_active === 1) {
          console.log('📦 Paket aktif hale geldi:', foodPackage.package_id);
          
          try {
            const OrderNotificationService = require('../services/OrderNotificationService');
            await OrderNotificationService.notifyNewPackage(foodPackage);
          } catch (error) {
            console.error('❌ Paket aktivasyon bildirimi gönderilemedi:', error);
          }
        }
        
        // Paket iptal edildiğinde (örnek)
        if (foodPackage.changed('is_active') && foodPackage.is_active === 0) {
          console.log('❌ Paket pasif hale geldi:', {
            packageId: foodPackage.package_id,
            reason: foodPackage.cancellation_reason
          });
          // İsteğe bağlı: İptal bildirimi de gönderebilirsiniz
        }
      }
    }
  });

  FoodPackage.associate = function(models) {
    FoodPackage.hasOne(models.PackageLocation, {
      foreignKey: 'package_id',
      as: 'location'
    });
    FoodPackage.hasOne(models.PackageLocation, {
      foreignKey: 'package_id',
      as: 'packageLocation'
    });
    FoodPackage.belongsTo(models.Seller, {
      foreignKey: 'seller_id',
      as: 'seller'
    });

    if (models.Category) {
      FoodPackage.belongsTo(models.Category, {
        foreignKey: 'category_id',
        as: 'category'
      });
    }
    FoodPackage.hasMany(models.PackageImage, {
      foreignKey: 'package_id',
      as: 'images', // ✨ Bunu kullanarak `include: [{ model: PackageImage, as: 'images' }]` yapabileceksin
      onDelete: 'CASCADE'
    });
  };



  return FoodPackage;
};
