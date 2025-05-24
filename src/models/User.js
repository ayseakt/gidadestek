const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Seller = require('./Seller');

const User = sequelize.define('User', {
  user_id: { 
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true, 
    autoIncrement: true 
  },
  email: { 
    type: DataTypes.STRING(255), // Veritabanınızla uyumlu
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
  // Veritabanınızda olmayan alanları kaldırdık:
  // - email_verified
  // - phone_verified  
  // - two_factor_secret
  // - updated_at
}, {
  tableName: 'Users',
  timestamps: false, // created_at'i manuel yönetiyoruz
  underscored: false // veritabanı alan adları snake_case değil
});

// İlişkileri tanımlayalım
User.associate = function(models) {
  // Seller ile ilişki
  User.hasOne(models.Seller, { 
    foreignKey: 'user_id',
    as: 'seller'
  });
  
  // Location ile ilişki (eğer varsa)
  if (models.Location) {
    User.hasMany(models.Location, {
      foreignKey: 'user_id',
      as: 'addresses'
    });
    
    // Varsayılan adres için özel ilişki
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