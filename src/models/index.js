const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// ⭐ ÖNCE TÜM MODELLERİ YÜKLEYELİM
console.log('=== MODEL YÜKLEME BAŞLADI ===');

// Sequelize modellerini yükle
const FoodPackage = require('./FoodPackage')(sequelize, DataTypes);
const PackageLocation = require('./PackageLocation')(sequelize, DataTypes);
const PackageOrder = require('./PackageOrder')(sequelize, DataTypes);
const CartItem = require('./CartItem')(sequelize, DataTypes);

// Diğer modeller (bu modellerin export yapısını kontrol edin)
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
  CartItem
};

// ⭐ DEBUG: Hangi modellerin yüklendiğini kontrol et
console.log('=== YÜKLENEN MODELLER ===');
Object.keys(models).forEach(modelName => {
  if (modelName !== 'Sequelize' && modelName !== 'sequelize') {
    const isSequelizeModel = models[modelName] && typeof models[modelName].findAll === 'function';
    console.log(`${modelName}: ${isSequelizeModel ? '✅' : '❌'} ${!!models[modelName] ? 'Loaded' : 'Missing'}`);
  }
});

// ⭐ ARTIK ASSOCIATIONları KURABILIRIZ
console.log('\n=== ASSOCIATION KURMA BAŞLADI ===');
try {
  // Her modelin associate function'ı varsa çalıştır
  Object.keys(models).forEach(modelName => {
    if (modelName !== 'Sequelize' && modelName !== 'sequelize') {
      const model = models[modelName];
      if (model && typeof model.associate === 'function') {
        model.associate(models);
        console.log(`✅ ${modelName} associations set up`);
      }
    }
  });

  // ⭐ EK İLİŞKİLER (Eksik olanları manuel ekle)
  console.log('\n=== EK İLİŞKİLER KURULUYOR ===');

  // User ilişkileri
  if (models.User && models.UserProfile) {
    models.User.hasOne(models.UserProfile, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    models.UserProfile.belongsTo(models.User, { foreignKey: 'user_id' });
    console.log('✅ User-UserProfile ilişkisi kuruldu');
  }

  if (models.User && models.Seller) {
    models.User.hasOne(models.Seller, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    models.Seller.belongsTo(models.User, { foreignKey: 'user_id' });
    console.log('✅ User-Seller ilişkisi kuruldu');
  }

  if (models.User && models.Location) {
    models.User.hasMany(models.Location, { foreignKey: 'user_id' });
    models.Location.belongsTo(models.User, { foreignKey: 'user_id' });
    console.log('✅ User-Location ilişkisi kuruldu');
  }

  // ⭐ HATA ÇÖZÜMÜ: Association'ları kontrol et ve sadece eksik olanları ekle
  if (models.FoodPackage && models.PackageLocation) {
    console.log('FoodPackage mevcut associations:', Object.keys(models.FoodPackage.associations || {}));
    console.log('PackageLocation mevcut associations:', Object.keys(models.PackageLocation.associations || {}));
    
    // FoodPackage -> PackageLocation ilişkisi zaten FoodPackage.js'de tanımlı
    // Sadece PackageLocation -> FoodPackage ilişkisini kontrol et
    if (!models.PackageLocation.associations || !models.PackageLocation.associations.foodPackage) {
      models.PackageLocation.belongsTo(models.FoodPackage, {
        foreignKey: 'package_id',
        as: 'foodPackage' // ⭐ FARKLI ALIAS KULLAN (package yerine foodPackage)
      });
      console.log('✅ PackageLocation -> FoodPackage ilişkisi kuruldu (foodPackage alias)');
    } else {
      console.log('⚠️ PackageLocation -> FoodPackage ilişkisi zaten mevcut');
    }
  }

  if (models.Seller && models.FoodPackage) {
    // Bu ilişki zaten FoodPackage.js'de tanımlı olabilir, kontrol et
    if (!models.Seller.associations || !models.Seller.associations.packages) {
      models.Seller.hasMany(models.FoodPackage, {
        foreignKey: 'seller_id',
        as: 'packages'
      });
      console.log('✅ Seller -> FoodPackage ilişkisi kuruldu');
    } else {
      console.log('⚠️ Seller -> FoodPackage ilişkisi zaten mevcut');
    }
  }

  // CartItem reverse ilişkileri - ÖNEMLİ!
  if (models.CartItem && models.User && models.FoodPackage) {
    // User ile CartItem ilişkisi
    if (!models.User.associations || !models.User.associations.cartItems) {
      models.User.hasMany(models.CartItem, {
        foreignKey: 'user_id',
        as: 'cartItems'
      });
      console.log('✅ User -> CartItem ilişkisi kuruldu');
    }
    
    // FoodPackage ile CartItem ilişkisi
    if (!models.FoodPackage.associations || !models.FoodPackage.associations.cartItems) {
      models.FoodPackage.hasMany(models.CartItem, {
        foreignKey: 'package_id',
        as: 'cartItems'
      });
      console.log('✅ FoodPackage -> CartItem ilişkisi kuruldu');
    }
  }

  // PackageOrder ilişkileri
  if (models.PackageOrder && models.FoodPackage && models.User) {
    // Mevcut association'ları kontrol et
    const orderAssociations = Object.keys(models.PackageOrder.associations || {});
    const packageAssociations = Object.keys(models.FoodPackage.associations || {});
    const userAssociations = Object.keys(models.User.associations || {});

    if (!orderAssociations.includes('FoodPackage')) {
      models.PackageOrder.belongsTo(models.FoodPackage, { foreignKey: 'package_id' });
      console.log('✅ PackageOrder -> FoodPackage ilişkisi kuruldu');
    }

    if (!orderAssociations.includes('User')) {
      models.PackageOrder.belongsTo(models.User, { foreignKey: 'user_id' });
      console.log('✅ PackageOrder -> User ilişkisi kuruldu');
    }

    if (!packageAssociations.includes('PackageOrders')) {
      models.FoodPackage.hasMany(models.PackageOrder, { 
        foreignKey: 'package_id',
        as: 'PackageOrders'
      });
      console.log('✅ FoodPackage -> PackageOrder ilişkisi kuruldu');
    }

    if (!userAssociations.includes('PackageOrders')) {
      models.User.hasMany(models.PackageOrder, { 
        foreignKey: 'user_id',
        as: 'PackageOrders'
      });
      console.log('✅ User -> PackageOrder ilişkisi kuruldu');
    }
  }

  console.log('\n=== TÜM ASSOCIATIONs BAŞARIYLA KURULDU ===');

} catch (relationError) {
  console.error('❌ İlişki kurma hatası:', relationError);
  console.error('Error stack:', relationError.stack);
}

console.log('\n=== MODEL INDEX TAMAMLANDI ===');

module.exports = models;