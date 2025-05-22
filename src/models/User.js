const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');  // BURASI ÖNEMLİ
const Seller = require('./Seller');

const User = sequelize.define('User', {
  user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: false, validate: { isEmail: true } },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  phone_number: { type: DataTypes.STRING, unique: true, allowNull: false },
  account_status: { type: DataTypes.ENUM('active', 'inactive', 'suspended'), defaultValue: 'active' },
  last_login: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'Users',
  timestamps: false
});
User.hasOne(Seller, { foreignKey: 'user_id' });
Seller.belongsTo(User, { foreignKey: 'user_id' });
module.exports = User;
