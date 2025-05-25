const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  user_id: { 
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true, 
    autoIncrement: true 
  },
  email: { 
    type: DataTypes.STRING(255),
    unique: true, 
    allowNull: false, 
    validate: { isEmail: true } 
  },
  password_hash: { 
    type: DataTypes.STRING(255),
    allowNull: false 
  },
  phone_number: { 
    type: DataTypes.STRING(20),
    unique: true, 
    allowNull: false 
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  last_login: { 
    type: DataTypes.DATE, 
    allowNull: true 
  },
  account_status: { 
    type: DataTypes.ENUM('active', 'suspended', 'inactive'),
    allowNull: true,
    defaultValue: 'active' 
  },
  two_factor_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  }
}, {
  tableName: 'Users',
  timestamps: false,
  underscored: false
});

// İlişkileri tanımlayalım
User.associate = function(models) {
  // Seller ile ilişki
  if (models.Seller) {
    User.hasOne(models.Seller, { 
      foreignKey: 'user_id',
      as: 'seller'
    });
  }
  
  // PaymentCard ile ilişki - SADECE MODEL VARSA KURULUYOR
  if (models.PaymentCard) {
    User.hasMany(models.PaymentCard, {
      foreignKey: 'user_id',
      as: 'paymentCards'
    });
    
    // Varsayılan ödeme kartı için özel ilişki
    User.hasOne(models.PaymentCard, {
      foreignKey: 'user_id',
      as: 'defaultPaymentCard',
      scope: {
        is_default: true,
        is_active: true
      }
    });
  }
  
  // Location ile ilişki (eğer varsa)
  if (models.Location) {
    User.hasMany(models.Location, {
      foreignKey: 'user_id',
      as: 'addresses'
    });
    
    User.hasOne(models.Location, {
      foreignKey: 'user_id',
      as: 'defaultAddress',
      scope: {
        is_default: true
      }
    });
  }
};

module.exports = User;