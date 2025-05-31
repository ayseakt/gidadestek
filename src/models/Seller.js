// models/Seller.js - DÜZELTME
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Seller = sequelize.define('Seller', {
  seller_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: 'user', // Tablo adı 'users' olmalı
      key: 'user_id'
    }
  },
  business_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  business_type: {
    type: DataTypes.ENUM('restaurant', 'market', 'cafe', 'bakery', 'grocery', 'other'),
    allowNull: true
  },
  business_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tax_id: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  rating: {
    type: DataTypes.DECIMAL(3,2),
    allowNull: true
  },
  total_ratings: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'sellers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// ASSOCIATIONS
Seller.associate = function(models) {
  console.log('🔗 Seller associations kuruluyor...');
  
  // User ile many-to-one ilişki
  Seller.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });

  // Orders ile one-to-many ilişki
  Seller.hasMany(models.Order, {
    foreignKey: 'seller_id',
    as: 'orders'
  });

  // FoodPackages ile one-to-many ilişki
  Seller.hasMany(models.FoodPackage, {
    foreignKey: 'seller_id',
    as: 'packages'
  });

  // Reviews ile one-to-many ilişki
  Seller.hasMany(models.Review, {
    foreignKey: 'seller_id',
    as: 'reviews'
  });
};

module.exports = Seller;