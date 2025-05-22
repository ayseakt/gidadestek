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
    allowNull: false
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
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false, // Eğer created_at ve updated_at otomatik yönetilmiyorsa
  tableName: 'sellers' // Tablo adını açıkça belirt
});

module.exports = Seller;