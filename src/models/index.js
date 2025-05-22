const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// ⭐ DÜZELTME: Modelleri tutarlı şekilde yükle
const FoodPackage = require('./FoodPackage')(sequelize, DataTypes);
const PackageLocation = require('./PackageLocation')(sequelize, DataTypes);
const PackageOrder = require('./PackageOrder')(sequelize, DataTypes);

// Diğer modeller (bu modellerin nasıl export edildiğini kontrol edin)
const User = require('./User');
const UserProfile = require('./UserProfile');
const Location = require('./Location');
const Seller = require('./Seller');
const PackageCategory = require('./PackageCategory');
const PackageImage = require('./PackageImage');
const PackageAvailability = require('./PackageAvailability');

// ⭐ DEBUG: Model yüklemelerini kontrol et
console.log('=== MODEL YÜKLEME KONTROLLERI ===');
console.log('FoodPackage loaded:', !!FoodPackage);
console.log('PackageLocation loaded:', !!PackageLocation);
console.log('Seller loaded:', !!Seller);
console.log('PackageOrder loaded:', !!PackageOrder);

// ⭐ DÜZELTME: Modellerin Sequelize model olup olmadığını kontrol et
console.log('FoodPackage is Sequelize Model:', FoodPackage && typeof FoodPackage.findAll === 'function');
console.log('PackageLocation is Sequelize Model:', PackageLocation && typeof PackageLocation.findAll === 'function');
console.log('Seller is Sequelize Model:', Seller && typeof Seller.findAll === 'function');

// ⭐ DÜZELTME: İLİŞKİLERİ DAHA GÜVENLİ ŞEKİLDE KUR
try {
  // Temel User ilişkileri
  if (User && UserProfile) {
    User.hasOne(UserProfile, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    UserProfile.belongsTo(User, { foreignKey: 'user_id' });
    console.log('✅ User-UserProfile ilişkisi kuruldu');
  }

  // Seller ilişkisi
  if (User && Seller) {
    User.hasOne(Seller, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    Seller.belongsTo(User, { foreignKey: 'user_id' });
    console.log('✅ User-Seller ilişkisi kuruldu');
  }

  // Location ilişkisi
  if (User && Location) {
    User.hasMany(Location, { foreignKey: 'user_id' });
    Location.belongsTo(User, { foreignKey: 'user_id' });
    console.log('✅ User-Location ilişkisi kuruldu');
  }

  // ⭐ ÖNEMLİ: FoodPackage ile PackageLocation ilişkisi
  if (FoodPackage && PackageLocation) {
    FoodPackage.hasOne(PackageLocation, {
      foreignKey: 'package_id',
      as: 'location'
    });

    PackageLocation.belongsTo(FoodPackage, {
      foreignKey: 'package_id',
      as: 'package'
    });
    console.log('✅ FoodPackage-PackageLocation ilişkisi kuruldu');
  } else {
    console.error('❌ FoodPackage veya PackageLocation modeli bulunamadı!');
    console.log('FoodPackage:', !!FoodPackage);
    console.log('PackageLocation:', !!PackageLocation);
  }

  // ⭐ EKSİK İLİŞKİ: Seller ile FoodPackage
  if (Seller && FoodPackage) {
    Seller.hasMany(FoodPackage, {
      foreignKey: 'seller_id',
      as: 'packages'
    });
    
    FoodPackage.belongsTo(Seller, {
      foreignKey: 'seller_id',
      as: 'seller'
    });
    console.log('✅ Seller-FoodPackage ilişkisi kuruldu');
  }

  // PackageOrder ilişkileri (eğer varsa)
  if (PackageOrder && FoodPackage && User) {
    PackageOrder.belongsTo(FoodPackage, { foreignKey: 'package_id' });
    PackageOrder.belongsTo(User, { foreignKey: 'user_id' });
    FoodPackage.hasMany(PackageOrder, { foreignKey: 'package_id' });
    User.hasMany(PackageOrder, { foreignKey: 'user_id' });
    console.log('✅ PackageOrder ilişkileri kuruldu');
  }

} catch (relationError) {
  console.error('❌ İlişki kurma hatası:', relationError);
  console.error('Error stack:', relationError.stack);
}

// ⭐ DÜZELTME: Modelleri export etmeden önce kontrol et
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
  PackageLocation
};

// Export edilen modelleri kontrol et
console.log('=== EXPORT KONTROLLERI ===');
Object.keys(models).forEach(modelName => {
  if (modelName !== 'Sequelize' && modelName !== 'sequelize') {
    console.log(`${modelName}:`, !!models[modelName]);
  }
});

console.log('=== MODEL INDEX BAŞARIYLA YÜKLENDİ ===');

module.exports = models;