// models/PackageLocation.js
module.exports = (sequelize, DataTypes) => {
  const PackageLocation = sequelize.define('PackageLocation', {
    location_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    package_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'food_packages',
        key: 'package_id'
      }
    },
    location_type: {
      type: DataTypes.ENUM('manual', 'saved'),
      allowNull: true,
      defaultValue: 'manual'
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // ⭐ BURADAKİ EKLENTİLER: district ve city sütunları
    district: {
      type: DataTypes.STRING(255), // String veri tipi ve maksimum uzunluk
      allowNull: true // Bu alanın boş bırakılıp bırakılamayacağını belirler
    },
    city: {
      type: DataTypes.STRING(255), // String veri tipi ve maksimum uzunluk
      allowNull: true // Bu alanın boş bırakılıp bırakılamayacağını belirler
    },
    saved_location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Kayıtlı lokasyon kullanılıyorsa bu alan doldurulur'
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
    }
  }, {
    tableName: 'package_locations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    charset: 'utf8mb4',
    collate: 'utf8mb4_turkish_ci'
  });

  PackageLocation.associate = function(models) {
    PackageLocation.belongsTo(models.FoodPackage, {
      foreignKey: 'package_id',
      as: 'package'
    });

    if (models.SavedLocation) {
      PackageLocation.belongsTo(models.SavedLocation, {
        foreignKey: 'saved_location_id',
        as: 'savedLocation'
      });
    }
  };

  return PackageLocation;
};