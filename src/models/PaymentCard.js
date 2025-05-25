const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const crypto = require('crypto');

const PaymentCard = sequelize.define('PaymentCard', {
  card_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'user_id'
    }
  },
  card_number_encrypted: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  card_holder_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [2, 100],
      notEmpty: true
    }
  },
  expiry_month: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    validate: {
      min: 1,
      max: 12
    }
  },
  expiry_year: {
    type: DataTypes.SMALLINT.UNSIGNED,
    allowNull: false,
    validate: {
      min: new Date().getFullYear()
    }
  },
  card_token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  last_four_digits: {
    type: DataTypes.CHAR(4),
    allowNull: false,
    validate: {
      is: /^[0-9]{4}$/
    }
  },
  card_type: {
    type: DataTypes.ENUM('credit', 'debit'),
    allowNull: false,
    defaultValue: 'credit'
  },
  card_brand: {
    type: DataTypes.ENUM('visa', 'mastercard', 'amex', 'discover', 'diners', 'jcb', 'unionpay'),
    allowNull: false
  },
  card_nickname: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: [0, 50]
    }
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  last_used_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  failed_attempts: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    validate: {
      max: 10
    }
  },
  blocked_until: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'user_payment_cards',
  timestamps: false, // Manuel yönetim
  underscored: false,
  hooks: {
    // Yeni kart eklenirken
    beforeCreate: async (card, options) => {
      // Token oluştur
      card.card_token = crypto.randomBytes(32).toString('hex');
      
      // Eğer varsayılan kart ise, diğerlerini güncelle
      if (card.is_default) {
        await PaymentCard.update(
          { is_default: false },
          { 
            where: { 
              user_id: card.user_id,
              is_default: true 
            },
            transaction: options.transaction
          }
        );
      }
    },
    
    // Kart güncellenirken
    beforeUpdate: async (card, options) => {
      card.updated_at = new Date();
      
      // Eğer varsayılan kart yapılıyorsa
      if (card.is_default && card.changed('is_default')) {
        await PaymentCard.update(
          { is_default: false },
          { 
            where: { 
              user_id: card.user_id,
              card_id: { [sequelize.Sequelize.Op.ne]: card.card_id },
              is_default: true 
            },
            transaction: options.transaction
          }
        );
      }
    }
  }
});

// İlişkiler
PaymentCard.associate = function(models) {
  PaymentCard.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
};

// Yardımcı metodlar
PaymentCard.prototype.isExpired = function() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  return this.expiry_year < currentYear || 
         (this.expiry_year === currentYear && this.expiry_month < currentMonth);
};

PaymentCard.prototype.isBlocked = function() {
  return this.blocked_until && new Date() < this.blocked_until;
};

PaymentCard.prototype.getMaskedNumber = function() {
  return `**** **** **** ${this.last_four_digits}`;
};

PaymentCard.prototype.getDisplayName = function() {
  return this.card_nickname || 
         `${this.card_brand.toUpperCase()} *${this.last_four_digits}`;
};

// Statik metodlar
PaymentCard.encryptCardNumber = function(cardNumber, encryptionKey) {
  const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
  let encrypted = cipher.update(cardNumber, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

PaymentCard.decryptCardNumber = function(encryptedNumber, encryptionKey) {
  const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
  let decrypted = decipher.update(encryptedNumber, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Kart markasını belirle
PaymentCard.detectCardBrand = function(cardNumber) {
  const number = cardNumber.replace(/\s/g, '');
  
  if (/^4/.test(number)) return 'visa';
  if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) return 'mastercard';
  if (/^3[47]/.test(number)) return 'amex';
  if (/^6(?:011|5)/.test(number)) return 'discover';
  if (/^3[0689]/.test(number)) return 'diners';
  if (/^35/.test(number)) return 'jcb';
  if (/^62/.test(number)) return 'unionpay';
  
  return 'visa'; // Varsayılan
};

module.exports = PaymentCard;