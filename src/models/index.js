const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

console.log('=== MODEL YÜKLEME BAŞLADI ===');

try {
  // 🔥 KONSISTEN MODEL YÜKLEME - HEPSİ AYNI YÖNTEMİ KULLANIYOR
  
  // Direkt export edilenler (sequelize.define ile tanımlanmış)
  const User = require('./User');
  const UserProfile = require('./UserProfile');
  const Location = require('./Location');
  const PackageCategory = require('./PackageCategory');
  const PackageImage = require('./PackageImage');
  const PackageAvailability = require('./PackageAvailability');
  const Seller = require('./Seller'); // 🔥 ARTIK DİREKT IMPORT

  // Function olarak export edilenler (sequelize, DataTypes parametreli)
  const FoodPackage = require('./FoodPackage')(sequelize, DataTypes);
  const PackageLocation = require('./PackageLocation')(sequelize, DataTypes);
  const PackageOrder = require('./PackageOrder')(sequelize, DataTypes);
  const CartItem = require('./CartItem')(sequelize, DataTypes);
  const Order = require('./Order')(sequelize, DataTypes);
  const OrderItem = require('./OrderItem')(sequelize, DataTypes);
  const OrderStatusHistory = require('./OrderStatusHistory')(sequelize, DataTypes);
  const Review = require('./Review')(sequelize, DataTypes);
 

  // 🔥 TÜM MODELLERİ BİR OBJEDE TOPLUYORUZ
  const models = {
    Sequelize,
    sequelize,
    User,
    UserProfile,
    Location,
    Seller, // 🔥 DÜZELTİLDİ
    FoodPackage,
    PackageCategory,
    PackageImage,
    PackageAvailability,
    PackageLocation,
    PackageOrder,
    CartItem,
    Order,
    OrderItem,
    OrderStatusHistory,
    Review
  };

  // 🔥 DEBUG: Hangi modellerin yüklendiğini kontrol et
  console.log('\n=== YÜKLENEN MODELLER ===');
  Object.keys(models).forEach(modelName => {
    if (modelName !== 'Sequelize' && modelName !== 'sequelize') {
      const model = models[modelName];
      const isSequelizeModel = model && typeof model.findAll === 'function';
      const hasAssociate = model && typeof model.associate === 'function';
      console.log(`${modelName}: ${isSequelizeModel ? '✅' : '❌'} Model | ${hasAssociate ? '🔗' : '⚪'} Associate`);
    }
  });

  // 🔥 ASSOCIATION KURMA
  console.log('\n=== ASSOCIATION KURMA BAŞLADI ===');
  
  Object.keys(models).forEach(modelName => {
    if (modelName !== 'Sequelize' && modelName !== 'sequelize') {
      const model = models[modelName];
      if (model && typeof model.associate === 'function') {
        console.log(`🔗 ${modelName} associations kuruluyor...`);
        try {
          model.associate(models);
          console.log(`✅ ${modelName} associations kuruldu`);
        } catch (assocError) {
          console.error(`❌ ${modelName} association hatası:`, assocError.message);
        }
      }
    }
  });

  // 🔥 KRİTİK İLİŞKİLERİ MANUEL KONTROL ET VE YOKSA KUR
  console.log('\n=== KRİTİK İLİŞKİLER KONTROL EDİLİYOR ===');

  // Order -> Seller ilişkisi (EN ÖNEMLİSİ)
  if (!models.Order.associations?.seller) {
    console.log('⚠️ Order -> Seller ilişkisi eksik, manuel kuruluyor...');
    models.Order.belongsTo(models.Seller, {
      foreignKey: 'seller_id',
      as: 'seller'
    });
    console.log('✅ Order -> Seller ilişkisi manuel kuruldu');
  }

  // Seller -> User ilişkisi
  if (!models.Seller.associations?.user) {
    console.log('⚠️ Seller -> User ilişkisi eksik, manuel kuruluyor...');
    models.Seller.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    console.log('✅ Seller -> User ilişkisi manuel kuruldu');
  }

  // Order -> User ilişkisi
  if (!models.Order.associations?.user) {
    models.Order.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    console.log('✅ Order -> User ilişkisi manuel kuruldu');
  }

  // Order -> OrderItem ilişkisi
  if (!models.Order.associations?.items) {
    models.Order.hasMany(models.OrderItem, {
      foreignKey: 'order_id',
      as: 'items'
    });
    console.log('✅ Order -> OrderItem ilişkisi manuel kuruldu');
  }

  // OrderItem -> FoodPackage ilişkisi
  if (models.OrderItem && !models.OrderItem.associations?.package) {
    models.OrderItem.belongsTo(models.FoodPackage, {
      foreignKey: 'package_id',
      as: 'package'
    });
    console.log('✅ OrderItem -> FoodPackage ilişkisi manuel kuruldu');
  }

  // 🔥 ASSOCIATIONs KONTROLÜ
  console.log('\n=== ASSOCIATION KONTROLÜ ===');
  ['Order', 'Seller', 'User', 'OrderItem'].forEach(modelName => {
    const model = models[modelName];
    if (model && model.associations) {
      const assocNames = Object.keys(model.associations);
      console.log(`${modelName}: ${assocNames.join(', ')}`);
    } else {
      console.log(`${modelName}: ❌ Association yok`);
    }
  });

  console.log('\n=== MODEL YÜKLEME TAMAMLANDI ===');
  module.exports = models;

} catch (loadError) {
  console.error('❌ Model yükleme hatası:', loadError);
  process.exit(1);
}