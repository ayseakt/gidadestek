const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// ⭐ ÖNCE TÜM MODELLERİ YÜKLEYELİM
console.log('=== MODEL YÜKLEME BAŞLADI ===');

// ⭐ ESKİ ÇALIŞAN YÖNTEMİ KULLAN - SONRA DÜZELTELİM
try {
  // Function olarak export edilenler (sequelize, DataTypes) ile çağırılıyor
  const FoodPackage = require('./FoodPackage')(sequelize, DataTypes);
  const PackageLocation = require('./PackageLocation')(sequelize, DataTypes);
  const PackageOrder = require('./PackageOrder')(sequelize, DataTypes);
  const CartItem = require('./CartItem')(sequelize, DataTypes);
  const Order = require('./Order')(sequelize, DataTypes);
  const OrderItem = require('./OrderItem')(sequelize, DataTypes);
  const OrderStatusHistory = require('./OrderStatusHistory')(sequelize, DataTypes);
  
  // Direkt export edilenler
  const User = require('./User');
  const UserProfile = require('./UserProfile');
  const Location = require('./Location');
  const Seller = require('./Seller');
  const PackageCategory = require('./PackageCategory');
  const PackageImage = require('./PackageImage');
  const PackageAvailability = require('./PackageAvailability');

  // ⭐ TÜM MODELLERİ BİR OBJEDE TOPLUYORUZ
  const models = {
    Sequelize,
    sequelize,
    User,
    UserProfile,
    Location,
    FoodPackage,
    PackageCategory,
    PackageImage,
    PackageAvailability,
    PackageOrder,
    Seller,
    PackageLocation,
    CartItem,
    Order,
    OrderItem,
    OrderStatusHistory
  };

  // ⭐ DEBUG: Hangi modellerin yüklendiğini kontrol et
  console.log('\n=== YÜKLENEN MODELLER ===');
  Object.keys(models).forEach(modelName => {
    if (modelName !== 'Sequelize' && modelName !== 'sequelize') {
      const model = models[modelName];
      const isSequelizeModel = model && typeof model.findAll === 'function';
      const hasAssociate = model && typeof model.associate === 'function';
      console.log(`${modelName}: ${isSequelizeModel ? '✅' : '❌'} Model | ${hasAssociate ? '🔗' : '⚪'} Associate`);
      
      // Model doğru yüklenmemişse detayları göster
      if (!isSequelizeModel && model) {
        console.log(`  └── ${modelName} tipi:`, typeof model);
        console.log(`  └── ${modelName} keys:`, Object.keys(model).slice(0, 5));
      }
    }
  });

  // ⭐ ARTIK ASSOCIATIONları KURABILIRIZ
  console.log('\n=== ASSOCIATION KURMA BAŞLADI ===');
  
  // Her modelin associate function'ı varsa çalıştır
  Object.keys(models).forEach(modelName => {
    if (modelName !== 'Sequelize' && modelName !== 'sequelize') {
      const model = models[modelName];
      if (model && typeof model.associate === 'function') {
        console.log(`🔗 ${modelName} associations kuruluyor...`);
        try {
          model.associate(models);
          console.log(`✅ ${modelName} associations set up`);
        } catch (assocError) {
          console.error(`❌ ${modelName} association hatası:`, assocError.message);
          
          // Order modelindeki özel hata için kontrol
          if (modelName === 'Order' && assocError.message.includes("not a subclass of Sequelize.Model")) {
            console.error(`  └── Order modelinde association hatası var. Order.js dosyasını kontrol edin.`);
            console.error(`  └── Hata: ${assocError.message}`);
          }
          
          // Hangi modelin eksik olduğunu bul
          const missingModels = [];
          Object.keys(models).forEach(checkModel => {
            if (checkModel !== 'Sequelize' && checkModel !== 'sequelize') {
              const checkModelObj = models[checkModel];
              if (!checkModelObj || typeof checkModelObj.findAll !== 'function') {
                missingModels.push(checkModel);
              }
            }
          });
          if (missingModels.length > 0) {
            console.error(`  └── Eksik/hatalı modeller: ${missingModels.join(', ')}`);
          }
        }
      }
    }
  });

  // ⭐ EK İLİŞKİLER (Eksik olanları manuel ekle)
  console.log('\n=== EK İLİŞKİLER KURULUYOR ===');

  // User ilişkileri
  if (models.User && models.UserProfile) {
    if (!models.User.associations?.UserProfile) {
      models.User.hasOne(models.UserProfile, { foreignKey: 'user_id', onDelete: 'CASCADE' });
      models.UserProfile.belongsTo(models.User, { foreignKey: 'user_id' });
      console.log('✅ User-UserProfile ilişkisi kuruldu');
    }
  }

  if (models.User && models.Seller) {
    if (!models.User.associations?.Seller) {
      models.User.hasOne(models.Seller, { foreignKey: 'user_id', onDelete: 'CASCADE' });
      models.Seller.belongsTo(models.User, { foreignKey: 'user_id' });
      console.log('✅ User-Seller ilişkisi kuruldu');
    }
  }

  if (models.User && models.Location) {
    if (!models.User.associations?.Locations) {
      models.User.hasMany(models.Location, { foreignKey: 'user_id' });
      models.Location.belongsTo(models.User, { foreignKey: 'user_id' });
      console.log('✅ User-Location ilişkisi kuruldu');
    }
  }

  // PackageLocation ilişkileri
  if (models.FoodPackage && models.PackageLocation) {
    if (!models.PackageLocation.associations?.foodPackage) {
      models.PackageLocation.belongsTo(models.FoodPackage, {
        foreignKey: 'package_id',
        as: 'foodPackage'
      });
      console.log('✅ PackageLocation -> FoodPackage ilişkisi kuruldu');
    }
  }

  // Seller ilişkileri
  if (models.Seller && models.FoodPackage) {
    if (!models.Seller.associations?.packages) {
      models.Seller.hasMany(models.FoodPackage, {
        foreignKey: 'seller_id',
        as: 'packages'
      });
      console.log('✅ Seller -> FoodPackage ilişkisi kuruldu');
    }
  }

  // CartItem reverse ilişkileri
  if (models.CartItem && models.User && models.FoodPackage) {
    if (!models.User.associations?.cartItems) {
      models.User.hasMany(models.CartItem, {
        foreignKey: 'user_id',
        as: 'cartItems'
      });
      console.log('✅ User -> CartItem ilişkisi kuruldu');
    }
    
    if (!models.FoodPackage.associations?.cartItems) {
      models.FoodPackage.hasMany(models.CartItem, {
        foreignKey: 'package_id',
        as: 'cartItems'
      });
      console.log('✅ FoodPackage -> CartItem ilişkisi kuruldu');
    }
  }

  // PackageOrder ilişkileri
  if (models.PackageOrder && models.FoodPackage && models.User) {
    if (!models.PackageOrder.associations?.FoodPackage) {
      models.PackageOrder.belongsTo(models.FoodPackage, { foreignKey: 'package_id' });
      console.log('✅ PackageOrder -> FoodPackage ilişkisi kuruldu');
    }

    if (!models.PackageOrder.associations?.User) {
      models.PackageOrder.belongsTo(models.User, { foreignKey: 'user_id' });
      console.log('✅ PackageOrder -> User ilişkisi kuruldu');
    }

    if (!models.FoodPackage.associations?.PackageOrders) {
      models.FoodPackage.hasMany(models.PackageOrder, { 
        foreignKey: 'package_id',
        as: 'PackageOrders'
      });
      console.log('✅ FoodPackage -> PackageOrder ilişkisi kuruldu');
    }

    if (!models.User.associations?.PackageOrders) {
      models.User.hasMany(models.PackageOrder, { 
        foreignKey: 'user_id',
        as: 'PackageOrders'
      });
      console.log('✅ User -> PackageOrder ilişkisi kuruldu');
    }
  }

  // Order ilişkilerini manuel olarak kur (eğer Order.associate() çalışmadıysa)
  if (models.Order && models.User && models.Seller && models.OrderItem && models.OrderStatusHistory) {
    try {
      // Eğer Order associations kurulamadıysa, manuel olarak kur
      if (!models.Order.associations?.user) {
        models.Order.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        console.log('✅ Order -> User ilişkisi manuel kuruldu');
      }
      
      if (!models.Order.associations?.seller) {
        models.Order.belongsTo(models.Seller, { foreignKey: 'seller_id', as: 'seller' });
        console.log('✅ Order -> Seller ilişkisi manuel kuruldu');
      }
      
      if (!models.Order.associations?.items) {
        models.Order.hasMany(models.OrderItem, { foreignKey: 'order_id', as: 'items' });
        console.log('✅ Order -> OrderItem ilişkisi manuel kuruldu');
      }

      if (!models.Order.associations?.statusHistory) {
        models.Order.hasMany(models.OrderStatusHistory, { foreignKey: 'order_id', as: 'statusHistory' });
        console.log('✅ Order -> OrderStatusHistory ilişkisi manuel kuruldu');
      }

      // Reverse associations
      if (!models.User.associations?.orders) {
        models.User.hasMany(models.Order, { foreignKey: 'user_id', as: 'orders' });
        console.log('✅ User -> Order ilişkisi manuel kuruldu');
      }

      if (!models.Seller.associations?.orders) {
        models.Seller.hasMany(models.Order, { foreignKey: 'seller_id', as: 'orders' });
        console.log('✅ Seller -> Order ilişkisi manuel kuruldu');
      }

      if (!models.OrderStatusHistory.associations?.order) {
        models.OrderStatusHistory.belongsTo(models.Order, { foreignKey: 'order_id', as: 'order' });
        console.log('✅ OrderStatusHistory -> Order ilişkisi manuel kuruldu');
      }

      if (!models.OrderStatusHistory.associations?.changedBy) {
        models.OrderStatusHistory.belongsTo(models.User, { foreignKey: 'changed_by', as: 'changedBy' });
        console.log('✅ OrderStatusHistory -> User ilişkisi manuel kuruldu');
      }
    } catch (manualOrderError) {
      console.error('❌ Order manuel ilişki kurma hatası:', manualOrderError.message);
    }
  }

  console.log('\n=== TÜM ASSOCIATIONs KONTROLÜ ===');
  Object.keys(models).forEach(modelName => {
    if (modelName !== 'Sequelize' && modelName !== 'sequelize') {
      const model = models[modelName];
      if (model && model.associations) {
        const assocNames = Object.keys(model.associations);
        console.log(`${modelName}: ${assocNames.length > 0 ? assocNames.join(', ') : 'İlişki yok'}`);
      }
    }
  });

  console.log('\n=== TÜM ASSOCIATIONs BAŞARIYLA KURULDU ===');
  console.log('\n=== MODEL INDEX TAMAMLANDI ===');

  // ⭐ MODELLERI EXPORT ET
  module.exports = models;

} catch (loadError) {
  console.error('❌ Model yükleme hatası:', loadError.message);
  console.error('Stack:', loadError.stack);
  process.exit(1);
}