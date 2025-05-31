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
  console.log('🔗 User associations kuruluyor...');
  
  // UserProfile ile ilişki - EN ÖNEMLİSİ
  if (models.UserProfile) {
    User.hasOne(models.UserProfile, { 
      foreignKey: 'user_id',
      as: 'profile'
    });
    console.log('✅ User -> UserProfile (profile) ilişkisi kuruldu');
  }
  
  // Seller ile ilişki - TEK ALIAS KULLAN
  if (models.Seller) {
    User.hasOne(models.Seller, { 
      foreignKey: 'user_id',
      as: 'seller'
    });
    console.log('✅ User -> Seller (seller) ilişkisi kuruldu');
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
    console.log('✅ User -> Location ilişkileri kuruldu');
  }
  
  // Order ile ilişki
  if (models.Order) {
    User.hasMany(models.Order, {
      foreignKey: 'user_id',
      as: 'orders'
    });
    console.log('✅ User -> Order ilişkisi kuruldu');
  }
  
  // CartItem ile ilişki
  if (models.CartItem) {
    User.hasMany(models.CartItem, {
      foreignKey: 'user_id',
      as: 'cartItems'
    });
    console.log('✅ User -> CartItem ilişkisi kuruldu');
  }
  
  // Review ile ilişki
  if (models.Review) {
    User.hasMany(models.Review, {
      foreignKey: 'user_id',
      as: 'reviews'
    });
    console.log('✅ User -> Review ilişkisi kuruldu');
  }
};

module.exports = User;