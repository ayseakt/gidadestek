// models/TwoFactorAuth.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TwoFactorAuth = sequelize.define('TwoFactorAuth', {
  tfa_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'user_id'
    }
  },
  is_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  verification_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  code_expiry: {
    type: DataTypes.DATE,
    allowNull: true
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
  }
}, {
  tableName: 'TwoFactorAuth',
  timestamps: false
});

module.exports = TwoFactorAuth;